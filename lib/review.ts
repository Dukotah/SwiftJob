// lib/review.ts
//
// Sends a review request to a client after their job is marked paid.
// Uses Twilio for SMS and Resend for email.
// The review link goes to the business's Google Business Profile.

import twilio from "twilio";
import { Resend } from "resend";

/**
 * Send a review request via SMS.
 * Keep it short and friendly — this hits someone's personal phone.
 */
export async function sendReviewRequestSms({
  to,
  clientName,
  businessName,
  reviewUrl,
}: {
  to: string;
  clientName?: string;
  businessName: string;
  reviewUrl: string;
}) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  const firstName = clientName?.split(" ")[0] ?? "there";

  const body = `Hi ${firstName}! Thanks for choosing ${businessName} — it was a pleasure working with you.

If you have 30 seconds, a Google review helps us more than you know:

⭐ ${reviewUrl}

Thanks so much!`;

  const result = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });

  return result.sid;
}

/**
 * Send a review request via email.
 * Slightly warmer than SMS — can include more context.
 */
export async function sendReviewRequestEmail({
  to,
  clientName,
  businessName,
  reviewUrl,
}: {
  to: string;
  clientName?: string;
  businessName: string;
  reviewUrl: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const firstName = clientName?.split(" ")[0] ?? "there";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px 40px;">

    <!-- Header -->
    <div style="background:#2563eb;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:28px;">⭐</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:white;">${businessName}</h1>
    </div>

    <!-- Body -->
    <div style="background:white;padding:32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <p style="margin:0 0 16px;font-size:16px;color:#1e293b;line-height:1.6;">
        Hi ${firstName}!
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
        Thanks for choosing us — it was a pleasure getting the job done for you.
        If you&apos;re happy with the work, a quick Google review would mean
        the world to us and helps other homeowners find us.
      </p>

      <!-- CTA Button -->
      <a href="${reviewUrl}"
         style="display:block;background:#2563eb;color:white;text-align:center;
                padding:16px 24px;border-radius:12px;font-weight:700;font-size:16px;
                text-decoration:none;margin-bottom:16px;">
        ⭐ Leave a Google Review
      </a>

      <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
        Takes about 30 seconds. Thank you so much!
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f1f5f9;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;
                padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        Sent by ${businessName} via SwiftJobs
      </p>
    </div>

  </div>
</body>
</html>`;

  const text = `Hi ${firstName}!

Thanks for choosing ${businessName}. If you're happy with the work, a quick Google review would mean a lot to us:

${reviewUrl}

It only takes 30 seconds — thank you so much!

— ${businessName}`;

  const { error } = await resend.emails.send({
    from: `${businessName} <${process.env.RESEND_FROM_EMAIL}>`,
    to,
    subject: `How did we do, ${firstName}? ⭐`,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send review email: ${error.message}`);
  }
}
