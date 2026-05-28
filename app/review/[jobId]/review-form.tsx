"use client";

// Star rating UI + feedback form for the review intercept page.
// 4-5 stars → redirect to Google.
// 1-3 stars → private feedback form.

import { useState, useTransition } from "react";
import { Star, CheckCircle, MessageSquare } from "lucide-react";

type Stage =
  | "rating"           // Initial — show star buttons
  | "google"           // 4-5 stars — redirect to Google
  | "feedback"         // 1-3 stars — private feedback form
  | "submitted";       // Feedback submitted — thank you screen

interface Props {
  jobId:        string;
  businessName: string;
  clientName?:  string;
  googleUrl:    string | null;
}

export function ReviewForm({ jobId, businessName, clientName, googleUrl }: Props) {
  const [stage,      setStage]      = useState<Stage>("rating");
  const [rating,     setRating]     = useState(0);
  const [hovered,    setHovered]    = useState(0);
  const [comment,    setComment]    = useState("");
  const [isPending,  startTransition] = useTransition();

  const firstName = clientName?.split(" ")[0] ?? "there";

  // ── Handle star tap ──────────────────────────────────────────────────────────

  function handleStarClick(star: number) {
    setRating(star);

    if (star >= 4) {
      // Happy client — send them to Google
      setStage("google");
      if (googleUrl) {
        setTimeout(() => { window.location.href = googleUrl; }, 800);
      }
    } else {
      // Unhappy client — capture private feedback
      setStage("feedback");
    }
  }

  // ── Submit private feedback ──────────────────────────────────────────────────

  function handleSubmitFeedback() {
    startTransition(async () => {
      try {
        await fetch("/api/review/feedback", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ jobId, rating, comment }),
        });
      } catch {
        // Don't block the thank-you screen even if the save fails
      }
      setStage("submitted");
    });
  }

  // ── Shared header ────────────────────────────────────────────────────────────

  const Header = () => (
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-blue-200">
        <span className="text-white text-2xl font-bold">
          {businessName.charAt(0).toUpperCase()}
        </span>
      </div>
      <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
    </div>
  );

  // ── STAGE: Rating ────────────────────────────────────────────────────────────

  if (stage === "rating") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <Header />

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-1">
              How did we do, {firstName}?
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Tap a star to rate your experience
            </p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform active:scale-90"
                  aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                >
                  <Star
                    size={44}
                    className="transition-colors"
                    fill={(hovered || rating) >= star ? "#facc15" : "none"}
                    stroke={(hovered || rating) >= star ? "#facc15" : "#d1d5db"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-300">
              {hovered === 5 ? "Excellent!" :
               hovered === 4 ? "Great!" :
               hovered === 3 ? "Good" :
               hovered === 2 ? "Fair" :
               hovered === 1 ? "Poor" : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── STAGE: Google redirect ───────────────────────────────────────────────────

  if (stage === "google") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">⭐</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
        <p className="text-gray-500 mb-6">
          So glad you had a great experience, {firstName}!
        </p>
        {googleUrl ? (
          <>
            <p className="text-sm text-gray-400 mb-4">Taking you to Google…</p>
            <a
              href={googleUrl}
              className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl text-base active:bg-blue-700"
            >
              Leave a Google Review ⭐
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            Your review link isn&apos;t set up yet — contact {businessName} directly.
          </p>
        )}
      </div>
    );
  }

  // ── STAGE: Private feedback ──────────────────────────────────────────────────

  if (stage === "feedback") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">We&apos;re sorry to hear that</h2>
            <p className="text-sm text-gray-400 mt-1">
              Your feedback goes directly to {businessName}. It&apos;s never made public.
            </p>
          </div>

          {/* Stars recap */}
          <div className="flex justify-center gap-1.5 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                fill={rating >= star ? "#facc15" : "none"}
                stroke={rating >= star ? "#facc15" : "#d1d5db"}
                strokeWidth={1.5}
              />
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What could we have done better?
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what happened…"
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm text-gray-800 outline-none resize-none border border-gray-100 focus:border-blue-300 focus:bg-white transition-colors"
            />
            <button
              onClick={handleSubmitFeedback}
              disabled={isPending || !comment.trim()}
              className="w-full mt-4 bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm active:bg-gray-700 disabled:opacity-50 transition-opacity"
            >
              {isPending ? "Sending…" : "Send Feedback"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STAGE: Submitted ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={40} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Got it, thank you</h2>
      <p className="text-gray-500">
        {businessName} will review your feedback. We appreciate you letting us know.
      </p>
    </div>
  );
}
