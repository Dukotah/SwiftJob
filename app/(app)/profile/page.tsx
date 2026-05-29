// Screen 4 — Profile & Connections
// Set up once. Stripe Connect, Google Business, and the public gallery link.

import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ExternalLink, CreditCard, Globe, Star, CheckCircle, ChevronRight, AlertCircle, Building2, Pencil, MessageSquare, Code2 } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage({
  searchParams,
}: {
    searchParams: Promise<{ stripe?: string; review?: string; gbp?: string }>;
}) {
    const { stripe: stripeStatus, review: reviewStatus, gbp: gbpStatus } = await searchParams;
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
        {reviewStatus === "saved" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">Review automation saved! Clients will be asked for a review after they pay.</p>
          </div>
        )}
        {gbpStatus === "connected" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">Google Business connected! You can now post directly from job detail pages.</p>
          </div>
        )}
        {(gbpStatus === "error" || gbpStatus === "denied") && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {gbpStatus === "denied"
                ? "Google Business connection was cancelled."
                : "Failed to connect Google Business. Please try again."}
            </p>
          </div>
        )}
        {gbpStatus === "no_account" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 font-medium">No Google Business account found. Make sure you&apos;re signed in with the right Google account.</p>
          </div>
        )}

        {/* ── Get Paid ───────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Get Paid</p>
          <div className={`overflow-hidden rounded-2xl border shadow-sm ${user.stripeOnboardingDone ? "bg-white border-gray-100" : "bg-blue-50 border-2 border-blue-200"}`}>
            <div className="flex items-center gap-4 px-4 py-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user.stripeOnboardingDone ? "bg-emerald-50" : "bg-blue-100"}`}>
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
                  className="shrink-0 bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm active:bg-blue-700 whitespace-nowrap"
                >
                  Set Up →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Review Automation ──────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Review Automation</p>
          <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${user.googleBusinessProfileId ? "border-gray-100" : "border-2 border-amber-200 bg-amber-50/30"}`}>
            <div className="flex items-start gap-4 px-4 pt-4 pb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user.googleBusinessProfileId ? "bg-emerald-50" : "bg-amber-50"}`}>
                <MessageSquare size={20} className={user.googleBusinessProfileId ? "text-emerald-600" : "text-amber-500"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">
                  {user.googleBusinessProfileId ? "Review Automation Active" : "Auto-Request Google Reviews"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  {user.googleBusinessProfileId
                    ? "Clients receive a review request automatically after they pay."
                    : "After a job is paid, automatically text + email your client a Google review link."}
                </p>
              </div>
              {user.googleBusinessProfileId && (
                <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              )}
            </div>

            {/* Place ID form */}
            <form
              action={async (formData: FormData) => {
                "use server";
                const { auth: authFn } = await import("@/auth");
                const { db: dbClient } = await import("@/db");
                const { users: usersTable } = await import("@/db/schema");
                const { eq: eqFn } = await import("drizzle-orm");
                const { redirect: redirectFn } = await import("next/navigation");

                const sess = await authFn();
                if (!sess?.user?.id) redirectFn("/login");

                const placeId = (formData.get("placeId") as string)?.trim();
                await dbClient
                  .update(usersTable)
                  .set({ googleBusinessProfileId: placeId || null, updatedAt: new Date() })
                  .where(eqFn(usersTable.id, sess!.user!.id!));

                redirectFn("/profile?review=saved");
              }}
              className="px-4 pb-4"
            >
              <div className="space-y-2">
                <input
                  type="text"
                  name="placeId"
                  defaultValue={user.googleBusinessProfileId ?? ""}
                  placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800 placeholder:text-gray-300 outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
                <div className="flex items-center justify-between">
                  <a
                    href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 font-medium flex items-center gap-1"
                  >
                    Find my Place ID <ExternalLink size={11} />
                  </a>
                  <button
                    type="submit"
                    className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg active:bg-gray-700"
                  >
                    Save
                  </button>
                </div>
                {user.googleBusinessProfileId && (
                  <p className="text-xs text-gray-400">
                    Review link: <span className="text-blue-600 break-all">search.google.com/local/writereview?placeid={user.googleBusinessProfileId.slice(0, 16)}…</span>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── Online Presence ────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Online Presence</p>
          <div className="card overflow-hidden divide-y divide-gray-100">

            {/* Google Business — direct posting via API */}
            <div className="flex items-start gap-4 px-4 py-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user.gbpLocationName ? "bg-emerald-50" : "bg-yellow-50"}`}>
                <Star size={20} className={user.gbpLocationName ? "text-emerald-500" : "text-yellow-500"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">
                  {user.gbpLocationName ? "GBP Auto-Posting Active" : "Google Business Posting"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  {user.gbpLocationName
                    ? "Post directly to Google Business from any job — one tap."
                    : "Connect once to post before/after photos directly to Google Business."}
                </p>
              </div>
              {user.gbpLocationName ? (
                <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <a
                  href="/api/gbp/connect"
                  className="shrink-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap active:bg-yellow-500"
                >
                  Connect →
                </a>
              )}
            </div>

            {/* Portfolio page */}
            <Link href="/gallery" className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <Globe size={20} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">Portfolio & Post History</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">Manage visibility + GBP posts</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </Link>
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

            {/* Dev quick nav */}
            <Link
              href="/dev"
              className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                <Code2 size={20} className="text-violet-500" />
              </div>
              <p className="flex-1 font-semibold text-gray-700 text-sm">Developer Quick Nav</p>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </Link>

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
