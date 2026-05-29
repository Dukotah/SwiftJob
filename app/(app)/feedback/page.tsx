// /feedback — Private Review Feedback Inbox
//
// Shows all 1-3 star private feedback captured by the review intercept page.
// These reviews NEVER went to Google — they're only visible here.
// Use this to identify patterns and follow up with unhappy clients.

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { reviewFeedback, jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";
import { MessageSquare, Star, ChevronRight, CheckCircle } from "lucide-react";

const STAR_COLORS: Record<number, string> = {
  1: "text-red-500",
  2: "text-red-400",
  3: "text-amber-500",
  4: "text-yellow-400",
  5: "text-yellow-400",
};

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch all review feedback for jobs owned by this user
  const allFeedback = await db.query.reviewFeedback.findMany({
    with: {
      job: {
        with: { client: true },
      },
    },
    orderBy: (rf, { desc }) => [desc(rf.createdAt)],
  });

  // Filter to only this user's jobs
  const myFeedback = allFeedback.filter(
    (f) => f.job?.userId === session.user.id
  );

  const avgRating = myFeedback.length
    ? (myFeedback.reduce((s, f) => s + f.rating, 0) / myFeedback.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <Link href="/home" className="text-sm text-gray-400 font-medium">← Home</Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">Private Feedback</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Ratings your clients left that never went to Google
        </p>
      </div>

      <div className="px-4 py-5 space-y-4">

        {myFeedback.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="font-bold text-gray-900 text-lg mb-1">No private feedback yet</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              When a client rates you 1-3 stars on the review link,{" "}
              their feedback is captured here privately instead of going to Google.
            </p>
          </div>
        ) : (
          <>
            {/* ── Summary strip ─────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{myFeedback.length}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">{avgRating ?? "—"}</p>
                <p className="text-xs text-gray-400 mt-0.5">Avg rating</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
                <p className="text-2xl font-bold text-red-500">
                  {myFeedback.filter((f) => f.rating <= 2).length}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Critical (1-2★)</p>
              </div>
            </div>

            {/* ── Feedback list ─────────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
                All Feedback
              </p>
              <div className="space-y-3">
                {myFeedback.map((item) => (
                  <Link key={item.id} href={`/job/${item.jobId}`}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 active:bg-gray-50 transition-colors">
                      {/* Client + date row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {item.job?.client?.name ?? "Unknown client"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.job?.description ?? "No description"} · {formatRelativeDate(item.createdAt)}
                          </p>
                        </div>
                        <ChevronRight size={15} className="text-gray-300 shrink-0 mt-0.5" />
                      </div>

                      {/* Star rating */}
                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            fill={item.rating >= star ? "currentColor" : "none"}
                            className={item.rating >= star ? STAR_COLORS[item.rating] : "text-gray-200"}
                          />
                        ))}
                        <span className={`text-xs font-bold ml-1 ${STAR_COLORS[item.rating]}`}>
                          {item.rating}/5
                        </span>
                      </div>

                      {/* Comment */}
                      {item.comment ? (
                        <div className="bg-gray-50 rounded-xl px-3 py-2">
                          <p className="text-sm text-gray-600 leading-relaxed italic">
                            &ldquo;{item.comment}&rdquo;
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 italic">No written comment</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Explainer */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex gap-3">
            <MessageSquare size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">How this works</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                When a client taps your review link and rates you 1-3 stars, they&apos;re shown
                a private feedback form instead of Google. Their comment comes here, and
                you get an email. They never leave a public negative review — you get a
                chance to make it right first.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
