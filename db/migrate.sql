-- ─────────────────────────────────────────────────────────────────────────────
-- SwiftJobs Migration — Phase 2
-- Run this in your Vercel Postgres dashboard (Storage → Query) OR
-- hit GET /api/db/setup?secret=YOUR_SETUP_SECRET once after deploying.
-- ─────────────────────────────────────────────────────────────────────────────

-- New columns on users (GBP OAuth + location identifiers)
ALTER TABLE users ADD COLUMN IF NOT EXISTS gbp_account_name  TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gbp_location_name TEXT;

-- New columns on invoices (automation tracking — prevents duplicate sends)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS follow_up_sent_at      TIMESTAMP;

-- New table: private review feedback (captured for 1-3 star ratings)
CREATE TABLE IF NOT EXISTS review_feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  rating     INTEGER     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);
