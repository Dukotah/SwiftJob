// POST /api/review/feedback
//
// Saves private feedback when a client rates 1-3 stars.
// No auth required — the jobId is the only identifier.
// The feedback is only visible to the tradesperson (TODO: add inbox UI).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviewFeedback, jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let body: { jobId?: string; rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { jobId, rating, comment } = body;

  if (!jobId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  // Verify the job exists
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  await db.insert(reviewFeedback).values({
    jobId,
    rating,
    comment: comment?.trim() || null,
  });

  // TODO: notify the tradesperson via email/SMS that they received private feedback

  return NextResponse.json({ ok: true });
}
