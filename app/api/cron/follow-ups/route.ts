export const dynamic = "force-dynamic";

// GET /api/cron/follow-ups
//
// Vercel Cron — runs daily at 9am UTC (see vercel.json).
//
// Finds all jobs that were paid ~30 days ago and haven't received
// a follow-up message yet. Sends a friendly check-in SMS.
//
// The goal: re-engage happy clients for repeat business or referrals.
// This is the highest-ROI message you'll ever send.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, invoices } from "@/db/schema";
import { eq, isNull, and, isNotNull } from "drizzle-orm";
import { sendFollowUpSms } from "@/lib/review";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 30-day window: jobs paid between 30 and 31 days ago
  const thirtyDaysAgo    = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

  const paidJobs = await db.query.jobs.findMany({
    where: eq(jobs.status, "paid"),
    with: {
      client:  true,
      invoice: true,
      user:    true,
    },
  });

  // Filter: paid in our 30-day window AND follow-up not yet sent AND client has phone
  const toFollowUp = paidJobs.filter(
    (j) =>
      j.paidAt &&
      j.paidAt >= thirtyOneDaysAgo &&
      j.paidAt < thirtyDaysAgo &&
      !j.invoice?.followUpSentAt &&
      j.client?.phone
  );

  let sent    = 0;
  let skipped = 0;

  for (const job of toFollowUp) {
    try {
      const businessName = job.user?.businessName ?? "Your service provider";

      await sendFollowUpSms({
        to:           job.client!.phone!,
        clientName:   job.client?.name,
        businessName,
      });

      // Mark follow-up as sent so we don't send it again
      if (job.invoice) {
        await db
          .update(invoices)
          .set({ followUpSentAt: new Date() })
          .where(eq(invoices.jobId, job.id));
      }

      sent++;
    } catch (err) {
      console.error(`[follow-ups] Failed for job ${job.id}:`, err);
      skipped++;
    }
  }

  console.log(`[follow-ups] Sent ${sent}, skipped ${skipped}`);
  return NextResponse.json({ ok: true, sent, skipped });
}
