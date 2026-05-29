// GET /api/db/setup?secret=YOUR_SETUP_SECRET
//
// One-time migration endpoint. Hit this once after deploying Phase 2
// to apply the new database columns + table.
//
// Set SETUP_SECRET in your Vercel environment variables to anything secure.
// After running, you can delete or disable this route.

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // New columns on users
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gbp_account_name  TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gbp_location_name TEXT`;

    // New columns on invoices
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS review_request_sent_at   TIMESTAMP`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS follow_up_sent_at        TIMESTAMP`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMP`;

    // New table: private review feedback
    await sql`
      CREATE TABLE IF NOT EXISTS review_feedback (
        id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id     UUID      NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        rating     INTEGER   NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment    TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    return NextResponse.json({
      ok: true,
      message: "Migration applied. You can now disable this endpoint.",
    });
  } catch (err) {
    console.error("[db/setup]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
