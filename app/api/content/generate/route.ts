// POST /api/content/generate
//
// Generates a social media caption for a completed job using the Anthropic API.
// Requires the job to belong to the authenticated user.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateCaption, type Platform } from "@/lib/ai-content";
import { centsToDisplay } from "@/lib/utils";

const VALID_PLATFORMS = new Set<Platform>([
  "google_business",
  "instagram",
  "facebook",
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { jobId?: string; platform?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { jobId, platform } = body;

  if (!jobId || !platform) {
    return NextResponse.json({ error: "Missing jobId or platform" }, { status: 400 });
  }

  if (!VALID_PLATFORMS.has(platform as Platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  // Load job with user + photos — confirm ownership
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)),
    with: { user: true, photos: true },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const user = job.user;
  const location = [user?.city, user?.state].filter(Boolean).join(", ");
  const hasBeforeAfter =
    job.photos.some((p) => p.type === "before") &&
    job.photos.some((p) => p.type === "after");

  try {
    const caption = await generateCaption({
      description:  job.description ?? undefined,
      tradeType:    job.tradeType ?? user?.tradeType ?? undefined,
      businessName: user?.businessName ?? "Local Service Business",
      location:     location || undefined,
      platform:     platform as Platform,
      amount:       centsToDisplay(job.totalAmountCents),
      hasBeforeAfter,
    });

    return NextResponse.json({ caption });
  } catch (err) {
    console.error("[content/generate] AI generation failed:", err);
    return NextResponse.json(
      { error: "Caption generation failed. Please try again." },
      { status: 500 }
    );
  }
}
