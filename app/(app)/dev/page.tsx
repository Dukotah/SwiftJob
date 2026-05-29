// Dev screen — quick navigation to every route in the app.
// Accessible at /dev (requires auth).
// Linked from the bottom of the Profile page Account section.

import Link from "next/link";
import { ChevronRight } from "lucide-react";

const ROUTE_GROUPS = [
  {
    label: "Main Screens",
    routes: [
      { label: "Home",       href: "/home" },
      { label: "All Jobs",   href: "/jobs" },
      { label: "Analytics",  href: "/analytics" },
      { label: "Clients",    href: "/clients" },
      { label: "Profile",    href: "/profile" },
    ],
  },
  {
    label: "Job Flow",
    routes: [
      { label: "New Job",          href: "/job/new" },
      { label: "Job Detail (test)", href: "/jobs" },
      { label: "Edit Job (test)",   href: "/jobs" },
    ],
  },
  {
    label: "Marketing",
    routes: [
      { label: "Create Social Post (test)", href: "/jobs" },
    ],
  },
  {
    label: "Client-Facing (Public)",
    routes: [
      { label: "Pay Page  → /pay/[id]",    href: "/pay/test-invalid" },
      { label: "Review Intercept → /review/[id]", href: "/review/test-invalid" },
      { label: "Portfolio → /[username]",  href: "/dev-preview-only" },
    ],
  },
  {
    label: "Auth",
    routes: [
      { label: "Login",       href: "/login" },
      { label: "Onboarding",  href: "/onboarding" },
    ],
  },
  {
    label: "API Routes (GET)",
    routes: [
      { label: "GBP Connect OAuth",      href: "/api/gbp/connect" },
      { label: "DB Setup (needs secret)", href: "/api/db/setup" },
    ],
  },
];

export default function DevPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">Developer</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quick Nav</h1>
        <p className="text-sm text-gray-400 mt-1">Every route in SwiftJobs</p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {ROUTE_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
              {group.label}
            </p>
            <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm border border-gray-100">
              {group.routes.map((route) => (
                <Link
                  key={route.href + route.label}
                  href={route.href}
                  className="flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{route.label}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{route.href}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Back to profile */}
        <Link
          href="/profile"
          className="block text-center text-sm text-gray-400 font-medium pb-4"
        >
          ← Back to Profile
        </Link>
      </div>
    </div>
  );
}
