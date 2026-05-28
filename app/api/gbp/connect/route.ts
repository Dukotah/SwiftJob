// GET /api/gbp/connect
//
// Initiates the Google Business Profile OAuth flow.
// This is SEPARATE from the sign-in OAuth — it requests the
// business.manage scope so we can post to GBP on the user's behalf.
//
// After connecting, the user is redirected to /api/gbp/callback
// which fetches their account/location and saves everything to the DB.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
].join(" ");

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/gbp/callback`,
    response_type: "code",
    scope:         SCOPES,
    access_type:   "offline",   // Request refresh token
    prompt:        "consent",   // Force consent screen to always get refresh token
    state:         session.user.id, // Pass userId so callback knows who to update
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
