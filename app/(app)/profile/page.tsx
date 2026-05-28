// Screen 4 — Profile & Connections
// Set up once. Stripe Connect, Google Business, and the public gallery link.

import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ExternalLink, CreditCard, Globe, Star, CheckCircle, ChevronRight, AlertCircle, Building2, Pencil } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage({
  searchParams,
}: {
    searchParams: Promise<{ stripe?: string }>;
}) {
    const { stripe: stripeStatus } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) redirect("/login");

  
  const galleryUrl   = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username ?? user.id}`;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {/* Avatar placeholder */}
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-blue-600">
              {(user.businessName ?? user.name ?? "?")[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {user.businessName ?? user.name ?? "Your Profile"}
            </h1>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
            {user.tradeType && (
              <p className="text-xs text-blue-600 font-semibold mt-0.5 capitalize">{user.tradeType.replace(/_/g, " ")}</p>
            )}
          </div>
          <Link
            href="/profile/edit"
            className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center active:bg-gray-200 shrink-0"
            aria-label="Edit profile"
          >
            <Pencil size={15} className="text-gray-500" />
          </Link>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* ── Stripe status banner ───────────────────────── */}
        {stripeStatus === "success" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">Stripe connected! You can now accept card payments.</p>
          </div>
        )}
        {stripeStatus === "pending" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">Stripe setup isn&apos;t complete. Tap below to finish.</p>
          </div>
        )}

        {/* ── Get Paid ───────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Get Paid</p>
          <div className="card overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user.stripeOnboardingDone ? "bg-emerald-50" : "bg-blue-50"}`}>
                <CreditCard size={20} className={user.stripeOnboardingDone ? "text-emerald-600" : "text-blue-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">
                  {user.stripeOnboardingDone ? "Stripe Connected" : "Connect Stripe"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {user.stripeOnboardingDone
                    ? "Payment links auto-generated on every invoice"
                    : "Accept card payments — money goes straight to your bank"}
                </p>
              </div>
              {user.stripeOnboardingDone ? (
                <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              ) : (
                <a
                  href="/api/stripe/connect"
                  className="shrink-0 bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl active:bg-blue-700 whitespace-nowrap"
                >
                  Set Up →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Online Presence ────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Online Presence</p>
          <div className="card overflow-hidden divide-y divide-gray-100">

            {/* Google Business */}
            <div className="flex items-center gap-4 px-4 py-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user.googleBusinessProfileId ? "bg-emerald-50" : "bg-yellow-50"}`}>
                <Star size={20} className={user.googleBusinessProfileId ? "text-emerald-500" : "text-yellow-500"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">
                  {user.googleBusinessProfileId ? "Google Business Connected" : "Google Business Profile"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Auto-post before/after photos to boost local rankings
                </p>
              </div>
              {user.googleBusinessProfileId ? (
                <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              ) : (
                <a
                  href="/api/auth/google-business"
                  className="shrink-0 text-blue-600 text-xs font-bold whitespace-nowrap"
                >
                  Connect →
                </a>
              )}
            </div>

            {/* Portfolio page */}
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <Globe size={20} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Public Portfolio</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{galleryUrl}</p>
              </div>
              <a
                href={galleryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <ExternalLink size={18} className="text-blue-500" />
              </a>
            </div>
          </div>
        </div>

        {/* ── Account ────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Account</p>
          <div className="card overflow-hidden divide-y divide-gray-100">
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Signed in as</p>
                <p className="font-semibold text-gray-900 text-sm truncate">{user.name ?? user.email}</p>
              </div>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="w-full flex items-center gap-4 px-4 py-4 text-left active:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-red-500 text-lg">↩</span>
                </div>
                <p className="flex-1 font-semibold text-red-500 text-sm">Sign Out</p>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
