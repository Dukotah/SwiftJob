// Home screen — Housecall Pro-style dashboard
// Earnings hero at top, job cards below, dead-simple to scan.

import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import Link from "next/link";
import { centsToDisplay, formatRelativeDate } from "@/lib/utils";
import { ChevronRight, TrendingUp, Clock, CheckCircle } from "lucide-react";

const BADGE: Record<string, string> = {
  draft:    "badge-draft",
  invoiced: "badge-invoiced",
  paid:     "badge-paid",
};

const LABEL: Record<string, string> = {
  draft:    "Draft",
  invoiced: "Sent",
  paid:     "Paid",
};

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId    = session.user.id;
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const recentJobs = await db.query.jobs.findMany({
    where: and(eq(jobs.userId, userId), gte(jobs.createdAt, weekStart)),
    with:  { client: true },
    orderBy: [desc(jobs.createdAt)],
    limit: 30,
  });

  const earned   = recentJobs.filter(j => j.status === "paid").reduce((s, j) => s + j.totalAmountCents, 0);
  const pending  = recentJobs.filter(j => j.status === "invoiced").reduce((s, j) => s + j.totalAmountCents, 0);
  const jobCount = recentJobs.filter(j => j.status === "paid").length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <p className="text-sm text-gray-500 font-medium">{greeting},</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{firstName}</h1>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── Earnings hero card — Cash App style ────────── */}
        <div className="bg-blue-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-200">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">This Week</p>
          <p className="money text-4xl font-bold text-white leading-none mb-4">
            {centsToDisplay(earned)}
          </p>

          <div className="flex items-center gap-4">
            {/* Pending */}
            <div className="flex-1 bg-blue-500/40 rounded-2xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={12} className="text-blue-200" />
                <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">Pending</p>
              </div>
              <p className="money text-white font-bold text-base">{centsToDisplay(pending)}</p>
            </div>
            {/* Jobs done */}
            <div className="flex-1 bg-blue-500/40 rounded-2xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <CheckCircle size={12} className="text-blue-200" />
                <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">Jobs Done</p>
              </div>
              <p className="money text-white font-bold text-base">{jobCount}</p>
            </div>
          </div>
        </div>

        {/* ── Quick action strip — Jobber style ──────────── */}
        <Link href="/job/new">
          <div className="card p-4 flex items-center justify-between active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Start a new job</p>
                <p className="text-xs text-gray-400">Photo → Invoice → Paid</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </Link>

        {/* ── Job list ───────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">This Week</p>
            <p className="text-xs text-gray-400">{recentJobs.length} jobs</p>
          </div>

          {recentJobs.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-3">📋</p>
              <p className="font-semibold text-gray-700">No jobs yet this week</p>
              <p className="text-sm text-gray-400 mt-1">Tap the + button to capture your first job</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <Link key={job.id} href={`/job/${job.id}`}>
                  <div className="card p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      job.status === "paid"     ? "bg-emerald-500" :
                      job.status === "invoiced" ? "bg-amber-400"   : "bg-gray-300"
                    }`} />

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {job.client?.name ?? "Unknown client"}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {job.description ?? "No description"} · {formatRelativeDate(job.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="money font-bold text-gray-900 text-sm">
                        {centsToDisplay(job.totalAmountCents)}
                      </p>
                      <span className={BADGE[job.status]}>{LABEL[job.status]}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
