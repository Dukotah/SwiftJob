// app/[username]/page.tsx
// Public SEO portfolio page — no login required.
// Shows a tradesperson's completed jobs with before/after photos.
// URL: your-app.vercel.app/dukes-pressure-washing
// This page is indexed by Google and helps tradespeople rank locally.
//
// SEO features on this page:
//   - Dynamic <title> and <meta description> per business
//   - Open Graph tags for social sharing
//   - JSON-LD LocalBusiness structured data (Google rich results)
//   - Canonical URL
//   - Star rating display from private review data
//   - "Claim your page" CTA to drive SwiftJobs signups

import { notFound } from "next/navigation";
import { db } from "@/db";
import { users, jobs, reviewFeedback } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://swift-job.vercel.app";

interface Props {
      params: Promise<{ username: string }>;
}

// ─────────────────────────────────────────────
// SEO METADATA
// ─────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
      const { username } = await params;
      const user = await db.query.users.findFirst({
              where: eq(users.username, username),
      });
      if (!user) return { title: "Not Found" };

  const name = user.businessName ?? user.name ?? "SwiftJobs Pro";
      const trade = user.tradeType?.replace(/_/g, " ") ?? "services";
      const city = user.city ? ` in ${user.city}` : "";
      const canonicalUrl = `${BASE_URL}/${username}`;

  return {
          title: `${name} — Professional ${trade}${city}`,
          description: `View completed ${trade} work by ${name}${city}. Before & after photos of every job.`,
          alternates: {
                    canonical: canonicalUrl,
          },
          openGraph: {
                    title: `${name} — Work Gallery`,
                    description: `Real before & after photos from ${name}.`,
                    url: canonicalUrl,
                    type: "website",
          },
  };
}

// ─────────────────────────────────────────────
// STAR RATING COMPONENT
// Shows average rating from reviews that were 4-5 stars (publicly visible)
// ─────────────────────────────────────────────
function StarRating({ rating, count: reviewCount }: { rating: number; count: number }) {
      if (reviewCount === 0) return null;
      const fullStars = Math.floor(rating);
      const hasHalf = rating - fullStars >= 0.5;

  return (
          <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                                        key={star}
                                        className={`w-4 h-4 ${
                                                          star <= fullStars
                                                            ? "text-yellow-400"
                                                            : star === fullStars + 1 && hasHalf
                                                            ? "text-yellow-300"
                                                            : "text-white/30"
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                </div>
                <span className="text-white/80 text-sm font-medium">
                    {rating.toFixed(1)}
                </span>
                <span className="text-white/50 text-sm">
                        ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
                </span>
          </div>
        );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default async function GalleryPage({ params }: Props) {
      const { username } = await params;
      const user = await db.query.users.findFirst({
              where: eq(users.username, username),
      });
    
      if (!user || !user.galleryEnabled) notFound();
    
      // Fetch completed jobs with photos for this tradesperson
      const completedJobs = await db.query.jobs.findMany({
              where: and(eq(jobs.userId, user.id), eq(jobs.status, "paid")),
              with: { photos: true, galleryPost: true },
              orderBy: (jobs, { desc }) => [desc(jobs.paidAt)],
              limit: 50,
      });
    
      const jobsWithPhotos = completedJobs.filter((j) => j.photos.length > 0);
    
      // Fetch review stats — only 4-5 star reviews are "public" sentiment
      // (1-3 star reviews go to private feedback instead)
      const allJobIds = completedJobs.map((j) => j.id);
      let avgRating = 0;
      let reviewCount = 0;
    
      if (allJobIds.length > 0) {
              // Get all reviews for this user's jobs
              const reviewRows = await db
                        .select({ rating: reviewFeedback.rating })
                        .from(reviewFeedback)
                        .innerJoin(jobs, eq(reviewFeedback.jobId, jobs.id))
                        .where(and(eq(jobs.userId, user.id)));
          
              if (reviewRows.length > 0) {
                        reviewCount = reviewRows.length;
                        avgRating = reviewRows.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
              }
      }
    
      const businessName = user.businessName ?? user.name ?? "SwiftJobs Pro";
      const trade = user.tradeType?.replace(/_/g, " ") ?? "services";
      const location = [user.city, user.state].filter(Boolean).join(", ");
      const canonicalUrl = `${BASE_URL}/${username}`;
    
      // ─────────────────────────────────────────────
      // JSON-LD STRUCTURED DATA (Google LocalBusiness)
      // This enables rich results in Google Search — star ratings,
      // address, and business info can appear directly in search snippets.
      // ─────────────────────────────────────────────
      const jsonLd = {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: businessName,
              description: `Professional ${trade} services${location ? ` in ${location}` : ""}.`,
              url: canonicalUrl,
              ...(user.city && {
                        address: {
                                    "@type": "PostalAddress",
                                    addressLocality: user.city,
                                    addressRegion: user.state ?? undefined,
                                    addressCountry: "US",
                        },
              }),
              ...(avgRating > 0 && reviewCount > 0 && {
                        aggregateRating: {
                                    "@type": "AggregateRating",
                                    ratingValue: avgRating.toFixed(1),
                                    reviewCount: reviewCount,
                                    bestRating: "5",
                                    worstRating: "1",
                        },
              }),
              ...(jobsWithPhotos.length > 0 && {
                        image: jobsWithPhotos
                                    .flatMap((j) => j.photos.map((p) => p.storageUrl))
                                    .slice(0, 5),
              }),
      };
    
      return (
              <div className="min-h-screen bg-gray-50">
                  {/* JSON-LD structured data — invisible to users, read by Google */}
                    <script
                                type="application/ld+json"
                                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                              />
              
                  {/* Header */}
                    <div className="bg-blue-600 text-white px-4 pt-12 pb-8">
                            <h1 className="text-2xl font-bold">{businessName}</h1>
                        {trade && <p className="text-blue-100 text-sm capitalize mt-0.5">{trade}</p>}
                        {location && <p className="text-blue-100 text-sm mt-0.5">📍 {location}</p>}
                    
                        {/* Star rating — shown if reviews exist */}
                            <StarRating rating={avgRating} count={reviewCount} />
                    
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
                                              const after = job.photos.find((p) => p.type === "after") ?? job.photos[0];
                                
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
              
                  {/* Footer — "Claim your page" CTA drives SwiftJobs signups */}
                    <div className="bg-white border-t border-gray-100 px-4 py-8 mt-4">
                            <div className="max-w-sm mx-auto text-center">
                                      <p className="text-xs text-gray-400 mb-3">
                                                  Are you a tradesperson?
                                      </p>
                                      <a
                                                      href={`${BASE_URL}/login`}
                                                      className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm hover:bg-blue-700 transition-colors"
                                                    >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                  </svg>
                                                  Get your own page — free with SwiftJobs
                                      </a>
                                      <p className="text-xs text-gray-400 mt-2">
                                                  Invoice clients in under 60 seconds. Auto-request Google reviews.
                                      </p>
                            </div>
                    </div>
              </div>
            );
}</div>
