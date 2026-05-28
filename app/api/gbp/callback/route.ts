// GET /api/gbp/callback
//
// Handles the OAuth callback from Google after the user grants
// business.manage access.
//
// Steps:
//   1. Exchange auth code for tokens
//   2. Fetch GBP accounts
//   3. Auto-select if only one account + one location; otherwise redirect to picker
//   4. Save tokens + account/location to users table
//   5. Redirect to /profile?gbp=connected (or ?gbp=error)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  exchangeCodeForTokens,
  listAccounts,
  listLocations,
} from "@/lib/gbp";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code   = searchParams.get("code");
  const state  = searchParams.get("state"); // userId we passed in connect route
  const error  = searchParams.get("error");

  // User denied access
  if (error || !code || !state) {
    return NextResponse.redirect(`${APP_URL}/profile?gbp=denied`);
  }

  try {
    // 1. Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // 2. Fetch GBP accounts
    const accounts = await listAccounts(tokens.access_token);

    if (accounts.length === 0) {
      return NextResponse.redirect(`${APP_URL}/profile?gbp=no_account`);
    }

    // 3. Use the first account (most solo operators have exactly one)
    const account = accounts[0];

    // 4. Fetch locations under that account
    const locations = await listLocations(tokens.access_token, account.name);

    if (locations.length === 0) {
      return NextResponse.redirect(`${APP_URL}/profile?gbp=no_location`);
    }

    // Use the first location (solo operators typically have one)
    const location = locations[0];

    // 5. Save to users table
    await db
      .update(users)
      .set({
        googleAccessToken:  tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        gbpAccountName:     account.name,
        gbpLocationName:    location.name,
        updatedAt:          new Date(),
      })
      .where(eq(users.id, state));

    return NextResponse.redirect(`${APP_URL}/profile?gbp=connected`);
  } catch (err) {
    console.error("[gbp/callback]", err);
    return NextResponse.redirect(`${APP_URL}/profile?gbp=error`);
  }
}
