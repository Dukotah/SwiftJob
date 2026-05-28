import Stripe from "stripe";

// Stripe client — used server-side only (never import this in a client component)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Platform fee: SwiftJobs takes 2% of every transaction.
// Example: $180 job → $3.60 platform fee, tradesperson receives ~$176.40 (minus Stripe's own fees)
// Adjust this number to change your revenue model.
const PLATFORM_FEE_PERCENT = 0.02;

/**
 * Creates a Stripe Payment Link for a job.
 * The tradesperson's client clicks this link to pay.
 * The money goes directly to the tradesperson's Stripe Connect account.
 *
 * @param amountCents   - Job total in cents (e.g. 18000 for $180.00)
 * @param description   - What the job was for (appears on the payment page)
 * @param stripeAccountId - The tradesperson's connected Stripe account ID
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
  // Create a product for this specific job
  const product = await stripe.products.create(
    {
      name: description || "Service Invoice",
      metadata: { jobId },
    },
    { stripeAccount: stripeAccountId }
  );

  // Create a price for the product
  const price = await stripe.prices.create(
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
  // application_fee_amount: SwiftJobs collects this fee from each payment
  const paymentLink = await stripe.paymentLinks.create(
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
    paymentLinkId:  paymentLink.id,
    paymentLinkUrl: paymentLink.url,
  };
}
