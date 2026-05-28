import Stripe from "stripe";

// Platform fee: SwiftJobs takes 2% of every transaction.
const PLATFORM_FEE_PERCENT = 0.02;

// Lazy singleton — the Stripe client is only created on first use, not at
// module-load time.  This prevents build-time errors when STRIPE_SECRET_KEY
// is not yet set in the environment (e.g. during `next build` on Vercel
// before the env var has been configured).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
    if (!_stripe) {
          if (!process.env.STRIPE_SECRET_KEY) {
                  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
          }
          _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                  apiVersion: "2025-02-24.acacia",
                  typescript: true,
          });
    }
    return _stripe;
}

// Convenience re-export so existing callers using `stripe.xxx` still work.
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
          return (getStripe() as unknown as Record<string, unknown>)[prop as string];
    },
});

/**
 * Creates a Stripe Payment Link for a job.
 * The tradesperson's client clicks this link to pay.
 * The money goes directly to the tradesperson's Stripe Connect account.
 */
export async function createPaymentLink({
    amountCents,
    description,
    stripeAccountId,
    jobId,
}: {
    amountCents: number;
    description: string;
    stripeAccountId: string;
    jobId: string;
}) {
    const client = getStripe();

  // Create a product for this specific job
  const product = await client.products.create(
    {
            name: description || "Service Invoice",
            metadata: { jobId },
    },
    { stripeAccount: stripeAccountId }
      );

  // Create a price for the product
  const price = await client.prices.create(
    {
            product: product.id,
            unit_amount: amountCents,
            currency: "usd",
    },
    { stripeAccount: stripeAccountId }
      );

  // Calculate platform fee in cents
  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT);

  // Create the payment link
  const paymentLink = await client.paymentLinks.create(
    {
            line_items: [{ price: price.id, quantity: 1 }],
            metadata: { jobId },
            application_fee_amount: platformFeeCents,
            after_completion: {
                      type: "hosted_confirmation",
                      hosted_confirmation: {
                                  custom_message: "Payment received! Thank you.",
                      },
            },
    },
    { stripeAccount: stripeAccountId }
      );

  return {
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
  };
}
