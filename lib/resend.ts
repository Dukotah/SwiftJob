import { Resend } from "resend";
import { render } from "@react-email/render";
import InvoiceEmail from "@/emails/InvoiceEmail";

interface Photo {
  storageUrl: string;
  type: "before" | "after" | "detail";
}

export async function sendInvoiceEmail({
  to,
  fromName,
  fromEmail,
  clientName,
  amount,
  description,
  paymentUrl,
  jobId,
  photos = [],
}: {
  to: string;
  fromName: string;
  fromEmail: string;
  clientName?: string;
  amount: string;
  description: string;
  paymentUrl: string;
  jobId: string;
  photos?: Photo[];
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const html = await render(
    InvoiceEmail({ fromName, clientName, description, amount, paymentUrl, jobId, photos })
  );

  const text = `Hi ${clientName ?? "there"},

${fromName} sent you an invoice for:
${description}

Amount due: ${amount}

Pay securely here: ${paymentUrl}

Thank you!
— ${fromName}

---
Invoice #${jobId.slice(0, 8).toUpperCase()}
Powered by SwiftJobs`;

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${process.env.RESEND_FROM_EMAIL}>`,
    replyTo: fromEmail,
    to,
    subject: `Invoice from ${fromName} — ${amount} due`,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send invoice email: ${error.message}`);
  }

  return data?.id;
}
