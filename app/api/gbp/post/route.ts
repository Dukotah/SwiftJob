// POST /api/gbp/post
//
// Creates a post on the user's Google Business Profile.
// Saves the post ID to the galleryPosts table for tracking.
//
// Body: { jobId, caption, includePhotos? }

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { jobs, users, galleryPosts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createGbpPost, refreshAccessToken } from "@/lib/gbp";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { jobId?: string; caption?: string; includePhotos?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { jobId, caption, includePhotos = true } = body;

  if (!jobId || !caption?.trim()) {
    return NextResponse.json({ error: "Missing jobId or caption" }, { status: 400 });
  }

  // Load job + user (to get GBP credentials)
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.userId, session.user.id)),
    with: { photos: true },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user?.googleRefreshToken || !user?.gbpLocationName) {
    return NextResponse.json(
      { error: "Google Business Profile not connected. Go to Profile → Connect GBP." },
      { status: 400 }
    );
  }

  // Refresh the access token (they expire hourly)
  let accessToken: string;
  try {
    accessToken = await refreshAccessToken(user.googleRefreshToken);

    // Save the fresh access token
    await db
      .update(users)
      .set({ googleAccessToken: accessToken, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));
  } catch {
    return NextResponse.json(
      { error: "Failed to refresh Google token. Please reconnect GBP in Profile." },
      { status: 401 }
    );
  }

  // Collect photo URLs if requested
  const photoUrls = includePhotos
    ? job.photos
        .filter((p) => p.type === "after" || p.type === "detail")
        .map((p) => p.storageUrl)
        .slice(0, 3) // GBP allows up to 10, we limit to 3 for quality
    : [];

  // Post to GBP
  let gbpPost;
  try {
    gbpPost = await createGbpPost({
      accessToken,
      locationName: user.gbpLocationName,
      summary:      caption.trim(),
      photoUrls,
    });
  } catch (err) {
    console.error("[gbp/post]", err);
    return NextResponse.json(
      { error: "Failed to post to Google Business Profile. Please try again." },
      { status: 500 }
    );
  }

  // Save post record to galleryPosts (create or update)
  await db
    .insert(galleryPosts)
    .values({
      jobId,
      isPublic:   true,
      gbpPostId:  gbpPost.name,
      gbpPostedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: galleryPosts.jobId,
      set: {
        gbpPostId:   gbpPost.name,
        gbpPostedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true, postName: gbpPost.name });
}
