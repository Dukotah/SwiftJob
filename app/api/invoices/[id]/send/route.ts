export const dynamic = "force-dynamic";

// POST /api/invoices/[id]/send
// Called by the send buttons on the invoice page.
// Sends the invoice via SMS or email and updates the invoice record.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs, invoices, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendInvoiceSms } from "@/lib/twilio";
import { sendInvoiceEmail } from "@/lib/resend";
import { centsToDisplay } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { method } = await req.json() as { method: "sms" | "email" };
    const { id: jobId } = await params;

  // Fetch the job (verify it belongs to this user)
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)),
    with: { client: true, invoice: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Fetch the tradesperson's details for the message
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const fromName   = user?.businessName ?? user?.name ?? "Your service provider";
  const amount     = centsToDisplay(job.totalAmountCents);
  const paymentUrl = job.invoice?.stripePaymentLinkUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/pay/${jobId}`;
  const description = job.description ?? "Service";

  try {
    if (method === "sms") {
      if (!job.client?.phone) {
        return NextResponse.json({ error: "Client has no phone number" }, { status: 400 });
      }
      await sendInvoiceSms({
        to:          job.client.phone,
        fromName,
        amount,
        description,
        paymentUrl,
      });
    }

    if (method === "email") {
      if (!job.client?.email) {
        return NextResponse.json({ error: "Client has no email" }, { status: 400 });
      }
      await sendInvoiceEmail({
        to:          job.client.email,
        fromName,
        fromEmail:   user?.email ?? process.env.RESEND_FROM_EMAIL!,
        amount,
        description,
        paymentUrl,
        jobId,
      });
    }

    // Record that the invoice was sent and update job status
    await db
      .insert(invoices)
      .values({ jobId, sentVia: method, sentAt: new Date() })
      .onConflictDoUpdate({
        target: invoices.jobId,
        set:    { sentVia: method, sentAt: new Date() },
      });

    await db
      .update(jobs)
      .set({ status: "invoiced", updatedAt: new Date() })
      .where(eq(jobs.id, jobId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Failed to send invoice via ${method}:`, err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
