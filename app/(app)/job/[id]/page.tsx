// Screen — Job Detail
// Shows a completed job with its photos, description, amount, and status.

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs, clients, jobPhotos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { centsToDisplay, formatDate } from "@/lib/utils";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch the job, making sure it belongs to the logged-in user
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, params.id), eq(jobs.userId, session.user.id)),
    with: {
      client: true,
      photos: true,
      invoice: true,
    },
  });

  if (!job) notFound();

  const STATUS_STYLES = {
    draft:    "bg-gray-100 text-gray-600",
    invoiced: "bg-yellow-100 text-yellow-700",
    paid:     "bg-green-100 text-green-700",
  };
  const STATUS_LABELS = { draft: "Draft", invoiced: "Invoiced", paid: "Paid ✓" };

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/home" className="text-gray-500 text-sm font-medium">← Jobs</Link>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${STATUS_STYLES[job.status]}`}>
          {STATUS_LABELS[job.status]}
        </span>
      </div>

      {/* Job summary card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <p className="text-2xl font-bold text-gray-900 mb-1">{centsToDisplay(job.totalAmountCents)}</p>
        <p className="font-semibold text-gray-800">{job.client?.name ?? "Unknown client"}</p>
        {job.client?.phone && <p className="text-sm text-gray-500">{job.client.phone}</p>}
        {job.description && <p className="text-sm text-gray-600 mt-2">{job.description}</p>}
        <p className="text-xs text-gray-400 mt-2">{formatDate(job.createdAt)}</p>
      </div>

      {/* Photos */}
      {job.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
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

      {/* Actions */}
      {job.status !== "paid" && (
        <Link
          href={`/invoice/${job.id}`}
          className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-center text-lg active:bg-blue-700"
        >
          View Invoice →
        </Link>
      )}
    </div>
  );
}
