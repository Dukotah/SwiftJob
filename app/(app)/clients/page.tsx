// Clients screen — all clients with aggregated job stats
// Clients are auto-created when a job is captured, never manually.

import { auth } from "@/auth";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { centsToDisplay, formatRelativeDate } from "@/lib/utils";
import { Phone, Mail, Briefcase, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const allClients = await db.query.clients.findMany({
    where: eq(clients.userId, session.user.id),
    with: { jobs: true },
    orderBy: [desc(clients.createdAt)],
  });

  // Aggregate per-client stats in JS — data sets are small
  const clientsWithStats = allClients.map((client) => {
    const sortedJobs = [...client.jobs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const totalSpentCents = client.jobs
      .filter((j) => j.status === "paid")
      .reduce((sum, j) => sum + j.totalAmountCents, 0);
    const unpaidCents = client.jobs
      .filter((j) => j.status === "invoiced")
      .reduce((sum, j) => sum + j.totalAmountCents, 0);

    return {
      ...client,
      totalSpentCents,
      unpaidCents,
      jobCount: client.jobs.length,
      paidJobCount: client.jobs.filter((j) => j.status === "paid").length,
      lastJobDate: sortedJobs[0]?.createdAt ?? null,
    };
  });

  // Sort by total spent descending (best clients first)
  clientsWithStats.sort((a, b) => b.totalSpentCents - a.totalSpentCents);

  const totalRevenue = clientsWithStats.reduce((s, c) => s + c.totalSpentCents, 0);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clients</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-sm text-gray-400">
            {allClients.length} {allClients.length === 1 ? "client" : "clients"}
          </p>
          {totalRevenue > 0 && (
            <>
              <span className="text-gray-200">·</span>
              <p className="text-sm text-gray-400">
                {centsToDisplay(totalRevenue)} lifetime revenue
              </p>
            </>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">

        {clientsWithStats.length === 0 ? (
          <div className="card p-10 text-center mt-4">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-semibold text-gray-700">No clients yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Clients are added automatically when you create a job
            </p>
          </div>
        ) : (
          clientsWithStats.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
            <div className="card p-4 active:bg-gray-50 transition-colors">

              {/* Top row — name + total */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-base leading-tight">
                    {client.name}
                  </p>

                  {/* Contact info */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-1 text-xs text-blue-600 active:text-blue-800"
                      >
                        <Phone size={11} />
                        {client.phone}
                      </a>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-[180px]">
                        <Mail size={11} className="shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Revenue */}
                <div className="text-right shrink-0">
                  <p className="money font-bold text-gray-900 text-base leading-tight">
                    {centsToDisplay(client.totalSpentCents)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">total paid</p>
                </div>
              </div>

              {/* Bottom row — stats chips */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                  <Briefcase size={11} />
                  {client.jobCount} {client.jobCount === 1 ? "job" : "jobs"}
                </span>

                {client.unpaidCents > 0 && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg font-medium">
                    {centsToDisplay(client.unpaidCents)} unpaid
                  </span>
                )}

                {client.lastJobDate && (
                  <span className="text-xs text-gray-400 ml-auto">
                    Last job {formatRelativeDate(client.lastJobDate)}
                  </span>
                )}
                <ChevronRight size={14} className="text-gray-300 ml-auto shrink-0" />
              </div>
            </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
