"use client";

// "Send Review Request" button — shown on paid job detail pages.
// Sends the client an SMS + email asking them to rate the job.

import { useState } from "react";
import { Star, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface Props {
  jobId:              string;
  alreadySent:        boolean; // true if review request was already sent
  hasContactInfo:     boolean; // false if client has no phone/email
}

export function SendReviewButton({ jobId, alreadySent, hasContactInfo }: Props) {
  const { showToast }        = useToast();
  const [loading,  setLoading]  = useState(false);
  const [sent,     setSent]     = useState(alreadySent);

  if (!hasContactInfo) return null;

  async function handleSend() {
    setLoading(true);
    try {
      const res  = await fetch("/api/review/request", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ jobId }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Failed to send", "error");
      } else {
        setSent(true);
        showToast("Review request sent!", "success");
      }
    } catch {
      showToast("Connection error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold">
        <CheckCircle size={16} />
        Review request sent
      </div>
    );
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white border-2 border-amber-200 text-amber-700 font-bold text-sm active:bg-amber-50 disabled:opacity-60 transition-opacity"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Star size={16} />
      )}
      {loading ? "Sending…" : "Ask for a Google Review"}
    </button>
  );
}
