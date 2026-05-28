export const dynamic = "force-dynamic";

// POST /api/webhooks/stripe
//
// Stripe calls this when a client pays.
// 1. Mark job as paid
// 2. Send review request SMS + email via the intercept page
//    (clients rate 1-5; only 4-5 stars goes to Google)
// 3. Track that the review request was sent

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { jobs, invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendReviewRequestSms, sendReviewRequestEmail } from "@/lib/review";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const jobId   = session.metadata?.jobId;

    if (jobId) {
      const now = new Date();

      // Mark job paid
      await db
        .update(jobs)
        .set({ status: "paid", paidAt: now, updatedAt: now })
        .where(eq(jobs.id, jobId));

      // Record payment on invoice
      await db
        .update(invoices)
        .set({ paidAt: now })
        .where(eq(invoices.jobId, jobId));

      // ── Review request ──────────────────────────────────────────────────────
      try {
        const job = await db.query.jobs.findFirst({
          where: eq(jobs.id, jobId),
          with: { user: true, client: true },
        });

        const businessName = job?.user?.businessName ?? "Your service provider";
        const client       = job?.client;

        // Only send if the Place ID is configured — otherwise the intercept
        // page still works, but the 4-5 star redirect goes nowhere
        if (client && (client.phone || client.email)) {
          let sent = false;

          if (client.phone) {
            await sendReviewRequestSms({
              to: client.phone, clientName: client.name, businessName, jobId,
            });
            sent = true;
          }

          if (client.email) {
            await sendReviewRequestEmail({
              to: client.email, clientName: client.name, businessName, jobId,
            });
            sent = true;
          }

          if (sent) {
            await db
              .update(invoices)
              .set({ reviewRequestSentAt: now })
              .where(eq(invoices.jobId, jobId));
          }
        }
      } catch (reviewErr) {
        // Don't fail the webhook if the review request fails — payment is already recorded
        console.error("[stripe/webhook] Review request failed:", reviewErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
