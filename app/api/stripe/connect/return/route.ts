// GET /api/stripe/connect/return
// Stripe redirects the tradesperson here after they finish onboarding.
// We verify the account is active and mark them as fully onboarded.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user?.stripeAccountId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile?stripe=error`);
  }

  // Check with Stripe that their account is actually ready to accept payments
  const account = await stripe.accounts.retrieve(user.stripeAccountId);
  const isReady = account.charges_enabled && account.payouts_enabled;

  await db
    .update(users)
    .set({ stripeOnboardingDone: isReady })
    .where(eq(users.id, user.id));

  const status = isReady ? "success" : "pending";
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/profile?stripe=${status}`
  );
}
