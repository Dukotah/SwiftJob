"use client";

import { Home, Plus, User, BarChart2, Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/toast-provider";

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  match: (p: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/home",      icon: Home,      label: "Home",      match: (p) => p === "/home" },
  { href: "/jobs",      icon: Briefcase, label: "Jobs",      match: (p) => p.startsWith("/jobs") || p.startsWith("/job/") },
  { href: "/analytics", icon: BarChart2, label: "Analytics", match: (p) => p === "/analytics" },
  { href: "/profile",   icon: User,      label: "Profile",   match: (p) => p.startsWith("/profile") },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ToastProvider>
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "88px" }}>
        {children}
      </main>

      {/* Bottom nav — Home | Jobs | +New | Analytics | Profile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-[0_-1px_20px_rgba(0,0,0,0.06)] z-50 pb-safe">
        <div className="flex items-center justify-around px-1 pt-2 pb-1">

          {NAV_ITEMS.slice(0, 2).map(({ href, icon: Icon, label, match }) => {
            const active = match(pathname);
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[52px]">
                <Icon size={22} className={active ? "text-blue-600" : "text-gray-400"} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-semibold ${active ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />}
              </Link>
            );
          })}

          {/* New Job — elevated center FAB */}
          <Link href="/job/new" className="flex flex-col items-center -mt-5 px-2">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-transform">
              <Plus size={26} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-semibold text-blue-600 mt-1">New Job</span>
          </Link>

          {NAV_ITEMS.slice(2).map(({ href, icon: Icon, label, match }) => {
            const active = match(pathname);
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 min-w-[52px]">
                <Icon size={22} className={active ? "text-blue-600" : "text-gray-400"} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-semibold ${active ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />}
              </Link>
            );
          })}

        </div>
      </nav>
    </div>
    </ToastProvider>
  );
}
