// GET /api/stripe/connect
// Starts the Stripe Express onboarding flow for a tradesperson.
// Creates a Stripe account for them (if they don't have one) and
// redirects them to Stripe's hosted onboarding page.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Reuse existing Stripe account if they have one
  let stripeAccountId = user.stripeAccountId;

  if (!stripeAccountId) {
    // Create a new Stripe Express account for this tradesperson
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      capabilities: {
        card_payments:  { requested: true },
        transfers:      { requested: true },
      },
      business_type: "individual",
      metadata: { userId: user.id },
    });

    stripeAccountId = account.id;

    // Save the Stripe account ID to our database
    await db
      .update(users)
      .set({ stripeAccountId })
      .where(eq(users.id, user.id));
  }

  // Generate the Stripe-hosted onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    // Where Stripe sends them after completing onboarding
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/return`,
    // Where Stripe sends them if they exit early (they can restart)
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect`,
    type: "account_onboarding",
  });

  return NextResponse.redirect(accountLink.url);
}
