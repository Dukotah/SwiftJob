import Stripe from "stripe";

// Stripe client — used server-side only (never import this in a client component)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  typescript: true,
});

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

  // Create the payment link
  const paymentLink = await stripe.paymentLinks.create(
    {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { jobId },
      // After paying, client sees a success message
      after_completion: {
        type: "hosted_confirmation",
        hosted_confirmation: {
          custom_message: "Thank you for your payment!",
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
