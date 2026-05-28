// Screen — Job Detail
// Shows a completed job with its photos, description, amount, and status.
// Draft jobs can be edited or deleted. Non-paid jobs show the invoice CTA.

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { centsToDisplay, formatDate } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { DeleteJobButton } from "./delete-button";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, id), eq(jobs.userId, session.user.id)),
    with: { client: true, photos: true, invoice: true },
  });

  if (!job) notFound();

  const STATUS_STYLES = {
    draft:    "bg-gray-100 text-gray-600",
    invoiced: "bg-yellow-100 text-yellow-700",
    paid:     "bg-green-100 text-green-700",
  };
  const STATUS_LABELS = { draft: "Draft", invoiced: "Sent", paid: "Paid ✓" };

  const canEdit   = job.status !== "paid";
  const canDelete = job.status === "draft";

  return (
    <div className="px-4 pt-6 pb-8 min-h-screen bg-slate-50">

      {/* Header row */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/home" className="text-gray-500 text-sm font-medium">← Jobs</Link>

        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[job.status]}`}>
            {STATUS_LABELS[job.status]}
          </span>

          {/* Edit button — only for non-paid jobs */}
          {canEdit && (
            <Link
              href={`/job/${job.id}/edit`}
              className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center active:bg-gray-50 shadow-sm"
              aria-label="Edit job"
            >
              <Pencil size={14} className="text-gray-500" />
            </Link>
          )}
        </div>
      </div>

      {/* Job summary card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <p className="text-3xl font-bold text-gray-900 mb-1 money">
          {centsToDisplay(job.totalAmountCents)}
        </p>
        <p className="font-semibold text-gray-800 text-lg">{job.client?.name ?? "Unknown client"}</p>
        {job.client?.phone && (
          <a href={`tel:${job.client.phone}`} className="text-sm text-blue-600 mt-0.5 inline-block">
            {job.client.phone}
          </a>
        )}
        {job.description && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{job.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-3">{formatDate(job.createdAt)}</p>
      </div>

      {/* Photos */}
      {job.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {job.photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.storageUrl} alt={photo.type} className="w-full h-full object-cover" />
              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded capitalize">
                {photo.type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Invoice CTA — non-paid jobs */}
      {job.status !== "paid" && (
        <Link
          href={`/invoice/${job.id}`}
          className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-center text-lg active:bg-blue-700 mb-3"
        >
          {job.status === "invoiced" ? "View Invoice →" : "Generate Invoice →"}
        </Link>
      )}

      {/* ── Job Timeline ─────────────────────────────────── */}
      <div className="mt-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">History</p>
        <div className="relative pl-6 space-y-0">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-100" />

          {/* Created */}
          <TimelineEvent
            dot="bg-gray-300"
            label="Job created"
            date={formatDate(job.createdAt)}
          />

          {/* Invoice sent */}
          {job.invoice?.sentAt && (
            <TimelineEvent
              dot="bg-amber-400"
              label={`Invoice sent via ${
                job.invoice.sentVia === "sms"   ? "SMS"   :
                job.invoice.sentVia === "email" ? "email" :
                job.invoice.sentVia === "cash"  ? "cash"  : "link"
              }`}
              date={formatDate(job.invoice.sentAt)}
            />
          )}

          {/* Paid */}
          {job.paidAt && (
            <TimelineEvent
              dot="bg-emerald-500"
              label="Payment received 💰"
              date={formatDate(job.paidAt)}
              highlight
            />
          )}
        </div>
      </div>

      {/* Delete — draft jobs only */}
      {canDelete && (
        <div className="mt-2">
          <DeleteJobButton jobId={job.id} />
        </div>
      )}
    </div>
  );
}

function TimelineEvent({
  dot, label, date, highlight = false,
}: {
  dot: string; label: string; date: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 pb-4 relative">
      <div className={`w-[18px] h-[18px] rounded-full border-2 border-white shadow-sm shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0 -mt-0.5">
        <p className={`text-sm font-medium ${highlight ? "text-emerald-700" : "text-gray-700"}`}>
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{date}</p>
      </div>
    </div>
  );
}
