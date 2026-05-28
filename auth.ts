import NextAuth, { type DefaultSession } from "next-auth";
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

declare module "next-auth" {
  interface Session {
        user: {
                id: string;
                businessName: string | null;
        } & DefaultSession["user"];
  }
}

// Build the providers list — Resend (magic-link email) is optional at build
// time so the app still compiles when RESEND_API_KEY is not yet set.
const providers = [
    Google({
          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    ...(process.env.RESEND_API_KEY
            ? [
                      Resend({
                                  apiKey: process.env.RESEND_API_KEY,
                                  from: process.env.RESEND_FROM_EMAIL ?? "noreply@swiftjob.app",
                      }),
                    ]
            : []),
  ];

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db, {
          usersTable: users,
          accountsTable: authAccounts,
          sessionsTable: authSessions,
          verificationTokensTable: authVerificationTokens,
    }),

    providers,

    pages: {
          signIn: "/login",
          error: "/login",
    },

    callbacks: {
          session({ session, user }) {
                  if (session.user) {
                            session.user.id = user.id;
                            session.user.businessName =
                                        (user as { businessName?: string | null }).businessName ?? null;
                  }
                  return session;
          },
    },
});
