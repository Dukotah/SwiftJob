// Screen 3 — Invoice Preview & Send
// Fetches real job data and lets the tradesperson send via SMS, email, or link.

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { centsToDisplay } from "@/lib/utils";
import InvoiceSendButtons from "./send-buttons";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const job = await db.query.jobs.findFirst({
        where: and(eq(jobs.id, id), eq(jobs.userId, session.user.id)),
    with: { client: true, photos: true, invoice: true },
  });

  if (!job) notFound();

  const beforePhoto = job.photos.find((p) => p.type === "before");
  const afterPhoto  = job.photos.find((p) => p.type === "after");

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <Link href="/home" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Invoice</h1>
          <p className="text-xs text-gray-400">{job.client?.name ?? "Client"}</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">

        {/* ── Invoice card ───────────────────────────────── */}
        <div className="card p-5">
          {/* Amount hero */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Due</p>
              <p className="money text-4xl font-bold text-gray-900 leading-none">
                {centsToDisplay(job.totalAmountCents)}
              </p>
            </div>
            <div className="text-right">
              <span className={
                job.status === "paid"     ? "badge-paid"     :
                job.status === "invoiced" ? "badge-invoiced" : "badge-draft"
              }>
                {job.status === "paid" ? "Paid" : job.status === "invoiced" ? "Sent" : "Draft"}
              </span>
            </div>
          </div>

          {/* Client info */}
          <div className="border-t border-gray-100 pt-4 space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill To</p>
            <p className="font-semibold text-gray-900">{job.client?.name ?? "Client"}</p>
            {job.client?.phone && <p className="text-sm text-gray-500">{job.client.phone}</p>}
            {job.client?.email && <p className="text-sm text-gray-500">{job.client.email}</p>}
          </div>

          {/* Description */}
          {job.description && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Work Done</p>
              <p className="text-sm text-gray-700 leading-relaxed">{job.description}</p>
            </div>
          )}
        </div>

        {/* ── Before / After photos ──────────────────────── */}
        {(beforePhoto || afterPhoto) && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Photos</p>
            <div className="grid grid-cols-2 gap-3">
              {[beforePhoto, afterPhoto].map((photo, i) => (
                photo ? (
                  <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.storageUrl} alt={photo.type} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-white text-xs font-semibold capitalize">{photo.type}</span>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center">
                    <p className="text-xs text-gray-400 font-medium">{i === 0 ? "Before" : "After"}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* ── Send / payment actions ─────────────────────── */}
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
    </div>
  );
}
