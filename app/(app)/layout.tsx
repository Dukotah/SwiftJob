"use client";

import { Home, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "80px" }}>
        {children}
      </main>

      {/* Bottom nav — Jobber-style with active indicators */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 pb-safe">
        <div className="flex items-center justify-around px-4 pt-2 pb-1">

          {/* Jobs */}
          <Link href="/home" className="flex flex-col items-center gap-0.5 px-5 py-1 min-w-[60px]">
            <Home
              size={22}
              className={pathname === "/home" ? "text-blue-600" : "text-gray-400"}
              strokeWidth={pathname === "/home" ? 2.5 : 1.8}
            />
            <span className={`text-[10px] font-semibold ${pathname === "/home" ? "text-blue-600" : "text-gray-400"}`}>
              Jobs
            </span>
            {pathname === "/home" && (
              <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
            )}
          </Link>

          {/* New Job — elevated center button */}
          <Link href="/job/new" className="flex flex-col items-center -mt-5">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-transform">
              <Plus size={26} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-semibold text-blue-600 mt-1">New Job</span>
          </Link>

          {/* Profile */}
          <Link href="/profile" className="flex flex-col items-center gap-0.5 px-5 py-1 min-w-[60px]">
            <User
              size={22}
              className={pathname === "/profile" ? "text-blue-600" : "text-gray-400"}
              strokeWidth={pathname === "/profile" ? 2.5 : 1.8}
            />
            <span className={`text-[10px] font-semibold ${pathname === "/profile" ? "text-blue-600" : "text-gray-400"}`}>
              Profile
            </span>
            {pathname === "/profile" && (
              <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
            )}
          </Link>

        </div>
      </nav>
    </div>
  );
}
