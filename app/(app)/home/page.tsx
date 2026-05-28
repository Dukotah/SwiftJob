// Screen 1 — Home / Today's Board
// Pulls real jobs from the database for the logged-in user.

import { auth } from "@/auth";
import { db } from "@/db";
import { jobs, clients } from "@/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import Link from "next/link";
import { centsToDisplay, formatRelativeDate } from "@/lib/utils";

const STATUS_STYLES = {
  draft:    "bg-gray-100 text-gray-600",
  invoiced: "bg-yellow-100 text-yellow-700",
  paid:     "bg-green-100 text-green-700",
};

const STATUS_LABELS = {
  draft:    "Draft",
  invoiced: "Invoiced",
  paid:     "Paid ✓",
};

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId    = session.user.id;
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  // Fetch this week's jobs, newest first
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const recentJobs = await db.query.jobs.findMany({
    where: and(eq(jobs.userId, userId), gte(jobs.createdAt, weekStart)),
    with: { client: true },
    orderBy: [desc(jobs.createdAt)],
    limit: 20,
  });

  const weeklyTotal = recentJobs
    .filter((j) => j.status === "paid")
    .reduce((sum, j) => sum + j.totalAmountCents, 0);

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hey, {firstName} 👋</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/job/new" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center">
          + New Job
        </Link>
      </div>

      <div className="bg-blue-600 rounded-2xl p-4 mb-6 text-white">
        <p className="text-sm opacity-80">This week</p>
        <p className="text-3xl font-bold">{centsToDisplay(weeklyTotal)}</p>
        <p className="text-sm opacity-80">earned</p>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">This Week</h2>

      {recentJobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No jobs yet this week.</p>
          <p className="text-sm mt-1">Tap + New Job to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentJobs.map((job) => (
            <Link key={job.id} href={`/job/${job.id}`}>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between active:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{job.client?.name ?? "Unknown"}</p>
                  <p className="text-sm text-gray-500 truncate">{job.description ?? "—"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(job.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
                  <p className="font-bold text-gray-900">{centsToDisplay(job.totalAmountCents)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[job.status]}`}>
                    {STATUS_LABELS[job.status]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
