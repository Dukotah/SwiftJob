// Screen 4 — Profile & Connections
// Set up once. Stripe Connect, Google Business, and the public gallery link.

import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ExternalLink, CreditCard, Globe, Star, CheckCircle } from "lucide-react";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { stripe?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) redirect("/login");

  const stripeStatus = searchParams.stripe; // "success" | "pending" | "error" | undefined
  const galleryUrl   = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username ?? user.id}`;

  return (
    <div className="px-4 pt-6 pb-4">
      {/* User header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {user.businessName ?? user.name ?? "Your Profile"}
        </h1>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>

      {/* Stripe success/pending banner */}
      {stripeStatus === "success" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700 font-medium">Stripe connected! You can now accept payments.</p>
        </div>
      )}
      {stripeStatus === "pending" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
          <p className="text-sm text-yellow-700 font-medium">Stripe setup isn&apos;t quite complete. Tap below to finish.</p>
        </div>
      )}

      {/* Get Paid */}
      <Section title="Get Paid">
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <CreditCard size={20} className={user.stripeOnboardingDone ? "text-green-600 mt-0.5" : "text-blue-600 mt-0.5"} />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">
                {user.stripeOnboardingDone ? "Stripe Connected ✓" : "Connect Stripe"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                {user.stripeOnboardingDone
                  ? "Payment links are being generated automatically on every invoice."
                  : "Required to accept card payments. Money goes straight to your bank account."}
              </p>
              {!user.stripeOnboardingDone && (
                <a
                  href="/api/stripe/connect"
                  className="inline-block mt-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl active:bg-blue-700"
                >
                  Set Up Payments →
                </a>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Online Presence */}
      <Section title="Online Presence">
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <Star size={20} className="text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">
                {user.googleBusinessProfileId ? "Google Business Connected ✓" : "Google Business Profile"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Auto-post before/after photos to boost your local Google ranking.
              </p>
              {!user.googleBusinessProfileId && (
                <a href="/api/auth/google-business" className="inline-block mt-2 text-blue-600 text-sm font-semibold">
                  Connect Google →
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mx-4" />
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <Globe size={20} className="text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Public Portfolio Page</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                A shareable gallery of your completed work.
              </p>
              <a
                href={galleryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-blue-600 text-sm font-semibold"
              >
                View Page <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </Section>

      {/* Account */}
      <Section title="Account">
        <div className="px-4 py-3">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="font-semibold text-gray-900">{user.name ?? user.email}</p>
        </div>
        <div className="border-t border-gray-100 mx-4" />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="w-full px-4 py-3 text-left text-red-500 text-sm font-medium">
            Sign Out
          </button>
        </form>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2 px-1">{title}</p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">{children}</div>
    </div>
  );
}
