import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, authSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  if (process.env.DEV_BYPASS_ENABLED !== "true") {
    return NextResponse.json({ error: "Not enabled" }, { status: 403 });
  }

  const devEmail = "dev@swiftjobs.local";

  // Find or create the dev user with a complete profile so onboarding is skipped
  let user = await db.query.users.findFirst({
    where: eq(users.email, devEmail),
  });

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        email:        devEmail,
        name:         "Dev User",
        businessName: "Dev Business",
        username:     "dev-business",
        tradeType:    "handyman",
      })
      .returning();
  }

  // Create an Auth.js-compatible database session
  const sessionToken = crypto.randomUUID();
  const expires      = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.insert(authSessions).values({
    sessionToken,
    userId:  user.id,
    expires,
  });

  // Auth.js uses __Secure- prefix on HTTPS (production/Vercel), plain name on HTTP (local)
  const useSecureCookies = process.env.NODE_ENV === "production";
  const cookieName       = useSecureCookies
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/home", appUrl));

  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    secure:   useSecureCookies,
    sameSite: "lax",
    expires,
    path:     "/",
  });

  return response;
}
