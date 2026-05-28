// New Job — server wrapper reads searchParams and passes defaults to the client form.
// Navigating from /clients/[id] pre-fills the client fields automatically.

import { NewJobForm } from "./new-job-form";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ clientName?: string; clientPhone?: string; clientEmail?: string }>;
}) {
  const params = await searchParams;
  return (
    <NewJobForm
      defaultClientName={params.clientName  ?? ""}
      defaultClientPhone={params.clientPhone ?? ""}
      defaultClientEmail={params.clientEmail ?? ""}
    />
  );
}
