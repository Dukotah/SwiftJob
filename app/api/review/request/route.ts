// POST /api/review/request
//
// Manually trigger a review request for a specific job.
// Called from the job detail page "Send Review Request" button.
// Requires auth — only the job owner can send it.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs, invoices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendReviewRequestSms, sendReviewRequestEmail } from "@/lib/review";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { jobId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { jobId } = body;
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)),
    with: { user: true, client: true },
  });

  if (!job)              return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (job.status !== "paid") return NextResponse.json({ error: "Job is not paid yet" }, { status: 400 });

  const client       = job.client;
  const businessName = job.user?.businessName ?? "Your service provider";

  if (!client?.phone && !client?.email) {
    return NextResponse.json({ error: "Client has no phone or email" }, { status: 400 });
  }

  let smsSent   = false;
  let emailSent = false;

  if (client?.phone) {
    await sendReviewRequestSms({ to: client.phone, clientName: client.name, businessName, jobId });
    smsSent = true;
  }

  if (client?.email) {
    await sendReviewRequestEmail({ to: client.email, clientName: client.name, businessName, jobId });
    emailSent = true;
  }

  // Track that we sent it
  await db
    .update(invoices)
    .set({ reviewRequestSentAt: new Date() })
    .where(eq(invoices.jobId, jobId));

  return NextResponse.json({ ok: true, smsSent, emailSent });
}
