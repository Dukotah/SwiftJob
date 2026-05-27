# SwiftJobs — Lean Architecture Proposal

**Version:** 0.1 — Pre-build  
**Audience:** Solo tradesperson SaaS — pressure washers, detailers, landscapers, and beyond  
**Philosophy:** Invisible operations. One hand. Fast money.

---

## What We're Actually Building

SwiftJobs is not a CRM, a scheduling tool, or an accounting app. It is a **capture-and-get-paid machine** with a side effect of building the tradesperson's online presence automatically. Every design decision should be filtered through: *does this help a person with dirty hands get paid faster?*

---

## 1. Database Structure — Opinionated & Mobile-First

The biggest mistake in tools like this is modeling the business too early. We're going to start with the **minimum tables needed** and avoid premature abstraction. Here's the core schema in plain English, then in Drizzle-style pseudocode.

### The Four Core Tables

**`users`** — The tradesperson (your paying customer)
```
id, name, email, phone, trade_type, 
business_name, city, state,
stripe_account_id,         ← their Stripe Connect account (they get paid into this)
google_business_profile_id ← connected later for auto-posting
```

**`clients`** — The tradesperson's customers
```
id, user_id, name, email, phone, address
```
Keep this dead simple. No full contact sync. Name + phone is enough to send an invoice.

**`jobs`** — The core unit of work (one job = one invoice)
```
id, user_id, client_id,
status: 'draft' | 'invoiced' | 'paid',
trade_type,          ← inherited from user, overridable
description,         ← free-text, what was done
total_amount,        ← in cents (never store dollars as floats)
created_at, paid_at
```

**`job_photos`** — Before/after photos attached to a job
```
id, job_id, 
storage_url,         ← Cloudinary or Uploadthing URL
type: 'before' | 'after' | 'detail',
uploaded_at
```

That's it for v1. No line items table yet — just a `total_amount` and a freetext `description`. Line items add complexity without adding field value until tradespeople ask for it.

### Two Supporting Tables (for invoicing and SEO)

**`invoices`**
```
id, job_id,
stripe_payment_link_url,   ← Stripe-hosted payment page
sent_via: 'sms' | 'email' | 'link',
sent_at, paid_at
```

**`gallery_posts`** (powers the SEO automation)
```
id, job_id,
is_public,           ← tradesperson can toggle off
gbp_post_id,         ← Google Business Profile post ID (null until posted)
posted_at
```

### The Key Design Opinion

> **Denormalize early, normalize when it hurts.**

Don't create separate `line_items`, `services`, or `pricing_templates` tables in v1. A job has a description and a price. That's what fits on a phone screen and what gets a tradesperson paid. You can add complexity after you see real usage patterns.

---

## 2. The Four Essential Screens

These are the only screens that need to exist before you show this to real users.

---

### Screen 1 — Home (Today's Board)
**Purpose:** At a glance, where does money stand right now?

```
┌─────────────────────────────┐
│  SwiftJobs          [+ New] │
│                             │
│  TODAY                      │
│  ┌─────────────────────┐   │
│  │ 🚿 Mike's Driveway  │   │
│  │ $180 · Invoiced     │   │
│  └─────────────────────┘   │
│  ┌─────────────────────┐   │
│  │ 🚗 Sarah's Sedan    │   │
│  │ $250 · Paid ✓       │   │
│  └─────────────────────┘   │
│                             │
│  THIS WEEK: $1,240 earned   │
└─────────────────────────────┘
```

- Big `+ New Job` button in the top right — always one tap away
- Jobs sorted by status: Draft → Invoiced → Paid
- A weekly earnings number at the bottom (dopamine hit, retention hook)

---

### Screen 2 — Job Capture (The Money Screen)
**Purpose:** Snap → describe → price. Under 60 seconds.

```
┌─────────────────────────────┐
│  ←  New Job                 │
│                             │
│  [📷 Take Before Photo]     │
│  [📷 Take After Photo]      │
│                             │
│  What did you do?           │
│  [Full driveway wash + seal]│
│                             │
│  Client                     │
│  [Mike Johnson  📞]         │
│                             │
│  Total                      │
│  [ $  180  ]                │
│                             │
│  [  Generate Invoice  ]     │
└─────────────────────────────┘
```

**Key UX opinions:**
- Camera buttons are big, finger-friendly, at the top — photo first, everything else second
- Client field auto-completes from saved clients; new clients are created inline (no separate "Add Client" flow)
- The total field is a big numeric input — the keyboard that appears should be the number pad, not QWERTY
- "Generate Invoice" is the only CTA — one button, one action

---

### Screen 3 — Invoice Preview & Send
**Purpose:** Review, then fire it off three ways.

```
┌─────────────────────────────┐
│  Invoice #0042              │
│  Mike Johnson               │
│  Full driveway wash + seal  │
│                             │
│  [Before photo] [After]     │
│                             │
│  Total Due:  $180.00        │
│                             │
│  ─────── Send via ──────── │
│  [📱 Text Mike]             │
│  [✉️  Email Mike]           │
│  [🔗  Copy Link]            │
│                             │
│  [Mark as Cash Paid]        │
└─────────────────────────────┘
```

