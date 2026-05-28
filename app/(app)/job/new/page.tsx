// New Job — server wrapper fetches existing clients for autocomplete,
// reads searchParams so navigating from /clients/[id] pre-fills fields.

import { auth } from "@/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NewJobForm } from "./new-job-form";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ clientName?: string; clientPhone?: string; clientEmail?: string }>;
}) {
  const params  = await searchParams;
  const session = await auth();

  const existingClients = session?.user?.id
    ? await db.query.clients.findMany({
        where:   eq(clients.userId, session.user.id),
        columns: { id: true, name: true, phone: true, email: true },
        orderBy: [desc(clients.createdAt)],
      })
    : [];

  return (
    <NewJobForm
      defaultClientName={params.clientName   ?? ""}
      defaultClientPhone={params.clientPhone ?? ""}
      defaultClientEmail={params.clientEmail ?? ""}
      existingClients={existingClients}
    />
  );
}
