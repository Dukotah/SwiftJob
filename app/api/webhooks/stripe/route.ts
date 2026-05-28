export const dynamic = "force-dynamic";

// POST /api/webhooks/stripe
// Stripe calls this URL whenever something important happens —
// most importantly, when a client pays an invoice.
// We use this to mark jobs as paid in our database,
// and fire a review request to the client.
//
// IMPORTANT: This route must be added to your Stripe webhook dashboard.
// Stripe Dashboard → Developers → Webhooks → Add endpoint
// URL: https://your-app.vercel.app/api/webhooks/stripe
// Events to listen for: checkout.session.completed

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { jobs, invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendReviewRequestSms, sendReviewRequestEmail } from "@/lib/review";
import { centsToDisplay } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    // Verify the request is genuinely from Stripe (not a fake request)
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle payment completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const jobId   = session.metadata?.jobId;

    if (jobId) {
      const now = new Date();

      // Mark the job as paid
      await db
        .update(jobs)
        .set({ status: "paid", paidAt: now, updatedAt: now })
        .where(eq(jobs.id, jobId));

      // Record payment details on the invoice
      await db
        .update(invoices)
        .set({ paidAt: now })
        .where(eq(invoices.jobId, jobId));

      // ── Review request ─────────────────────────────────────────────
      // Fire a review request to the client if:
      //   1. The tradesperson has a Google Place ID configured
      //   2. The client has a phone or email
      try {
        const job = await db.query.jobs.findFirst({
          where: eq(jobs.id, jobId),
          with: { user: true, client: true },
        });

        const placeId      = job?.user?.googleBusinessProfileId;
        const businessName = job?.user?.businessName ?? "Your service provider";
        const client       = job?.client;

        if (placeId && client) {
          const reviewUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;

          // Try SMS first (higher open rate)
          if (client.phone) {
            await sendReviewRequestSms({
              to:           client.phone,
              clientName:   client.name,
              businessName,
              reviewUrl,
            });
            console.log(`[review] SMS sent to ${client.phone} for job ${jobId}`);
          }

          // Also try email if we have it
          if (client.email) {
            await sendReviewRequestEmail({
              to:           client.email,
              clientName:   client.name,
              businessName,
              reviewUrl,
            });
            console.log(`[review] Email sent to ${client.email} for job ${jobId}`);
          }
        }
      } catch (reviewErr) {
        // Don't fail the webhook if review request fails — payment is already recorded
        console.error("[review] Failed to send review request:", reviewErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