- Text and Email send a pre-built message with the Stripe payment link embedded
- Copy Link is zero-cost: the tradesperson pastes it wherever they want
- "Mark as Cash Paid" is critical — many tradespeople take cash; they still need the job logged
- The before/after photos appear on the invoice the client sees, which builds trust and justifies the price

---

### Screen 4 — Profile & Connections (Set It Once)
**Purpose:** Connect Stripe, connect Google Business, manage public gallery.

This screen is visited once during onboarding and almost never again — that's the goal. It should contain:

- Stripe Connect setup ("Get paid to your bank")
- Google Business Profile connection ("Auto-post your work to Google")
- Toggle: "Make my jobs public" (enables the gallery page at `swiftjobs.app/[username]`)
- Public gallery link with a copy button (to share on social media)

---

## 3. The Biggest Technical Pitfall — Slow & Unstable Cellular

> **The field is not your office. Do not assume a stable internet connection.**

This is the single most common reason field tools fail in practice. Here's what goes wrong and exactly how to prevent it.

### The Problem: Photo Uploads Block Everything

A phone photo is 3–8 MB. On a bad LTE signal at a job site (think: rural driveway, underground parking garage), uploading that photo synchronously before letting the user proceed will:

1. Spin for 15–45 seconds
2. Fail silently or visibly
3. Cause the tradesperson to close the app and go back to pen and paper

You lose the user in that moment. They won't come back.

### The Solution: Optimistic UI + Background Upload Queue

The pattern is called **optimistic UI**. The rule is: *never make the user wait for a network operation if you can fake it.*

Here's how it works in practice for SwiftJobs:

**Step 1 — Photo is taken:** Store it immediately in the browser's local storage (IndexedDB). Show it on screen instantly. Do not wait for upload.

**Step 2 — Job is saved:** Write the job record locally first. Show it on the Home screen immediately. Queue the photo upload and data sync in the background.

**Step 3 — Background sync:** A service worker watches for connectivity. When the connection is good, it drains the queue — uploading photos, syncing job records, confirming invoice sends.

**Step 4 — Reconcile:** Once the server confirms, update the local record with the real IDs and URLs.

The user experience: they take the photo, fill in the form, hit "Generate Invoice," and are immediately looking at Screen 3. The upload is happening behind the scenes. By the time they send the invoice, it's done.

### Practical Rules for the Codebase

**Keep critical-path actions offline-capable:**
- Job capture (Screen 2) must work with no connection
- Invoice generation must work with no connection
- Sending the invoice is the *only* step that requires connectivity, and it should retry automatically

**Use small, compressed photos for display; upload the full file in the background:**
When a photo is taken, immediately generate a compressed preview (using the Canvas API in the browser) for display. Queue the full-resolution file for background upload. The client's invoice should show the full photo, but the tradesperson's UI can show the preview while the upload completes.

**Design for retry, not for failure:**
Every network call should have an automatic retry with exponential backoff. If the invoice SMS fails to send, show a subtle "Retry" badge on the job card — don't show an error dialog that interrupts the workflow.

**Build a simple sync status indicator:**
A small colored dot (green/yellow/red) in the corner of the Home screen tells the tradesperson at a glance whether their data is synced. They don't need to think about it, but they can see it.

---

## Recommended Tech Stack Decisions

Since you're already on Next.js + Postgres/Drizzle + Stripe + Vercel, here are the opinionated additions:

| Need | Tool | Why |
|---|---|---|
| Photo storage | **Uploadthing** | Built for Next.js, simple API, free tier is generous |
| SMS delivery | **Twilio** | Industry standard, ~$0.01/msg, reliable |
| Email delivery | **Resend** | Modern, Next.js-native, 3,000 free emails/month |
| Payments | **Stripe Connect** | Tradespeople need their own accounts; you take a platform fee |
| PWA (offline) | **next-pwa** | Adds service worker with one config change; works on Vercel |
| Background jobs | **Vercel Cron + pg queue** | Simple, no extra infrastructure needed |
| Google Business | **Google My Business API** | OAuth-connected, posts photos + captions automatically |

---

## What to Build First (Recommended Sequence)

1. **Auth + Profile screen** — Get a tradesperson logged in and Stripe connected. No other features matter until money can move.
2. **Job Capture + Invoice Preview** — The core loop. Fake the Stripe link at first; just get the UX right.
3. **Stripe Connect + Payment** — Wire up real payments. This is where the product becomes real.
4. **SMS + Email send** — Add delivery. Now it's a complete workflow.
5. **Offline / background upload** — Add the service worker and IndexedDB queue. Now it works in the field.
6. **Gallery page** — Public portfolio at `/[username]`. Static generation, great for SEO out of the box with Next.js.
7. **Google Business auto-post** — The "magic" feature. Build this last, after the core loop is solid.

---

## The One-Sentence Vision Check

Before building any feature, ask: *"Can a pressure washer with one gloved hand, standing next to a wet truck, accomplish this in under 30 seconds?"*

If the answer is no, simplify it or cut it.

---

*Generated: May 2026 — SwiftJobs v0.1 Architecture*
