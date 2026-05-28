// app/[username]/page.tsx
// Public gallery page — no login required.
// Shows a tradesperson's completed jobs with before/after photos.
// URL: your-app.vercel.app/dukes-pressure-washing
// This page is indexed by Google and helps tradespeople rank locally.

import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { centsToDisplay } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: { username: string };
}

// Generate SEO metadata dynamically based on the tradesperson's profile
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await db.query.users.findFirst({
    where: eq(users.username, params.username),
  });
  if (!user) return { title: "Not Found" };

  const name  = user.businessName ?? user.name ?? "SwiftJobs Pro";
  const trade = user.tradeType?.replace(/_/g, " ") ?? "services";
  const city  = user.city ? ` in ${user.city}` : "";

  return {
    title:       `${name} — Professional ${trade}${city}`,
    description: `View completed ${trade} work by ${name}${city}. Before & after photos of every job.`,
    openGraph: {
      title:       `${name} — Work Gallery`,
      description: `Real before & after photos from ${name}.`,
    },
  };
}

export default async function GalleryPage({ params }: Props) {
  const user = await db.query.users.findFirst({
    where: eq(users.username, params.username),
  });

  if (!user || !user.galleryEnabled) notFound();

  // Fetch completed jobs with photos for this tradesperson
  const completedJobs = await db.query.jobs.findMany({
    where: and(eq(jobs.userId, user.id), eq(jobs.status, "paid")),
    with:  { photos: true, galleryPost: true },
    orderBy: (jobs, { desc }) => [desc(jobs.paidAt)],
    limit: 50,
  });

  const jobsWithPhotos = completedJobs.filter((j) => j.photos.length > 0);

  const businessName = user.businessName ?? user.name ?? "SwiftJobs Pro";
  const trade        = user.tradeType?.replace(/_/g, " ") ?? "services";
  const location     = [user.city, user.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-12 pb-8">
        <h1 className="text-2xl font-bold">{businessName}</h1>
        {trade    && <p className="text-blue-100 text-sm capitalize mt-0.5">{trade}</p>}
        {location && <p className="text-blue-100 text-sm mt-0.5">📍 {location}</p>}
        <p className="text-blue-100 text-sm mt-3">
          {jobsWithPhotos.length} completed job{jobsWithPhotos.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Job grid */}
      <div className="px-4 py-6">
        {jobsWithPhotos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No completed jobs yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobsWithPhotos.map((job) => {
              const before = job.photos.find((p) => p.type === "before");
              const after  = job.photos.find((p) => p.type === "after") ?? job.photos[0];

              return (
                <div key={job.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  {/* Before / After photos */}
                  <div className="grid grid-cols-2">
                    {before && (
                      <div className="relative aspect-square">
                        <img src={before.storageUrl} alt="Before" className="w-full h-full object-cover" /> {/* eslint-disable-line */}
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">Before</span>
                      </div>
                    )}
                    {after && (
                      <div className={`relative aspect-square ${!before ? "col-span-2" : ""}`}>
                        <img src={after.storageUrl} alt="After" className="w-full h-full object-cover" /> {/* eslint-disable-line */}
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">After</span>
                      </div>
                    )}
                  </div>

                  {/* Job details */}
                  <div className="p-4">
                    {job.description && (
                      <p className="text-sm font-medium text-gray-800">{job.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {job.paidAt
                        ? new Date(job.paidAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                        : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-gray-400 text-xs">
        <p>Powered by <span className="font-semibold text-blue-500">SwiftJobs</span></p>
      </div>
    </div>
  );
}
