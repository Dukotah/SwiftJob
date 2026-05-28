export const dynamic = "force-dynamic";

// GET /api/cron/payment-reminders
//
// Vercel Cron — runs daily at 10am UTC (see vercel.json).
//
// Finds all "invoiced" jobs where the invoice was sent >3 days ago
// and the client has a phone number. Sends a polite SMS reminder.
//
// Guard: CRON_SECRET env var must match the Authorization header
// that Vercel sends. Set it in your Vercel environment variables.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, invoices } from "@/db/schema";
import { eq, isNotNull, isNull, lt, and } from "drizzle-orm";
import { sendPaymentReminderSms } from "@/lib/review";
import { centsToDisplay } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(req: NextRequest) {
  // Verify this is Vercel calling (not a random visitor)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  // Find all invoiced (unpaid) jobs whose invoice was sent >3 days ago
  const unpaidJobs = await db.query.jobs.findMany({
    where: eq(jobs.status, "invoiced"),
    with: {
      client:  true,
      invoice: true,
      user:    true,
    },
  });

  const toRemind = unpaidJobs.filter(
    (j) =>
      j.invoice?.sentAt &&
      j.invoice.sentAt < threeDaysAgo &&
      j.client?.phone
  );

  let sent    = 0;
  let skipped = 0;

  for (const job of toRemind) {
    try {
      const payUrl      = `${APP_URL}/pay/${job.id}`;
      const businessName = job.user?.businessName ?? "Your service provider";
      const amount       = centsToDisplay(job.totalAmountCents);

      await sendPaymentReminderSms({
        to:           job.client!.phone!,
        clientName:   job.client?.name,
        businessName,
        amount,
        payUrl,
      });

      sent++;
    } catch (err) {
      console.error(`[payment-reminders] Failed for job ${job.id}:`, err);
      skipped++;
    }
  }

  console.log(`[payment-reminders] Sent ${sent}, skipped ${skipped}`);
  return NextResponse.json({ ok: true, sent, skipped });
}
