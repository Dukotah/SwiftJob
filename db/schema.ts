import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ─────────────────────────────────────────────
// ENUMS
// These are fixed lists of allowed values in the database.
// ─────────────────────────────────────────────

// The status a job moves through from creation to payment
export const jobStatusEnum = pgEnum("job_status", [
  "draft",    // Just captured, not yet invoiced
  "invoiced", // Invoice sent to client
  "paid",     // Client has paid (via Stripe or cash)
]);

// How a photo was categorized when uploaded
export const photoTypeEnum = pgEnum("photo_type", [
  "before",
  "after",
  "detail",
]);

// How an invoice was sent to the client
export const sentViaEnum = pgEnum("sent_via", [
  "sms",
  "email",
  "link", // Tradesperson copied the link manually
  "cash", // No invoice sent — paid in cash
]);

// ─────────────────────────────────────────────
// USERS — The tradesperson (your paying customer)
// Auth.js requires: id, name, email, emailVerified, image
// Everything else is SwiftJobs custom fields.
// ─────────────────────────────────────────────
export const users = pgTable("users", {
  // Required by Auth.js
  id:            text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:          text("name"),
  email:         text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image:         text("image"),

  // SwiftJobs custom fields
  phone:        text("phone"),
  businessName: text("business_name"),
  tradeType:    text("trade_type"),
  city:         text("city"),
  state:        text("state"),
  username:     text("username").unique(),

  stripeAccountId:      text("stripe_account_id"),
  stripeOnboardingDone: boolean("stripe_onboarding_done").default(false),

  // Google Business Profile — Place ID for review links
  googleBusinessProfileId: text("google_business_profile_id"),

  // GBP OAuth tokens — set via /api/gbp/connect OAuth flow (separate from sign-in)
  googleAccessToken:  text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),

  // GBP account + location identifiers from the GBP API
  // Format: "accounts/123456789" and "accounts/123456789/locations/987654321"
  // Populated automatically after OAuth callback
  gbpAccountName:  text("gbp_account_name"),
  gbpLocationName: text("gbp_location_name"),

  galleryEnabled: boolean("gallery_enabled").default(true),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// AUTH TABLES — Required by Auth.js
// Don't edit these unless you know what you're doing.
// ─────────────────────────────────────────────

// Stores each OAuth provider connection per user (e.g. Google account linked)
export const authAccounts = pgTable(
  "accounts",
  {
    userId:            text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type:              text("type").$type<AdapterAccountType>().notNull(),
    provider:          text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token:     text("refresh_token"),
    access_token:      text("access_token"),
    expires_at:        integer("expires_at"),
    token_type:        text("token_type"),
    scope:             text("scope"),
    id_token:          text("id_token"),
    session_state:     text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

// Tracks active login sessions
export const authSessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId:       text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires:      timestamp("expires", { mode: "date" }).notNull(),
});

// One-time tokens sent in magic link emails — deleted after use
export const authVerificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token:      text("token").notNull(),
    expires:    timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─────────────────────────────────────────────
// CLIENTS — The tradesperson's customers
// ─────────────────────────────────────────────
export const clients = pgTable("clients", {
  id:     uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  name:    text("name").notNull(),
  email:   text("email"),
  phone:   text("phone"),
  address: text("address"), // Optional — useful for recurring clients

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// JOBS — The core unit of work
// One job = one piece of work = one invoice
// ─────────────────────────────────────────────
export const jobs = pgTable("jobs", {
  id:       uuid("id").primaryKey().defaultRandom(),
  userId:   text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),

  status:      jobStatusEnum("status").default("draft").notNull(),
  tradeType:   text("trade_type"),  // Overrides user's default trade type if set
  description: text("description"), // What was done — free text, e.g. "Full driveway wash + seal"

  // IMPORTANT: Always store money in cents (integer), never as a float/decimal.
  // $180.00 is stored as 18000. This prevents floating-point rounding errors.
  totalAmountCents: integer("total_amount_cents").default(0).notNull(),

  // Set when payment is confirmed (Stripe webhook or manual cash mark)
  paidAt: timestamp("paid_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// JOB PHOTOS — Before/after photos attached to a job
// ─────────────────────────────────────────────
export const jobPhotos = pgTable("job_photos", {
  id:    uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),

  storageUrl:   text("storage_url").notNull(),  // Full URL from Uploadthing
  thumbnailUrl: text("thumbnail_url"),           // Compressed preview (generated client-side)
  type:         photoTypeEnum("type").default("after").notNull(),

  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// INVOICES — Tracks how/when an invoice was sent and paid
// ─────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id:    uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }).unique(),

  // Stripe generates a hosted payment page — the client clicks this to pay
  stripePaymentLinkId:  text("stripe_payment_link_id"),
  stripePaymentLinkUrl: text("stripe_payment_link_url"),

  // Stripe's internal ID for the completed payment — used to reconcile webhooks
  stripePaymentIntentId: text("stripe_payment_intent_id"),

  sentVia: sentViaEnum("sent_via"),
  sentAt:  timestamp("sent_at"),
  paidAt:  timestamp("paid_at"),

  // Automation tracking — prevent duplicate sends
  reviewRequestSentAt:   timestamp("review_request_sent_at"),   // When we texted/emailed asking for a review
  followUpSentAt:        timestamp("follow_up_sent_at"),         // When we sent the 30-day "need anything?" follow-up
  paymentReminderSentAt: timestamp("payment_reminder_sent_at"),  // When we texted the unpaid reminder

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// REVIEW FEEDBACK — Private feedback captured when a client rates 1-3 stars.
// Instead of sending them straight to Google, we intercept and capture
// their feedback privately so the tradesperson can address it.
// Only 4-5 star ratings get redirected to the public Google review link.
// ─────────────────────────────────────────────
export const reviewFeedback = pgTable("review_feedback", {
  id:        uuid("id").primaryKey().defaultRandom(),
  jobId:     uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),

  rating:  integer("rating").notNull(), // 1–5
  comment: text("comment"),             // Optional private feedback from the client

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// GALLERY POSTS — Controls what shows on the public page + Google Business
// ─────────────────────────────────────────────
export const galleryPosts = pgTable("gallery_posts", {
  id:    uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }).unique(),

  isPublic: boolean("is_public").default(true).notNull(),

  // Google Business Profile post — null until it's been posted
  gbpPostId:  text("gbp_post_id"),
  gbpPostedAt: timestamp("gbp_posted_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────
// RELATIONS
// These tell Drizzle how the tables connect to each other.
// You'll use these when you want to fetch a job and its photos in one query.
// ─────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients),
  jobs:    many(jobs),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  user:           one(users,          { fields: [jobs.userId],   references: [users.id] }),
  client:         one(clients,        { fields: [jobs.clientId], references: [clients.id] }),
  photos:         many(jobPhotos),
  invoice:        one(invoices,       { fields: [jobs.id], references: [invoices.jobId] }),
  galleryPost:    one(galleryPosts,   { fields: [jobs.id], references: [galleryPosts.jobId] }),
  reviewFeedback: one(reviewFeedback, { fields: [jobs.id], references: [reviewFeedback.jobId] }),
}));

export const jobPhotosRelations = relations(jobPhotos, ({ one }) => ({
  job: one(jobs, { fields: [jobPhotos.jobId], references: [jobs.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  job: one(jobs, { fields: [invoices.jobId], references: [jobs.id] }),
}));

export const galleryPostsRelations = relations(galleryPosts, ({ one }) => ({
  job: one(jobs, { fields: [galleryPosts.jobId], references: [jobs.id] }),
}));

export const reviewFeedbackRelations = relations(reviewFeedback, ({ one }) => ({
  job: one(jobs, { fields: [reviewFeedback.jobId], references: [jobs.id] }),
}));

// ─────────────────────────────────────────────
// TYPE EXPORTS
// These let you use TypeScript types based on your schema
// without having to write them by hand.
// ─────────────────────────────────────────────
export type User         = typeof users.$inferSelect;
export type NewUser      = typeof users.$inferInsert;
export type Client       = typeof clients.$inferSelect;
export type NewClient    = typeof clients.$inferInsert;
export type Job          = typeof jobs.$inferSelect;
export type NewJob       = typeof jobs.$inferInsert;
export type JobPhoto     = typeof jobPhotos.$inferSelect;
export type NewJobPhoto  = typeof jobPhotos.$inferInsert;
export type Invoice        = typeof invoices.$inferSelect;
export type NewInvoice     = typeof invoices.$inferInsert;
export type ReviewFeedback = typeof reviewFeedback.$inferSelect;
