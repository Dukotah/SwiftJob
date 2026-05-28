// middleware.ts — ROOT of your project
// Runs on every request before the page loads.
// 1. Redirects logged-out users to /login
// 2. Redirects new users (no businessName) to /onboarding

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default auth(async (req) => {
  const { nextUrl, auth: session } = req as NextRequest & { auth: typeof req.auth };

  const isLoggedIn    = !!session?.user?.id;
  const isAuthRoute   = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/api/auth");
  const isOnboarding  = nextUrl.pathname === "/onboarding";
  const isPublic      = nextUrl.pathname.startsWith("/api") || nextUrl.pathname.startsWith("/_next");

  // Let public/auth routes through
  if (isAuthRoute || isPublic) return NextResponse.next();

  // Redirect logged-out users to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Check if new user needs onboarding (skip if already there)
  if (!isOnboarding) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session!.user!.id!),
    });
    if (user && !user.businessName) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
