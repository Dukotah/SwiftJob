// lib/review.ts
//
// Review request automation.
//
// FLOW:
//   1. After a job is paid, we send the client a message with a link to /review/[jobId]
//   2. On that page the client rates 1-5 stars
//   3. 4-5 stars → redirect to Google review link (public)
//   4. 1-3 stars → show private feedback form → saved to review_feedback table
//      (the tradesperson is notified, but it never goes to Google)
//
// This "intercept" pattern is exactly what NiceJob charges $75/mo for.

import twilio from "twilio";
import { Resend } from "resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://swiftjobs.app";

/** The URL we send to clients. Routes through our intercept page. */
export function getReviewInterceptUrl(jobId: string) {
  return `${APP_URL}/review/${jobId}`;
}

/** The public Google review URL — only shown after a 4-5 star rating. */
export function getGoogleReviewUrl(placeId: string) {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

// ── SMS ───────────────────────────────────────────────────────────────────────

export async function sendReviewRequestSms({
  to,
  clientName,
  businessName,
  jobId,
}: {
  to:           string;
  clientName?:  string;
  businessName: string;
  jobId:        string;
}) {
  const client    = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const firstName = clientName?.split(" ")[0] ?? "there";
  const url       = getReviewInterceptUrl(jobId);

  const body = `Hi ${firstName}! Thanks for choosing ${businessName}. How did we do?

Tap to rate us (takes 30 sec):
${url}

Thank you! 🙏`;

  const result = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });

  return result.sid;
}

// ── Email ─────────────────────────────────────────────────────────────────────

export async function sendReviewRequestEmail({
  to,
  clientName,
  businessName,
  jobId,
}: {
  to:           string;
  clientName?:  string;
  businessName: string;
  jobId:        string;
}) {
  const resend    = new Resend(process.env.RESEND_API_KEY!);
  const firstName = clientName?.split(" ")[0] ?? "there";
  const url       = getReviewInterceptUrl(jobId);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px 40px;">
    <div style="background:#2563eb;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:32px;">⭐</p>
      <h1 style="margin:8px 0 0;font-size:20px;font-weight:700;color:white;">${businessName}</h1>
    </div>
    <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0f172a;">Hi ${firstName}!</p>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
        Thanks for choosing us — it was great working with you.
        We'd love to hear how we did. It only takes 30 seconds!
      </p>
      <a href="${url}"
         style="display:block;background:#2563eb;color:white;text-align:center;
                padding:16px 24px;border-radius:12px;font-weight:700;font-size:16px;
                text-decoration:none;margin-bottom:16px;">
        ⭐ How did we do?
      </a>
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
        Your feedback means a lot to us — thank you!
      </p>
    </div>
    <div style="background:#f1f5f9;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">Sent by ${businessName} via SwiftJobs</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Hi ${firstName}!

Thanks for choosing ${businessName}. How did we do?

Rate us here (30 seconds):
${url}

Thank you so much!
— ${businessName}`;

  const { error } = await resend.emails.send({
    from:    `${businessName} <${process.env.RESEND_FROM_EMAIL}>`,
    to,
    subject: `How did we do, ${firstName}? ⭐`,
    html,
    text,
  });

  if (error) throw new Error(`Failed to send review email: ${error.message}`);
}

// ── 30-day follow-up ──────────────────────────────────────────────────────────
// Sent by the cron job 30 days after a job is paid.
// Goal: re-engage happy clients for repeat business.

export async function sendFollowUpSms({
  to,
  clientName,
  businessName,
}: {
  to:           string;
  clientName?:  string;
  businessName: string;
}) {
  const client    = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const firstName = clientName?.split(" ")[0] ?? "there";

  const body = `Hi ${firstName}! This is ${businessName} checking in. Hope everything still looks great!

If you need us again or want to refer a friend, just reply here. We'd love to help 🙌`;

  const result = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });

  return result.sid;
}

// ── Payment reminder ──────────────────────────────────────────────────────────
// Sent by the cron job for invoices that are >3 days unpaid.

export async function sendPaymentReminderSms({
  to,
  clientName,
  businessName,
  amount,
  payUrl,
}: {
  to:           string;
  clientName?:  string;
  businessName: string;
  amount:       string;
  payUrl:       string;
}) {
  const client    = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const firstName = clientName?.split(" ")[0] ?? "there";

  const body = `Hi ${firstName}, just a quick reminder from ${businessName} — your invoice for ${amount} is still outstanding.

Pay securely here: ${payUrl}

Thanks!`;

  const result = await client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  });

  return result.sid;
}
