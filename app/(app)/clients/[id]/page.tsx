// Client detail page — all jobs for one client with stats and quick actions.

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { centsToDisplay, formatDate, formatRelativeDate } from "@/lib/utils";
import { Phone, Mail, Plus, ArrowLeft, Briefcase, TrendingUp, Clock } from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const client = await db.query.clients.findFirst({
    where: and(eq(clients.id, id), eq(clients.userId, session.user.id)),
    with: {
      jobs: {
        with: { photos: true },
        orderBy: (j, { desc }) => [desc(j.createdAt)],
      },
    },
  });

  if (!client) notFound();

  // Aggregate stats
  const totalEarnedCents = client.jobs
    .filter((j) => j.status === "paid")
    .reduce((s, j) => s + j.totalAmountCents, 0);
  const pendingCents = client.jobs
    .filter((j) => j.status === "invoiced")
    .reduce((s, j) => s + j.totalAmountCents, 0);
  const paidCount = client.jobs.filter((j) => j.status === "paid").length;
  const lastJob   = client.jobs[0];

  // Build new-job URL pre-filled with this client's info
  const newJobParams = new URLSearchParams({
    ...(client.name  && { clientName:  client.name }),
    ...(client.phone && { clientPhone: client.phone }),
    ...(client.email && { clientEmail: client.email }),
  });

  const STATUS_DOT: Record<string, string> = {
    draft:    "bg-gray-300",
    invoiced: "bg-amber-400",
    paid:     "bg-emerald-500",
  };
  const STATUS_LABEL: Record<string, string> = {
    draft: "Draft", invoiced: "Sent", paid: "Paid",
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/clients"
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
        </div>

        {/* Avatar + name */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-blue-600 text-xl font-bold">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
              <div className="flex flex-col gap-0.5 mt-0.5">
                {client.phone && (
                  <a href={`tel:${client.phone}`}
                    className="flex items-center gap-1.5 text-sm text-blue-600 active:text-blue-800">
                    <Phone size={13} />
                    {client.phone}
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`}
                    className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Mail size={13} />
                    {client.email}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* New job CTA */}
          <Link
            href={`/job/new?${newJobParams.toString()}`}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-xl text-sm font-semibold active:bg-blue-700 shadow-sm shadow-blue-200"
          >
            <Plus size={15} />
            New Job
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card px-3 py-3 text-center">
            <TrendingUp size={15} className="text-emerald-500 mx-auto mb-1" />
            <p className="money font-bold text-gray-900 text-sm">
              {centsToDisplay(totalEarnedCents)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Earned</p>
          </div>
          <div className="card px-3 py-3 text-center">
            <Briefcase size={15} className="text-blue-500 mx-auto mb-1" />
            <p className="font-bold text-gray-900 text-sm">{client.jobs.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Jobs</p>
          </div>
          <div className={`card px-3 py-3 text-center ${pendingCents > 0 ? "bg-amber-50" : ""}`}>
            <Clock size={15} className={`mx-auto mb-1 ${pendingCents > 0 ? "text-amber-500" : "text-gray-300"}`} />
            <p className={`money font-bold text-sm ${pendingCents > 0 ? "text-amber-700" : "text-gray-900"}`}>
              {centsToDisplay(pendingCents)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Pending</p>
          </div>
        </div>

        {/* Job history */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Job History
            </p>
            <p className="text-xs text-gray-400">{paidCount} paid · {client.jobs.length} total</p>
          </div>

          {client.jobs.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="font-semibold text-gray-700 text-sm">No jobs yet</p>
              <p className="text-xs text-gray-400 mt-1">Tap "New Job" to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {client.jobs.map((job) => {
                const afterPhoto = job.photos.find(p => p.type === "after") ??
                                   job.photos.find(p => p.type === "before");
                return (
                  <Link key={job.id} href={`/job/${job.id}`}>
                    <div className="card p-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors">
                      {/* Thumbnail */}
                      {afterPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={afterPhoto.storageUrl}
                          alt="job"
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
                          <Briefcase size={16} className="text-gray-300" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {job.description ?? "No description"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatRelativeDate(job.createdAt)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <p className="money font-bold text-gray-900 text-sm">
                          {centsToDisplay(job.totalAmountCents)}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[job.status]}`} />
                          <span className={`text-[10px] font-semibold ${
                            job.status === "paid"     ? "text-emerald-600" :
                            job.status === "invoiced" ? "text-amber-600"   : "text-gray-400"
                          }`}>
                            {STATUS_LABEL[job.status]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {lastJob && (
          <p className="text-xs text-center text-gray-300 pb-2">
            Client since {formatDate(client.createdAt)}
          </p>
        )}
      </div>
    </div>
  );
}
