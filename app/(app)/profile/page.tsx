// Screen 4 — Profile & Connections
// Set up once. Almost never revisited.
// Stripe Connect, Google Business, and the public gallery link all live here.

import { ExternalLink, CreditCard, Globe, Star } from "lucide-react";

export default function ProfilePage() {
  // TODO: Replace with real session data once auth is set up
  const user = {
    name: "Duke",
    businessName: "Duke's Pressure Washing",
    tradeType: "Pressure Washing",
    username: "dukes-pressure-washing",
    stripeOnboardingDone: false,
    googleConnected: false,
    galleryEnabled: true,
  };

  const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user.username}`;

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.businessName}</h1>
      <p className="text-sm text-gray-500 mb-6">{user.tradeType}</p>

      {/* Get Paid section */}
      <Section title="Get Paid">
        <SettingRow
          icon={<CreditCard size={20} className="text-blue-600" />}
          title="Connect Stripe"
          description="Required to accept payments. Your money goes straight to your bank."
          actionLabel={user.stripeOnboardingDone ? "Connected ✓" : "Set Up Payments"}
          actionHref="/api/stripe/connect"
          done={user.stripeOnboardingDone}
        />
      </Section>

      {/* Online Presence section */}
      <Section title="Online Presence">
        <SettingRow
          icon={<Star size={20} className="text-yellow-500" />}
          title="Google Business Profile"
          description="Auto-post before/after photos to boost your local Google ranking."
          actionLabel={user.googleConnected ? "Connected ✓" : "Connect Google"}
          actionHref="/api/auth/google"
          done={user.googleConnected}
        />
        <div className="border-t border-gray-100 mx-4" />
        <SettingRow
          icon={<Globe size={20} className="text-green-600" />}
          title="Public Portfolio Page"
          description="A shareable gallery of your completed work at your own URL."
          actionLabel="View Page"
          actionHref={galleryUrl}
          external
          done={false}
        />
      </Section>

      {/* Account section */}
      <Section title="Account">
        <div className="px-4 py-3">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="font-semibold text-gray-900">{user.name}</p>
        </div>
        <div className="border-t border-gray-100 mx-4" />
        <button className="w-full px-4 py-3 text-left text-red-500 text-sm font-medium">
          Sign Out
        </button>
      </Section>
    </div>
  );
}

// ── Section Component ─────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ── Setting Row Component ─────────────────────────────────────────────────────
function SettingRow({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  done = false,
  external = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  done?: boolean;
  external?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
        <a
          href={actionHref}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className={`inline-flex items-center gap-1 mt-2 text-sm font-semibold ${
            done ? "text-green-600" : "text-blue-600"
          }`}
        >
          {actionLabel}
          {external && <ExternalLink size={12} />}
        </a>
      </div>
    </div>
  );
}
