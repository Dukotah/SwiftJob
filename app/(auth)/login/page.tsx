"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail]         = useState("");
  const [sending, setSending]     = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl: "/home" });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    await signIn("resend", { email, callbackUrl: "/home", redirect: false });
    setSending(false);
    setEmailSent(true);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-blue-600 rounded-xl p-2">
          <Zap size={28} color="white" />
        </div>
        <span className="text-3xl font-bold text-gray-900">SwiftJobs</span>
      </div>
      <p className="text-gray-500 text-center mb-10">Snap. Invoice. Get paid.</p>

      {emailSent ? (
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm">
            We sent a sign-in link to <strong>{email}</strong>. Tap it to log in.
          </p>
          <button onClick={() => setEmailSent(false)} className="mt-6 text-blue-600 text-sm font-medium">
            Use a different email
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-2xl py-4 font-semibold text-gray-800 text-base active:bg-gray-50 min-h-[56px]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-base"
            />
            <button
              type="submit"
              disabled={sending || !email}
              className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold text-base disabled:opacity-50 active:bg-blue-700 min-h-[56px]"
            >
              {sending ? "Sending link..." : "Send sign-in link"}
            </button>
          </form>

          <p className="text-xs text-center text-gray-400 pt-2">
            No password needed. We&apos;ll email you a one-tap sign-in link.
          </p>

          {process.env.NEXT_PUBLIC_DEV_BYPASS_ENABLED === "true" && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">dev only</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <a
                href="/api/dev-auth"
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-2xl py-4 font-bold text-base active:bg-gray-800 min-h-[56px]"
              >
                🛠 Developer Access
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
