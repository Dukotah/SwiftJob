// Analytics — revenue trends, top clients, job stats.
// Pure CSS bar chart — no charting library needed.

import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { centsToDisplay } from "@/lib/utils";
import { ArrowLeft, TrendingUp, Users, Briefcase, DollarSign } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const allJobs = await db.query.jobs.findMany({
    where: eq(jobs.userId, session.user.id),
    with: { client: true },
  });

  const paidJobs = allJobs.filter((j) => j.status === "paid");

  // ── All-time stats ────────────────────────────────────────────────────────
  const totalEarned  = paidJobs.reduce((s, j) => s + j.totalAmountCents, 0);
  const totalJobs    = allJobs.length;
  const avgJobCents  = paidJobs.length > 0 ? Math.round(totalEarned / paidJobs.length) : 0;
  const pendingCents = allJobs
    .filter((j) => j.status === "invoiced")
    .reduce((s, j) => s + j.totalAmountCents, 0);

  // ── Monthly revenue (last 6 months) ──────────────────────────────────────
  const now = new Date();
  const months: { label: string; short: string; cents: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const short = d.toLocaleDateString("en-US", { month: "short" });
    const cents = paidJobs
      .filter((j) => {
        const jd = new Date(j.paidAt ?? j.createdAt);
        return jd.getFullYear() === d.getFullYear() && jd.getMonth() === d.getMonth();
      })
      .reduce((s, j) => s + j.totalAmountCents, 0);
    months.push({ label, short, cents });
  }

  const maxCents = Math.max(...months.map((m) => m.cents), 1);
  const bestMonth = [...months].sort((a, b) => b.cents - a.cents)[0];

  // ── Top clients ───────────────────────────────────────────────────────────
  const clientMap = new Map<string, { name: string; cents: number; jobCount: number }>();
  for (const job of paidJobs) {
    if (!job.clientId || !job.client) continue;
    const existing = clientMap.get(job.clientId) ?? { name: job.client.name, cents: 0, jobCount: 0 };
    clientMap.set(job.clientId, {
      ...existing,
      cents:    existing.cents + job.totalAmountCents,
      jobCount: existing.jobCount + 1,
    });
  }
  const topClients = [...clientMap.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-5 border-b border-gray-100 flex items-center gap-3">
        <Link href="/home" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400">All-time performance</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── All-time stats grid ──────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                <DollarSign size={14} className="text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500">Total Earned</p>
            </div>
            <p className="money text-2xl font-bold text-gray-900">{centsToDisplay(totalEarned)}</p>
            <p className="text-xs text-gray-400 mt-1">all time</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500">Avg Job</p>
            </div>
            <p className="money text-2xl font-bold text-gray-900">{centsToDisplay(avgJobCents)}</p>
            <p className="text-xs text-gray-400 mt-1">per paid job</p>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                <Briefcase size={14} className="text-purple-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500">Total Jobs</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
            <p className="text-xs text-gray-400 mt-1">{paidJobs.length} paid</p>
          </div>

          <div className={`card p-4 ${pendingCents > 0 ? "bg-amber-50" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${pendingCents > 0 ? "bg-amber-100" : "bg-gray-50"}`}>
                <Users size={14} className={pendingCents > 0 ? "text-amber-600" : "text-gray-400"} />
              </div>
              <p className="text-xs font-semibold text-gray-500">Outstanding</p>
            </div>
            <p className={`money text-2xl font-bold ${pendingCents > 0 ? "text-amber-700" : "text-gray-900"}`}>
              {centsToDisplay(pendingCents)}
            </p>
            <p className="text-xs text-gray-400 mt-1">unpaid invoices</p>
          </div>
        </div>

        {/* ── Monthly revenue bar chart ────────────────────── */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-900">Monthly Revenue</p>
            {bestMonth.cents > 0 && (
              <p className="text-xs text-gray-400">
                Best: <span className="text-emerald-600 font-semibold">{bestMonth.short}</span>
              </p>
            )}
          </div>

          {paidJobs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No paid jobs yet</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {months.map((m) => {
                const heightPct = maxCents > 0 ? (m.cents / maxCents) * 100 : 0;
                const isBest    = m.cents === bestMonth.cents && m.cents > 0;
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex flex-col justify-end" style={{ height: "96px" }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          isBest ? "bg-blue-600" : m.cents > 0 ? "bg-blue-200" : "bg-gray-100"
                        }`}
                        style={{ height: `${Math.max(heightPct, m.cents > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{m.short}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Top clients ──────────────────────────────────── */}
        {topClients.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
              Top Clients
            </p>
            <div className="space-y-2">
              {topClients.map((client, i) => {
                const barPct = (client.cents / topClients[0].cents) * 100;
                return (
                  <Link key={client.id} href={`/clients/${client.id}`}>
                    <div className="card p-4 active:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-300 w-4">#{i + 1}</span>
                          <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="money font-bold text-gray-900 text-sm">
                            {centsToDisplay(client.cents)}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {client.jobCount} {client.jobCount === 1 ? "job" : "jobs"}
                          </p>
                        </div>
                      </div>
                      {/* Revenue bar */}
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
