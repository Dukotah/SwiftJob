// POST /api/webhooks/stripe
// Stripe calls this URL whenever something important happens —
// most importantly, when a client pays an invoice.
// We use this to mark jobs as paid in our database.
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
    }
  }

  return NextResponse.json({ received: true });
}
