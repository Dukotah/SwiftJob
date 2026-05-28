// auth.ts — ROOT of your project (same level as package.json)
//
// This is the brain of your auth system. It tells Auth.js:
//   - Which sign-in methods to offer (Google + magic link email)
//   - Where to find users in your database
//   - What data to include in the session

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  authAccounts,
  authSessions,
  authVerificationTokens,
} from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Connects Auth.js to your Neon database via Drizzle
  adapter: DrizzleAdapter(db, {
    usersTable:              users,
    accountsTable:           authAccounts,
    sessionsTable:           authSessions,
    verificationTokensTable: authVerificationTokens,
  }),

  providers: [
    // ── Google Sign-In ──────────────────────────────────────────────────────
    // Tradespeople tap "Continue with Google" — one tap, done.
    // Set up at: console.cloud.google.com → APIs → Credentials → OAuth 2.0
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ── Magic Link Email ────────────────────────────────────────────────────
    // User enters their email → gets a sign-in link → tap → logged in.
    // No password. Great fallback for people without Google.
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from:   process.env.RESEND_FROM_EMAIL!,
    }),
  ],

  pages: {
    // Use our custom login page instead of Auth.js's default one
    signIn: "/login",
    error:  "/login",
  },

  callbacks: {
    // Add the user's database ID to their session token
    // This lets you do: const session = await auth(); session.user.id
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
