import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  const isLoggedIn   = !!session?.user?.id;
  const isAuthRoute  = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/api/auth");
  const isOnboarding = nextUrl.pathname === "/onboarding";
  const isPublic     = nextUrl.pathname.startsWith("/api") || nextUrl.pathname.startsWith("/_next");

  if (isAuthRoute || isPublic) return NextResponse.next();

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // businessName is already on the session — no extra DB query needed.
  if (!isOnboarding && !session.user.businessName) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
