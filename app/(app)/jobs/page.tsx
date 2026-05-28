// All Jobs screen — full job history with status filter tabs and search.

import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { centsToDisplay, formatRelativeDate } from "@/lib/utils";
import { SearchInput } from "./search-input";

const TABS = [
  { key: "all",      label: "All"   },
  { key: "draft",    label: "Draft" },
  { key: "invoiced", label: "Sent"  },
  { key: "paid",     label: "Paid"  },
] as const;

type StatusKey = (typeof TABS)[number]["key"];

const STATUS_DOT: Record<string, string> = {
  draft:    "bg-gray-300",
  invoiced: "bg-amber-400",
  paid:     "bg-emerald-500",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", invoiced: "Sent", paid: "Paid",
};

export default async function AllJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { status: statusParam, q } = await searchParams;
  const activeStatus: StatusKey = (TABS.find((t) => t.key === statusParam)?.key) ?? "all";
  const searchQuery = (q ?? "").toLowerCase().trim();

  const allJobs = await db.query.jobs.findMany({
    where: eq(jobs.userId, session.user.id),
    with:  { client: true },
    orderBy: [desc(jobs.createdAt)],
  });

  const counts = {
    all:      allJobs.length,
    draft:    allJobs.filter((j) => j.status === "draft").length,
    invoiced: allJobs.filter((j) => j.status === "invoiced").length,
    paid:     allJobs.filter((j) => j.status === "paid").length,
  };

  // Apply status filter then search filter
  const filtered = allJobs
    .filter((j) => activeStatus === "all" || j.status === activeStatus)
    .filter((j) => {
      if (!searchQuery) return true;
      return (
        j.client?.name?.toLowerCase().includes(searchQuery) ||
        (j.description ?? "").toLowerCase().includes(searchQuery)
      );
    });

  // Group by month
  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, job) => {
    const key = new Date(job.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    (acc[key] ??= []).push(job);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">All Jobs</h1>
          <Link href="/home" className="text-sm text-gray-400 font-medium">← Home</Link>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
          {TABS.map((tab) => {
            const isActive = tab.key === activeStatus;
            return (
              <Link
                key={tab.key}
                href={`/jobs?status=${tab.key}${searchQuery ? `&q=${encodeURIComponent(q ?? "")}` : ""}`}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                  isActive ? "text-blue-600 border-blue-600 bg-blue-50/50" : "text-gray-400 border-transparent"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {counts[tab.key]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <Suspense fallback={<div className="h-14" />}>
        <SearchInput defaultValue={q ?? ""} />
      </Suspense>

      {/* Job list */}
      <div className="px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center mt-2">
            <p className="text-3xl mb-3">{searchQuery ? "🔍" : "📋"}</p>
            <p className="font-semibold text-gray-700">
              {searchQuery ? `No jobs matching "${q}"` : `No ${activeStatus === "all" ? "" : activeStatus} jobs yet`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? "Try a different search term" : "Tap + to capture your first job"}
            </p>
          </div>
        ) : (
          Object.entries(groups).map(([month, monthJobs]) => (
            <div key={month} className="mb-5">
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{month}</p>
                <p className="text-xs text-gray-400">{monthJobs.length} jobs</p>
              </div>

              <div className="space-y-2">
                {monthJobs.map((job) => (
                  <Link key={job.id} href={`/job/${job.id}`}>
                    <div className="card p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[job.status]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {job.client?.name ?? "Unknown client"}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {job.description ?? "No description"} · {formatRelativeDate(job.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <p className="money font-bold text-gray-900 text-sm">{centsToDisplay(job.totalAmountCents)}</p>
                        <span className={`text-[10px] font-semibold ${
                          job.status === "paid" ? "text-emerald-600" : job.status === "invoiced" ? "text-amber-600" : "text-gray-400"
                        }`}>
                          {STATUS_LABEL[job.status]}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
