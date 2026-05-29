// POST /api/review/feedback
//
// Saves private feedback when a client rates 1-3 stars on the review intercept page.
// No auth required — jobId is the only identifier (it's a UUID, not guessable).
//
// After saving, emails the tradesperson immediately so they know to follow up.
// The feedback is visible in the job detail page and /feedback inbox.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviewFeedback, jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  let body: { jobId?: string; rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { jobId, rating, comment } = body;

  if (!jobId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
    with: { user: true, client: true },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Save the feedback
  await db.insert(reviewFeedback).values({
    jobId,
    rating,
    comment: comment?.trim() || null,
  });

  // ── Notify the tradesperson immediately ───────────────────────────────────
  // They need to know so they can reach out and fix the issue before it escalates
  try {
    const userEmail    = job.user?.email;
    const businessName = job.user?.businessName ?? "your business";
    const clientName   = job.client?.name ?? "A client";
    const stars        = "⭐".repeat(rating) + "☆".repeat(5 - rating);
    const jobUrl       = `${process.env.NEXT_PUBLIC_APP_URL}/job/${jobId}`;

    if (userEmail && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from:    `SwiftJobs <${process.env.RESEND_FROM_EMAIL}>`,
        to:      userEmail,
        subject: `${clientName} left ${rating}-star private feedback`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px 40px;">
    <div style="background:${rating <= 2 ? "#ef4444" : "#f59e0b"};border-radius:16px 16px 0 0;padding:24px 32px;">
      <p style="margin:0;color:white;font-size:28px;">${stars}</p>
      <h1 style="margin:8px 0 0;font-size:18px;font-weight:700;color:white;">
        ${clientName} left ${rating}-star feedback
      </h1>
    </div>
    <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;">
      ${comment
        ? `<div style="background:#f8fafc;border-left:3px solid #e2e8f0;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
             <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;font-style:italic;">"${comment}"</p>
           </div>`
        : `<p style="color:#6b7280;font-size:14px;margin-bottom:24px;">No written comment was left.</p>`
      }
      <p style="font-size:14px;color:#374151;margin:0 0 24px;line-height:1.6;">
        This feedback was kept private — it did not go to Google.
        Consider reaching out to ${clientName} to address the issue.
      </p>
      <a href="${jobUrl}"
         style="display:block;background:#111827;color:white;text-align:center;
                padding:14px 24px;border-radius:10px;font-weight:700;font-size:15px;
                text-decoration:none;">
        View Job →
      </a>
    </div>
    <div style="background:#f1f5f9;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;
                padding:14px 32px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">
        SwiftJobs review intercept for ${businessName}
      </p>
    </div>
  </div>
</body>
</html>`,
        text: `${clientName} left ${rating}-star private feedback for ${businessName}.\n\n${comment ? `"${comment}"\n\n` : ""}View the job: ${jobUrl}`,
      });
    }
  } catch (notifyErr) {
    // Don't fail the response if notification fails — feedback is already saved
    console.error("[review/feedback] Notification failed:", notifyErr);
  }

  return NextResponse.json({ ok: true });
}
