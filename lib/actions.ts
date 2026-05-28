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
import { sendReviewRequestSms, sendReviewRequestEmail } from "@/lib/review";
import { eq, and } from "drizzle-orm";

type ActionResult = { success: boolean; error?: string };

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

  // Save photo URLs uploaded client-side via Uploadthing
  const beforeUrl = formData.get("beforePhotoUrl") as string | null;
  const afterUrl  = formData.get("afterPhotoUrl")  as string | null;

  type PhotoInsert = { jobId: string; storageUrl: string; type: "before" | "after" | "detail" };

  const photoInserts: PhotoInsert[] = [
    beforeUrl && { jobId: job.id, storageUrl: beforeUrl, type: "before" as const },
    afterUrl  && { jobId: job.id, storageUrl: afterUrl,  type: "after"  as const },
  ].filter(Boolean) as PhotoInsert[];

  // Detail photos — form sends detailPhotoUrl_0, detailPhotoUrl_1, detailPhotoUrl_2
  for (let i = 0; i < 3; i++) {
    const url = formData.get(`detailPhotoUrl_${i}`) as string | null;
    if (url) photoInserts.push({ jobId: job.id, storageUrl: url, type: "detail" });
  }

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

// ── Update Job ────────────────────────────────────────────────────────────────
// Allows editing description, amount, and client info on any non-paid job.
// Returns a result object — client component handles toast + navigation.
export async function updateJob(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const jobId       = formData.get("jobId")       as string;
  const description = formData.get("description") as string;
  const totalStr    = formData.get("total")        as string;
  const clientName  = formData.get("clientName")  as string;
  const clientPhone = formData.get("clientPhone") as string;
  const clientEmail = formData.get("clientEmail") as string;

  if (!jobId) return { success: false, error: "Job ID missing" };

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)),
    with: { client: true },
  });

  if (!job)              return { success: false, error: "Job not found" };
  if (job.status === "paid") return { success: false, error: "Paid jobs cannot be edited" };

  const totalAmountCents = dollarsToCents(totalStr);
  if (!totalAmountCents || totalAmountCents <= 0) {
    return { success: false, error: "Enter a valid amount" };
  }

  await db
    .update(jobs)
    .set({ description: description || null, totalAmountCents, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  if (job.clientId) {
    await db
      .update(clients)
      .set({
        name:  clientName  || job.client?.name  || "Unknown",
        phone: clientPhone || null,
        email: clientEmail || null,
      })
      .where(eq(clients.id, job.clientId));
  }

  return { success: true };
}

// ── Delete Job ────────────────────────────────────────────────────────────────
// Hard-deletes a draft job (cascade removes photos + invoice records).
// Only draft jobs can be deleted — invoiced/paid jobs are locked.
export async function deleteJob(jobId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)),
  });

  if (!job) return { success: false, error: "Job not found" };
  if (job.status !== "draft") {
    return { success: false, error: "Only draft jobs can be deleted" };
  }

  await db.delete(jobs).where(eq(jobs.id, jobId));

  return { success: true };
}

// ── Save Profile ─────────────────────────────────────────────────────────────
// Lets the tradesperson update their business info after onboarding.
export async function saveProfile(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const businessName = (formData.get("businessName") as string)?.trim();
  const tradeType    =  formData.get("tradeType")    as string;
  const city         = (formData.get("city")  as string)?.trim();
  const state        = (formData.get("state") as string)?.trim().toUpperCase().slice(0, 2);
  const phone        = (formData.get("phone") as string)?.trim();

  if (!businessName) return { success: false, error: "Business name is required" };
  if (!tradeType)    return { success: false, error: "Trade type is required" };

  await db
    .update(users)
    .set({
      businessName,
      tradeType,
      city:      city  || null,
      state:     state || null,
      phone:     phone || null,
      username:  slugify(businessName),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

// ── Mark Job as Cash Paid ─────────────────────────────────────────────────────
export async function markJobCashPaid(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const now = new Date();

  await db
    .update(jobs)
    .set({ status: "paid", paidAt: now, updatedAt: now })
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)));

  // Record it in invoices table
  await db
    .insert(invoices)
    .values({ jobId, sentVia: "cash", paidAt: now })
    .onConflictDoUpdate({
      target: invoices.jobId,
      set: { sentVia: "cash", paidAt: now },
    });

  // ── Review request (same as Stripe webhook path) ───────────────────────────
  try {
    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: { user: true, client: true },
    });

    const businessName = job?.user?.businessName ?? "Your service provider";
    const client       = job?.client;

    if (client && (client.phone || client.email)) {
      let sent = false;

      if (client.phone) {
        await sendReviewRequestSms({
          to: client.phone, clientName: client.name, businessName, jobId,
        });
        sent = true;
      }
      if (client.email) {
        await sendReviewRequestEmail({
          to: client.email, clientName: client.name, businessName, jobId,
        });
        sent = true;
      }

      if (sent) {
        await db
          .update(invoices)
          .set({ reviewRequestSentAt: now })
          .where(eq(invoices.jobId, jobId));
      }
    }
  } catch (err) {
    // Don't block the redirect if review request fails
    console.error("[markJobCashPaid] Review request failed:", err);
  }

  redirect(`/job/${jobId}`);
}
