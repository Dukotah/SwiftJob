// lib/gbp.ts
//
// Google Business Profile API client.
//
// API documentation:
//   Account management: https://developers.google.com/my-business/reference/accountmanagement/rest
//   Business info:      https://developers.google.com/my-business/reference/businessinformation/rest
//   Posts (v4):         https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts
//
// SETUP REQUIRED:
//   1. Enable "My Business API" in Google Cloud Console
//   2. Add scope: https://www.googleapis.com/auth/business.manage
//   3. Add redirect URI: {APP_URL}/api/gbp/callback
//   4. User connects via /api/gbp/connect → tokens saved to users table

const ACCOUNTS_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const POSTS_API    = "https://mybusiness.googleapis.com/v4";

// ── Token management ──────────────────────────────────────────────────────────

/**
 * Exchange an authorization code for access + refresh tokens.
 * Called in the OAuth callback route.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token:  string;
  refresh_token: string;
  expires_in:    number;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/gbp/callback`,
      grant_type:    "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Token exchange failed: ${JSON.stringify(err)}`);
  }

  return res.json();
}

/**
 * Use a refresh token to get a new access token.
 * Access tokens expire after 1 hour — call this before any GBP API request.
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Token refresh failed: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Account + Location discovery ──────────────────────────────────────────────

export interface GbpAccount {
  name:        string; // e.g. "accounts/123456789"
  accountName: string; // Human readable business name
  type:        string;
}

export interface GbpLocation {
  name:         string; // e.g. "accounts/123456789/locations/987654321"
  title:        string; // Business name at this location
  websiteUri?:  string;
}

/**
 * Fetch all GBP accounts the user has access to.
 */
export async function listAccounts(accessToken: string): Promise<GbpAccount[]> {
  const res = await fetch(`${ACCOUNTS_API}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`listAccounts failed: ${res.status}`);

  const data = await res.json();
  return (data.accounts ?? []) as GbpAccount[];
}

/**
 * Fetch all locations under a GBP account.
 */
export async function listLocations(
  accessToken: string,
  accountName: string
): Promise<GbpLocation[]> {
  const res = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,websiteUri`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) throw new Error(`listLocations failed: ${res.status}`);

  const data = await res.json();
  return (data.locations ?? []) as GbpLocation[];
}

// ── Posting ───────────────────────────────────────────────────────────────────

export interface GbpPostResult {
  name:       string; // e.g. "accounts/.../locations/.../localPosts/..."
  state:      string;
  createTime: string;
}

/**
 * Create a local post on Google Business Profile.
 *
 * @param locationName - Full location resource name, e.g. "accounts/123/locations/456"
 * @param summary      - The text content of the post (caption)
 * @param photoUrls    - Optional array of public image URLs to attach
 */
export async function createGbpPost({
  accessToken,
  locationName,
  summary,
  photoUrls = [],
}: {
  accessToken:  string;
  locationName: string;
  summary:      string;
  photoUrls?:   string[];
}): Promise<GbpPostResult> {
  const body: Record<string, unknown> = {
    languageCode: "en-US",
    summary,
    topicType: "STANDARD",
  };

  // Attach photos if provided
  if (photoUrls.length > 0) {
    body.media = photoUrls.slice(0, 10).map((url) => ({
      mediaFormat: "PHOTO",
      sourceUrl:   url,
    }));
  }

  const res = await fetch(
    `${POSTS_API}/${locationName}/localPosts`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`createGbpPost failed: ${JSON.stringify(err)}`);
  }

  return res.json() as Promise<GbpPostResult>;
}
