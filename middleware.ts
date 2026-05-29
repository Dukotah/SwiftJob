import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Routes that require no authentication
const ALWAYS_PUBLIC = [
    "/login",
    "/api/auth",
    "/api",
    "/_next",
    "/pay/",     // client-facing invoice pay page
    "/review/",  // client-facing review intercept page
  ];

// Top-level path segments that belong to the authenticated app.
// Anything else (single-segment paths like /{username}) is treated as the
// public gallery, so it's allowed through for unauthenticated visitors.
const APP_SEGMENTS = new Set([
    "home", "job", "invoice", "profile", "clients",
    "jobs", "onboarding", "dev", "pay", "analytics",
    "gallery",   // authenticated gallery management page
    "feedback",  // private feedback inbox
  ]);

export default auth((req) => {
    const { nextUrl } = req;
    const session = req.auth;
    const isLoggedIn = !!session?.user?.id;
    const path = nextUrl.pathname;

                      // Always-public paths (API, Next internals, login, pay page)
                      if (ALWAYS_PUBLIC.some((p) => path.startsWith(p))) {
                            return NextResponse.next();
                      }

                      // Public gallery — single-segment paths like /dukes-pressure-washing
                      const segments = path.split("/").filter(Boolean);
    const isGallery = segments.length === 1 && !APP_SEGMENTS.has(segments[0]);
    if (isGallery) return NextResponse.next();

                      // Everything else requires auth
                      if (!isLoggedIn) {
                            return NextResponse.redirect(new URL("/login", nextUrl));
                      }

                      // New users who haven't completed onboarding yet
                      if (path !== "/onboarding" && !session.user.businessName) {
                            return NextResponse.redirect(new URL("/onboarding", nextUrl));
                      }

                      return NextResponse.next();
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
