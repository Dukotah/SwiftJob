// /review/[jobId] — Client-facing review intercept page
//
// PUBLIC — no auth required.
// This is where clients land when they tap the review request link.
//
// Flow:
//   1. Show star rating UI with business name + "How did we do?"
//   2. Client taps 4-5 stars → redirect to Google review link
//   3. Client taps 1-3 stars → show private feedback form
//   4. Private feedback is saved to review_feedback table
//   5. Tradesperson can see it in their job detail (TODO: build inbox)

import { notFound } from "next/navigation";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGoogleReviewUrl } from "@/lib/review";
import { ReviewForm } from "./review-form";
import type { Metadata } from "next";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata(
  { params }: { params: Promise<{ jobId: string }> }
): Promise<Metadata> {
  const { jobId } = await params;
  if (!UUID_REGEX.test(jobId)) return { title: "Rate Your Service" };

  let job;
  try {
    job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: { user: true },
    });
  } catch {
    return { title: "Rate Your Service" };
  }

  const biz = job?.user?.businessName ?? "Your service provider";
  return {
    title: `How did ${biz} do?`,
    description: `Rate your experience with ${biz}`,
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  if (!UUID_REGEX.test(jobId)) notFound();

  let job;
  try {
    job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: { user: true, client: true },
    });
  } catch {
    notFound();
  }

  if (!job) notFound();

  const businessName = job.user?.businessName ?? "Your service provider";
  const clientName   = job.client?.name ?? undefined;
  const placeId      = job.user?.googleBusinessProfileId;
  const googleUrl    = placeId ? getGoogleReviewUrl(placeId) : null;

  return (
    <ReviewForm
      jobId={jobId}
      businessName={businessName}
      clientName={clientName}
      googleUrl={googleUrl}
    />
  );
}
