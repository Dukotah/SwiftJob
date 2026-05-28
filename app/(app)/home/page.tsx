// Home screen — earnings dashboard with weekly + monthly stats,
// quick stats strip, unpaid invoice badge, and recent activity feed.

import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import Link from "next/link";
import { centsToDisplay, formatRelativeDate } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  AlertCircle,
  DollarSign,
  ChevronRight,
} from "lucide-react";

// ── Activity feed helpers ────────────────────────────────────────────────────

const ACTIVITY_CONFIG = {
  paid:     { icon: "💰", label: "Payment received", color: "text-emerald-600" },
  invoiced: { icon: "📤", label: "Invoice sent",     color: "text-amber-600"   },
  draft:    { icon: "📋", label: "New job",          color: "text-gray-400"    },
} as const;

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId    = session.user.id;
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  // Date anchors
  const now = new Date();

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── Queries ────────────────────────────────────────────────────────────────

  // All jobs this month (used for weekly + monthly stats — filter in JS)
  const monthJobs = await db.query.jobs.findMany({
    where: and(eq(jobs.userId, userId), gte(jobs.createdAt, monthStart)),
    with:  { client: true },
    orderBy: [desc(jobs.updatedAt)],
  });

  // Recent activity feed — last 10 jobs across all time, by most recently updated
  const activityJobs = await db.query.jobs.findMany({
    where: eq(jobs.userId, userId),
    with:  { client: true },
    orderBy: [desc(jobs.updatedAt)],
    limit: 10,
  });

  // ── Aggregate stats ────────────────────────────────────────────────────────

  const weekJobs  = monthJobs.filter((j) => j.createdAt >= weekStart);

  const weekEarned  = weekJobs.filter((j) => j.status === "paid")    .reduce((s, j) => s + j.totalAmountCents, 0);
  const weekPending = weekJobs.filter((j) => j.status === "invoiced").reduce((s, j) => s + j.totalAmountCents, 0);
  const weekPaid    = weekJobs.filter((j) => j.status === "paid")    .length;
  const weekSent    = weekJobs.filter((j) => j.status === "invoiced").length;
  const weekDraft   = weekJobs.filter((j) => j.status === "draft")   .length;

  const monthEarned  = monthJobs.filter((j) => j.status === "paid")    .reduce((s, j) => s + j.totalAmountCents, 0);
  const unpaidCount  = monthJobs.filter((j) => j.status === "invoiced").length;

  // Greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <p className="text-sm text-gray-500 font-medium">{greeting},</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{firstName}</h1>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* ── Earnings hero card ─────────────────────────── */}
        <div className="bg-blue-600 rounded-3xl p-5 text-white shadow-lg shadow-blue-200">

          {/* Week + Month earnings */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-widest mb-1">
                This Week
              </p>
              <p className="money text-4xl font-bold text-white leading-none">
                {centsToDisplay(weekEarned)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-[11px] font-semibold uppercase tracking-widest mb-1">
                This Month
              </p>
              <p className="money text-2xl font-bold text-white leading-none">
                {centsToDisplay(monthEarned)}
              </p>
            </div>
          </div>

          {/* Sub-stats row */}
          <div className="flex items-center gap-3">
            {/* Pending */}
            <div className="flex-1 bg-blue-500/40 rounded-2xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={12} className="text-blue-200" />
                <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-wide">
                  Pending
                </p>
              </div>
              <p className="money text-white font-bold text-base">
                {centsToDisplay(weekPending)}
              </p>
            </div>

            {/* Unpaid invoices */}
            <div className={`flex-1 rounded-2xl px-3 py-2.5 ${
              unpaidCount > 0 ? "bg-amber-400/30" : "bg-blue-500/40"
            }`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                {unpaidCount > 0
                  ? <AlertCircle size={12} className="text-amber-200" />
                  : <CheckCircle size={12} className="text-blue-200" />
                }
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${
                  unpaidCount > 0 ? "text-amber-200" : "text-blue-200"
                }`}>
                  Unpaid
                </p>
              </div>
              <p className="money text-white font-bold text-base">
                {unpaidCount} {unpaidCount === 1 ? "invoice" : "invoices"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Quick stats strip ──────────────────────────── */}
        <div className="flex items-center gap-2">
          <div className="flex-1 card px-3 py-2.5 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400 leading-none">Paid</p>
              <p className="font-bold text-gray-900 text-sm leading-tight mt-0.5">{weekPaid}</p>
            </div>
          </div>
          <div className="flex-1 card px-3 py-2.5 flex items-center gap-2">
            <TrendingUp size={14} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400 leading-none">Sent</p>
              <p className="font-bold text-gray-900 text-sm leading-tight mt-0.5">{weekSent}</p>
            </div>
          </div>
          <div className="flex-1 card px-3 py-2.5 flex items-center gap-2">
            <FileText size={14} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-[11px] text-gray-400 leading-none">Draft</p>
              <p className="font-bold text-gray-900 text-sm leading-tight mt-0.5">{weekDraft}</p>
            </div>
          </div>
        </div>

        {/* ── New Job quick action ───────────────────────── */}
        <Link href="/job/new">
          <div className="card p-4 flex items-center justify-between active:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <DollarSign size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Start a new job</p>
                <p className="text-xs text-gray-400">Photo → Invoice → Paid</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>
        </Link>

        {/* ── Recent activity feed ───────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Recent Activity
            </p>
            <p className="text-xs text-gray-400">{activityJobs.length} jobs</p>
          </div>

          {activityJobs.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-3">📋</p>
              <p className="font-semibold text-gray-700">No jobs yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Tap the + button to capture your first job
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activityJobs.map((job) => {
                const cfg = ACTIVITY_CONFIG[job.status];
                return (
                  <Link key={job.id} href={`/job/${job.id}`}>
                    <div className="card p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
                      {/* Activity icon */}
                      <span className="text-lg w-8 text-center shrink-0">{cfg.icon}</span>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {job.client?.name ?? "Unknown client"}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {job.description ?? "No description"}
                          {" · "}
                          {formatRelativeDate(job.updatedAt)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <p className="money font-bold text-gray-900 text-sm">
                          {centsToDisplay(job.totalAmountCents)}
                        </p>
                        <span className={`text-[10px] font-semibold ${cfg.color}`}>
                          {job.status === "paid"
                            ? "Paid"
                            : job.status === "invoiced"
                            ? "Sent"
                            : "Draft"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
