import { Home, PlusCircle, User } from "lucide-react";
import Link from "next/link";

// This layout wraps all four main app screens.
// It provides the bottom navigation bar that appears on every screen.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main content area — scrollable */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom navigation bar — always visible, thumb-friendly */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/home"
            className="flex flex-col items-center gap-1 px-6 py-2 text-gray-600 hover:text-blue-600 min-h-touch min-w-touch justify-center"
          >
            <Home size={24} />
            <span className="text-xs font-medium">Jobs</span>
          </Link>

          {/* Center button — Start New Job */}
          <Link
            href="/job/new"
            className="flex flex-col items-center gap-1 px-6 py-2 text-blue-600"
          >
            <div className="bg-blue-600 rounded-full p-3 shadow-lg -mt-6">
              <PlusCircle size={28} color="white" />
            </div>
            <span className="text-xs font-medium text-blue-600 mt-1">New Job</span>
          </Link>

          <Link
            href="/profile"
            className="flex flex-col items-center gap-1 px-6 py-2 text-gray-600 hover:text-blue-600 min-h-touch min-w-touch justify-center"
          >
            <User size={24} />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
