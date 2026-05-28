import { Resend } from "resend";

/**
 * Sends an invoice email to a client.
 * For now this sends a plain-text email — we'll add HTML templates later.
 */
export async function sendInvoiceEmail({
  to,
  fromName,
  fromEmail,
  amount,
  description,
  paymentUrl,
  jobId,
}: {
  to: string;
  fromName: string;
  fromEmail: string;
  amount: string;
  description: string;
  paymentUrl: string;
  jobId: string;
}) {
    const resend = new Resend(process.env.RESEND_API_KEY!);
  const { data, error } = await resend.emails.send({
    from: `${fromName} <${process.env.RESEND_FROM_EMAIL}>`,
    replyTo: fromEmail,
    to,
    subject: `Invoice from ${fromName} — ${amount} due`,
    // TODO: Replace with a proper HTML email template (React Email works great with Resend)
    text: `Hi there,

${fromName} sent you an invoice for the following service:

${description}

Amount due: ${amount}

Pay securely here: ${paymentUrl}

Thank you!
— ${fromName}

---
Invoice ID: ${jobId}
Powered by SwiftJobs`,
  });

  if (error) {
    throw new Error(`Failed to send invoice email: ${error.message}`);
  }

  return data?.id;
}
