// Dev screen — only shown when NEXT_PUBLIC_SHOW_DEV_BUTTON=true
// Use this page to navigate to any route in the app during development.

import Link from "next/link";
import { ChevronRight } from "lucide-react";

const ROUTES = [
  { label: "Home (Jobs list)", href: "/home" },
  { label: "New Job", href: "/job/new" },
  { label: "Profile", href: "/profile" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Login", href: "/login" },
];

export default function DevPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">Developer</p>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quick Nav</h1>
        <p className="text-sm text-gray-400 mt-1">
          Only visible when{" "}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SHOW_DEV_BUTTON=true</code>
        </p>
      </div>

      <div className="px-4 py-5 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-3">App Routes</p>
        <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-100 shadow-sm border border-gray-100">
          {ROUTES.map((route) => (
            <Link
              key={route.href}
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
    </div>
  );
}
