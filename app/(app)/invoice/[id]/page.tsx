// Screen 3 — Invoice Preview & Send
// Fetches real job data and lets the tradesperson send via SMS, email, or link.

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { centsToDisplay } from "@/lib/utils";
import InvoiceSendButtons from "./send-buttons";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, params.id), eq(jobs.userId, session.user.id)),
    with: { client: true, photos: true, invoice: true },
  });

  if (!job) notFound();

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Invoice preview card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Invoice</p>
            <p className="text-lg font-bold text-gray-900">{job.client?.name ?? "Client"}</p>
            {job.client?.phone && <p className="text-sm text-gray-500">{job.client.phone}</p>}
          </div>
          <p className="text-2xl font-bold text-gray-900">{centsToDisplay(job.totalAmountCents)}</p>
        </div>

        {job.description && (
          <p className="text-sm text-gray-600 mb-4">{job.description}</p>
        )}

        {/* Before/after photos */}
        {job.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {job.photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden">
                <img src={photo.storageUrl} alt={photo.type} className="w-full h-full object-cover" /> {/* eslint-disable-line */}
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded capitalize">
                  {photo.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send buttons — client component so they can be interactive */}
      <InvoiceSendButtons
        jobId={job.id}
        clientName={job.client?.name ?? "Client"}
        clientPhone={job.client?.phone ?? null}
        clientEmail={job.client?.email ?? null}
        amountDisplay={centsToDisplay(job.totalAmountCents)}
        paymentUrl={job.invoice?.stripePaymentLinkUrl ?? null}
        isPaid={job.status === "paid"}
      />
    </div>
  );
}
