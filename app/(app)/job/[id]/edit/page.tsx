// Edit Job — server component that fetches job data and renders the client form

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { EditJobForm } from "./edit-form";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, id), eq(jobs.userId, session.user.id)),
    with: { client: true },
  });

  if (!job) notFound();

  // Paid jobs are locked — redirect back to detail
  if (job.status === "paid") redirect(`/job/${id}`);

  return (
    <EditJobForm
      jobId={job.id}
      initialDescription={job.description ?? ""}
      initialAmountDollars={(job.totalAmountCents / 100).toFixed(2)}
      initialClientName={job.client?.name ?? ""}
      initialClientPhone={job.client?.phone ?? ""}
      initialClientEmail={job.client?.email ?? ""}
      status={job.status}
    />
  );
}
