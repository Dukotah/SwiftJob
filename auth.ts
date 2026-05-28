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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable:              users,
    accountsTable:           authAccounts,
    sessionsTable:           authSessions,
    verificationTokensTable: authVerificationTokens,
  }),

  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from:   process.env.RESEND_FROM_EMAIL!,
    }),
  ],

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // businessName comes from the DB user row via the DrizzleAdapter.
        // Storing it here avoids a second DB query in middleware.
        session.user.businessName = (user as { businessName?: string | null }).businessName ?? null;
      }
      return session;
    },
  },
});
