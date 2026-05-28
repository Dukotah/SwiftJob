export const dynamic = "force-dynamic";

// POST /api/invoices/[id]/send
// Called by the send buttons on the invoice page.
// Sends the invoice via SMS or email and updates the invoice record.
// If the job has no Stripe payment link yet but the user has Stripe connected,
// one is created on the fly so the client's pay page shows a real Pay button.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs, invoices, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendInvoiceSms } from "@/lib/twilio";
import { sendInvoiceEmail } from "@/lib/resend";
import { createPaymentLink } from "@/lib/stripe";
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

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)),
    with: { client: true, invoice: true, photos: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const fromName   = user?.businessName ?? user?.name ?? "Your service provider";
  const amount     = centsToDisplay(job.totalAmountCents);
  const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${jobId}`;
  const description = job.description ?? "Service";

  // Create a Stripe payment link on-demand if one doesn't exist yet
  // (happens when the user created the job before connecting Stripe)
  let stripePaymentLinkId  = job.invoice?.stripePaymentLinkId  ?? null;
  let stripePaymentLinkUrl = job.invoice?.stripePaymentLinkUrl ?? null;

  if (!stripePaymentLinkUrl && user?.stripeAccountId && user?.stripeOnboardingDone) {
    try {
      const link = await createPaymentLink({
        amountCents:     job.totalAmountCents,
        description:     job.description || "Service Invoice",
        stripeAccountId: user.stripeAccountId,
        jobId,
      });
      stripePaymentLinkId  = link.paymentLinkId;
      stripePaymentLinkUrl = link.paymentLinkUrl;
    } catch (err) {
      console.error("Failed to create payment link on send:", err);
      // Non-fatal — the pay page will still work, just without the Stripe button
    }
  }

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
        clientName:  job.client.name ?? undefined,
        amount,
        description,
        paymentUrl,
        jobId,
        photos: (job.photos ?? []).map((p) => ({
          storageUrl: p.storageUrl,
          type: p.type as "before" | "after" | "detail",
        })),
      });
    }

    // Upsert the invoice record — include stripe link fields if we just created them
    const invoiceData = {
      sentVia: method,
      sentAt:  new Date(),
      ...(stripePaymentLinkId  ? { stripePaymentLinkId }  : {}),
      ...(stripePaymentLinkUrl ? { stripePaymentLinkUrl } : {}),
    };

    await db
      .insert(invoices)
      .values({ jobId, ...invoiceData })
      .onConflictDoUpdate({
        target: invoices.jobId,
        set:    invoiceData,
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
