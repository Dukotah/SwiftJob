import twilio from "twilio";

/**
 * Sends an invoice SMS to a client.
 * The message includes the payment link so the client can pay instantly.
 *
 * @param to          - Client's phone number (e.g. "+15551234567")
 * @param fromName    - Tradesperson's business name
 * @param amount      - Formatted amount string (e.g. "$180.00")
 * @param paymentUrl  - Stripe payment link URL
 */
export async function sendInvoiceSms({
  to,
  fromName,
  amount,
  description,
  paymentUrl,
}: {
  to: string;
  fromName: string;
  amount: string;
  description: string;
  paymentUrl: string;
}) {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const message = `Hi! ${fromName} sent you an invoice for ${amount}.

Service: ${description}

Pay securely here: ${paymentUrl}

Powered by SwiftJobs`;

  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });

  return result.sid;
}
