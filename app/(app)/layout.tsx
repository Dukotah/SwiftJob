"use client";

import { Home, Plus, User, Users, Terminal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/toast-provider";

const SHOW_DEV = process.env.NEXT_PUBLIC_SHOW_DEV_BUTTON === "true";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ToastProvider>
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "80px" }}>
        {children}
      </main>

      {/* Bottom nav — Home | Clients | +New Job | Profile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-[0_-1px_20px_rgba(0,0,0,0.06)] z-50 pb-safe">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">

          {/* Jobs / Home */}
          <Link href="/home" className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[56px]">
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

          {/* Clients */}
          <Link href="/clients" className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[56px]">
            <Users
              size={22}
              className={pathname === "/clients" ? "text-blue-600" : "text-gray-400"}
              strokeWidth={pathname === "/clients" ? 2.5 : 1.8}
            />
            <span className={`text-[10px] font-semibold ${pathname === "/clients" ? "text-blue-600" : "text-gray-400"}`}>
              Clients
            </span>
            {pathname === "/clients" && (
              <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
            )}
          </Link>

          {/* New Job — elevated center FAB */}
          <Link href="/job/new" className="flex flex-col items-center -mt-5 px-2">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-transform">
              <Plus size={26} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-semibold text-blue-600 mt-1">New Job</span>
          </Link>

          {/* Profile */}
          <Link href="/profile" className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[56px]">
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

          {/* Dev — only visible when NEXT_PUBLIC_SHOW_DEV_BUTTON=true */}
          {SHOW_DEV && (
            <Link href="/dev" className="flex flex-col items-center gap-0.5 px-4 py-1 min-w-[56px]">
              <Terminal
                size={22}
                className={pathname === "/dev" ? "text-violet-600" : "text-gray-400"}
                strokeWidth={pathname === "/dev" ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-semibold ${pathname === "/dev" ? "text-violet-600" : "text-gray-400"}`}>
                Dev
              </span>
              {pathname === "/dev" && (
                <span className="w-1 h-1 rounded-full bg-violet-600 mt-0.5" />
              )}
            </Link>
          )}

        </div>
      </nav>
    </div>
    </ToastProvider>
  );
}
