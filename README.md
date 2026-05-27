# SwiftJobs

Mobile-first invoicing and SEO tool for solo tradespeople.

**Core flow:** Snap photo → Generate invoice → Send (SMS/email/link) → Get paid.

---

## Getting Started

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Set up your database on Vercel

1. Go to [vercel.com](https://vercel.com) and open your project
2. Click the **Storage** tab
3. Click **Create Database** → choose **Postgres**
4. After it's created, click the **`.env.local`** tab
5. Click **Copy Snippet** — this gives you all the `POSTGRES_*` env vars

### Step 3 — Set up your environment variables

```bash
cp .env.local.example .env.local
```

Paste the Postgres variables from Vercel into `.env.local`. Then fill in the others as you set up each service (Stripe, Twilio, Resend, Uploadthing).

### Step 4 — Generate your first database migration

```bash
npm run db:generate
npm run db:migrate
```

This reads your `db/schema.ts` and creates the actual tables in your Postgres database.

### Step 5 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the home screen.

---

## Project Structure

```
swiftjobs/
├── app/
│   ├── (auth)/login/       ← Login screen
│   ├── (app)/
│   │   ├── home/           ← Screen 1: Today's jobs + earnings
│   │   ├── job/new/        ← Screen 2: Job capture (photo + price)
│   │   ├── invoice/[id]/   ← Screen 3: Invoice preview + send
│   │   └── profile/        ← Screen 4: Stripe + Google setup
│   └── api/                ← Backend API routes
├── db/
│   ├── schema.ts           ← All database tables (edit this to add columns)
│   └── index.ts            ← Database client
├── lib/
│   ├── stripe.ts           ← Stripe payment helpers
│   ├── twilio.ts           ← SMS helpers
│   ├── resend.ts           ← Email helpers
│   └── utils.ts            ← Shared utility functions
└── components/             ← Reusable UI components
```

## Key Rules

- **Money is always stored in cents** — $180.00 = `18000`. Never use floats for money.
- **Photos are shown immediately** — upload happens in the background. Never block the UI on a network call.
- **Every tap target is at least 44px** — this app is used with one gloved hand on a job site.

---

## Service Setup Guides

| Service | What it does | Setup link |
|---|---|---|
| Vercel Postgres | Database | [vercel.com/storage](https://vercel.com/storage) |
| Stripe Connect | Payments | [dashboard.stripe.com](https://dashboard.stripe.com) |
| Twilio | SMS | [console.twilio.com](https://console.twilio.com) |
| Resend | Email | [resend.com](https://resend.com) |
| Uploadthing | Photo storage | [uploadthing.com](https://uploadthing.com) |
