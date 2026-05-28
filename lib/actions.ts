"use server";
// lib/actions.ts
//
// Server Actions — these run on the server when forms are submitted.
// They replace the need for API routes for simple data mutations.
// Think of them as "form handlers that live on the server."

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs, clients, invoices, users, jobPhotos } from "@/db/schema";
import { dollarsToCents, slugify } from "@/lib/utils";
import { createPaymentLink } from "@/lib/stripe";
import { eq, and } from "drizzle-orm";

// ── Create Job ────────────────────────────────────────────────────────────────
// Called when the tradesperson submits the Job Capture form.
// Creates (or reuses) a client record, then creates the job.
export async function createJob(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId      = session.user.id;
  const clientName  = formData.get("clientName")  as string;
  const clientPhone = formData.get("clientPhone")  as string;
  const clientEmail = formData.get("clientEmail")  as string;
  const description = formData.get("description")  as string;
  const totalStr    = formData.get("total")         as string;

  if (!clientName || !totalStr) {
    throw new Error("Client name and total are required.");
  }

  // Try to find an existing client with the same phone number
  // so we don't create duplicates for repeat customers
  let clientId: string | null = null;

  if (clientPhone) {
    const existing = await db
      .select()
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.phone, clientPhone)))
      .limit(1);

    if (existing.length > 0) {
      clientId = existing[0].id;
    }
  }

  // Create a new client if we didn't find one
  if (!clientId) {
    const [newClient] = await db
      .insert(clients)
      .values({
        userId,
        name:  clientName,
        phone: clientPhone || null,
        email: clientEmail || null,
      })
      .returning({ id: clients.id });

    clientId = newClient.id;
  }

  const totalAmountCents = dollarsToCents(totalStr);

  // Create the job record
  const [job] = await db
    .insert(jobs)
    .values({
      userId,
      clientId,
      description: description || null,
      totalAmountCents,
      status: "draft",
    })
    .returning({ id: jobs.id });

  // If the tradesperson has Stripe connected, generate a payment link immediately
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user?.stripeAccountId && user?.stripeOnboardingDone) {
    try {
      const { paymentLinkId, paymentLinkUrl } = await createPaymentLink({
        amountCents:     totalAmountCents,
        description:     description || "Service Invoice",
        stripeAccountId: user.stripeAccountId,
        jobId:           job.id,
      });

      // Save the payment link to the invoices table
      await db.insert(invoices).values({
        jobId:                job.id,
        stripePaymentLinkId:  paymentLinkId,
        stripePaymentLinkUrl: paymentLinkUrl,
      });

      // Move job from draft → invoiced
      await db
        .update(jobs)
        .set({ status: "invoiced", updatedAt: new Date() })
        .where(eq(jobs.id, job.id));
    } catch (err) {
      // Don't block the user if Stripe fails — they can still send manually
      console.error("Stripe payment link creation failed:", err);
    }
  }

  // Save any photo URLs that were uploaded client-side via Uploadthing
  // The form sends beforePhotoUrl and afterPhotoUrl as hidden fields
  const beforeUrl = formData.get("beforePhotoUrl") as string | null;
  const afterUrl  = formData.get("afterPhotoUrl")  as string | null;

  const photoInserts = [
    beforeUrl && { jobId: job.id, storageUrl: beforeUrl, type: "before" as const },
    afterUrl  && { jobId: job.id, storageUrl: afterUrl,  type: "after"  as const },
  ].filter(Boolean) as { jobId: string; storageUrl: string; type: "before" | "after" }[];

  if (photoInserts.length > 0) {
    await db.insert(jobPhotos).values(photoInserts);
  }

  // Redirect to the invoice page for this job
  redirect(`/invoice/${job.id}`);
}

// ── Save Onboarding Info ───────────────────────────────────────────────────────
// Called when a new user completes the onboarding form.
export async function saveOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const businessName = formData.get("businessName") as string;
  const tradeType    = formData.get("tradeType")    as string;
  const city         = formData.get("city")         as string;
  const state        = formData.get("state")        as string;

  // Auto-generate a username from their business name
  const username = slugify(businessName);

  await db
    .update(users)
    .set({ businessName, tradeType, city, state, username, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  redirect("/home");
}

// ── Mark Job as Cash Paid ─────────────────────────────────────────────────────
export async function markJobCashPaid(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await db
    .update(jobs)
    .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)));

  // Also record it in invoices table
  await db
    .insert(invoices)
    .values({ jobId, sentVia: "cash", paidAt: new Date() })
    .onConflictDoUpdate({
      target: invoices.jobId,
      set: { sentVia: "cash", paidAt: new Date() },
    });

  redirect(`/job/${jobId}`);
}
