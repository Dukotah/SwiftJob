// /gallery — Portfolio & Post History
//
// Shows all paid jobs with:
//  - Whether they appear on the public portfolio
//  - Whether they've been posted to Google Business Profile
//  - Quick link to create a post for any job
//
// Server component — toggle visibility is handled via a form action.

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs, galleryPosts, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { centsToDisplay, formatDate } from "@/lib/utils";
import { Globe, CheckCircle, Sparkles, Eye, EyeOff, ExternalLink } from "lucide-react";
import { revalidatePath } from "next/cache";

// ── Server action: toggle job visibility on public portfolio ──────────────────

async function toggleVisibility(formData: FormData) {
  "use server";
  const { auth: authFn }         = await import("@/auth");
  const { db: dbClient }         = await import("@/db");
  const { galleryPosts: gp, jobs: j } = await import("@/db/schema");
  const { eq: eqFn, and: andFn } = await import("drizzle-orm");
  const { revalidatePath: reval } = await import("next/cache");

  const sess = await authFn();
  if (!sess?.user?.id) return;

  const jobId    = formData.get("jobId")    as string;
  const isPublic = formData.get("isPublic") === "true";

  // Verify ownership
  const job = await dbClient.query.jobs.findFirst({
    where: andFn(eqFn(j.id, jobId), eqFn(j.userId, sess.user.id)),
  });
  if (!job) return;

  // Upsert gallery post record
  await dbClient
    .insert(gp)
    .values({ jobId, isPublic })
    .onConflictDoUpdate({ target: gp.jobId, set: { isPublic } });

  reval("/gallery");
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function GalleryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { username: true, id: true, gbpLocationName: true },
  });

  const portfolioUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${user?.username ?? user?.id}`;
  const gbpConnected = !!user?.gbpLocationName;

  // Load all paid jobs with their photos + gallery post record
  const paidJobs = await db.query.jobs.findMany({
    where: eq(jobs.userId, session.user.id),
    with: { client: true, photos: true, galleryPost: true },
    orderBy: [desc(jobs.createdAt)],
  });

  // Separate into categories
  const postedToGbp = paidJobs.filter((j) => j.galleryPost?.gbpPostId);
  const hiddenJobs  = paidJobs.filter((j) => j.galleryPost?.isPublic === false);
  const publicJobs  = paidJobs.filter(
    (j) => !j.galleryPost || j.galleryPost.isPublic !== false
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <Link href="/profile" className="text-sm text-gray-400 font-medium">← Profile</Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">Portfolio & Posts</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Manage what&apos;s public and track your Google Business posts
        </p>
      </div>

      <div className="px-4 py-5 space-y-5">

        {/* ── Stats strip ───────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{paidJobs.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Total jobs</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{postedToGbp.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">On Google</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{hiddenJobs.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Hidden</p>
          </div>
        </div>

        {/* ── Portfolio link ────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
            <Globe size={18} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Public Portfolio</p>
            <p className="text-xs text-gray-400 truncate">{portfolioUrl}</p>
          </div>
          <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <ExternalLink size={16} className="text-blue-500" />
          </a>
        </div>

        {/* ── GBP connect prompt if not connected ───────────── */}
        {!gbpConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-xl shrink-0">🗺️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Connect Google Business for direct posting</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Post before/after photos directly to Google Business — one tap per job.
              </p>
              <a href="/api/gbp/connect" className="text-xs text-blue-600 font-bold mt-2 inline-block">
                Connect in Profile →
              </a>
            </div>
          </div>
        )}

        {/* ── Job list ──────────────────────────────────────── */}
        {paidJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-3xl mb-3">📸</p>
            <p className="font-bold text-gray-900 mb-1">No paid jobs yet</p>
            <p className="text-sm text-gray-400">Paid jobs appear here for portfolio management.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">
              All Jobs ({paidJobs.length})
            </p>
            <div className="space-y-3">
              {paidJobs.map((job) => {
                const thumb        = job.photos.find((p) => p.type === "after") ??
                                     job.photos.find((p) => p.type === "before") ??
                                     job.photos[0];
                const isVisible    = !job.galleryPost || job.galleryPost.isPublic !== false;
                const postedToGbp  = !!job.galleryPost?.gbpPostId;
                const gbpPostedAt  = job.galleryPost?.gbpPostedAt;

                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="flex gap-3 p-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb.storageUrl}
                            alt="Job"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {job.client?.name ?? "Unknown client"}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {job.description ?? "No description"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{centsToDisplay(job.totalAmountCents)} · {formatDate(job.createdAt)}</p>

                        {/* Status badges */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {postedToGbp && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} />
                              Google{gbpPostedAt ? ` · ${formatDate(gbpPostedAt)}` : ""}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isVisible
                              ? "text-blue-700 bg-blue-50"
                              : "text-gray-500 bg-gray-100"
                          }`}>
                            {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                            {isVisible ? "Public" : "Hidden"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="border-t border-gray-50 px-3 py-2 flex items-center gap-2">
                      {/* Create / view post */}
                      <Link
                        href={`/job/${job.id}/content`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg active:bg-violet-100"
                      >
                        <Sparkles size={12} />
                        {postedToGbp ? "Repost" : "Create Post"}
                      </Link>

                      {/* View job */}
                      <Link
                        href={`/job/${job.id}`}
                        className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg active:bg-gray-100"
                      >
                        View Job
                      </Link>

                      {/* Toggle portfolio visibility */}
                      <form action={toggleVisibility} className="ml-auto">
                        <input type="hidden" name="jobId"    value={job.id} />
                        <input type="hidden" name="isPublic" value={String(!isVisible)} />
                        <button
                          type="submit"
                          className="text-xs font-semibold text-gray-400 active:text-gray-600"
                          title={isVisible ? "Hide from portfolio" : "Show in portfolio"}
                        >
                          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
