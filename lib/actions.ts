"use server";
// lib/actions.ts
//
// Server Actions — these run on the server when forms are submitted.
// They replace the need for API routes for simple data mutations.
// Think of them as "form handlers that live on the server."

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs, clients, invoices } from "@/db/schema";
import { dollarsToCents } from "@/lib/utils";
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

  // Create the job record
  const [job] = await db
    .insert(jobs)
    .values({
      userId,
      clientId,
      description: description || null,
      totalAmountCents: dollarsToCents(totalStr),
      status: "draft",
    })
    .returning({ id: jobs.id });

  // Redirect to the invoice page for this job
  redirect(`/invoice/${job.id}`);
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
