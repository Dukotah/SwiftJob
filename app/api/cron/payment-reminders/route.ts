export const dynamic = "force-dynamic";

// GET /api/cron/payment-reminders
//
// Vercel Cron — runs daily at 10am UTC (see vercel.json).
//
// Finds invoiced jobs where:
//   - Invoice was sent >3 days ago
//   - A payment reminder has NOT already been sent (paymentReminderSentAt is null)
//   - Client has a phone number
//
// Sends ONE reminder per job, then marks paymentReminderSentAt so it never repeats.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, invoices } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { sendPaymentReminderSms } from "@/lib/review";
import { centsToDisplay } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const unpaidJobs = await db.query.jobs.findMany({
    where: eq(jobs.status, "invoiced"),
    with: { client: true, invoice: true, user: true },
  });

  // Only jobs where:
  // 1. Invoice sent >3 days ago
  // 2. Reminder NOT already sent (paymentReminderSentAt is null)
  // 3. Client has a phone
  const toRemind = unpaidJobs.filter(
    (j) =>
      j.invoice?.sentAt &&
      j.invoice.sentAt < threeDaysAgo &&
      !j.invoice.paymentReminderSentAt &&
      j.client?.phone
  );

  let sent = 0, skipped = 0;

  for (const job of toRemind) {
    try {
      await sendPaymentReminderSms({
        to:           job.client!.phone!,
        clientName:   job.client?.name,
        businessName: job.user?.businessName ?? "Your service provider",
        amount:       centsToDisplay(job.totalAmountCents),
        payUrl:       `${APP_URL}/pay/${job.id}`,
      });

      // Mark so we never send again for this invoice
      await db
        .update(invoices)
        .set({ paymentReminderSentAt: new Date() })
        .where(eq(invoices.jobId, job.id));

      sent++;
    } catch (err) {
      console.error(`[payment-reminders] Failed for job ${job.id}:`, err);
      skipped++;
    }
  }

  console.log(`[payment-reminders] Sent ${sent}, skipped ${skipped}`);
  return NextResponse.json({ ok: true, sent, skipped });
}
