// Public invoice pay page — no auth required.
// This is what your client sees when they click the link in the SMS or email.
// Goal: make them feel confident about paying. Show the work, the price, the business.

import { notFound } from "next/navigation";
import { db } from "@/db";
import { jobs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { centsToDisplay, tradeTypeLabel } from "@/lib/utils";
import { ShieldCheck, CheckCircle, MapPin, ExternalLink } from "lucide-react";
import type { Metadata } from "next";

// ── Dynamic SEO metadata ─────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

    // Guard: must be a valid UUID before hitting the database
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) return { title: "Invoice" };
    let job;
    try {
      job = await db.query.jobs.findFirst({
        where: eq(jobs.id, id),
        with: { user: true },
      });
    } catch {
      return { title: "Invoice" };
    }
  if (!job) return { title: "Invoice" };
  const biz = job.user?.businessName ?? "SwiftJobs";
  return {
    title: `Pay ${centsToDisplay(job.totalAmountCents)} — ${biz}`,
    description: job.description ?? `Invoice from ${biz}`,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Guard: must be a valid UUID before hitting the database
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) notFound();
  let job;
  try {
    job = await db.query.jobs.findFirst({
      where: eq(jobs.id, id),
      with: { user: true, client: true, photos: true, invoice: true },
    });
  } catch {
    notFound();
  }

  if (!job) notFound();

  const business   = job.user?.businessName ?? "Your service provider";
  const tradeLabel = job.user?.tradeType ? tradeTypeLabel(job.user.tradeType) : null;
  const location   = [job.user?.city, job.user?.state].filter(Boolean).join(", ");

  const beforePhoto = job.photos.find((p) => p.type === "before");
  const afterPhoto  = job.photos.find((p) => p.type === "after") ??
                      job.photos.find((p) => p.type === "detail");
  const hasPhotos   = beforePhoto || afterPhoto;

  const paymentUrl  = job.invoice?.stripePaymentLinkUrl;
  const isPaid      = job.status === "paid";

  // ── Paid state ─────────────────────────────────────────────────────────────

  if (isPaid) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">All paid up!</h1>
        {job.client?.name && (
          <p className="text-gray-500 mb-1">Thanks, {job.client.name.split(" ")[0]}!</p>
        )}
        <p className="text-gray-400 text-sm mt-1">
          {business} appreciates your business.
        </p>
        {location && (
          <p className="text-xs text-gray-300 mt-6 flex items-center gap-1 justify-center">
            <MapPin size={11} /> {location}
          </p>
        )}
      </div>
    );
  }

  // ── Pay state ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto">

        {/* ── Business header ──────────────────────────────── */}
        <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-100">
          {/* Avatar */}
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm shadow-blue-100">
            <span className="text-white text-xl font-bold">
              {business.charAt(0).toUpperCase()}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 leading-tight">{business}</h1>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {tradeLabel && (
              <span className="text-sm text-gray-400">{tradeLabel}</span>
            )}
            {tradeLabel && location && (
              <span className="text-gray-200">·</span>
            )}
            {location && (
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <MapPin size={12} />
                {location}
              </span>
            )}
          </div>
        </div>

        <div className="px-4 py-5 space-y-4">

          {/* ── Before / After photos ─────────────────────── */}
          {hasPhotos && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                Work Photos
              </p>
              <div className={`grid gap-3 ${beforePhoto && afterPhoto ? "grid-cols-2" : "grid-cols-1"}`}>
                {beforePhoto && (
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={beforePhoto.storageUrl}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <span className="text-white text-xs font-semibold">Before</span>
                    </div>
                  </div>
                )}
                {afterPhoto && (
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={afterPhoto.storageUrl}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <span className="text-white text-xs font-semibold">After</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Invoice card ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Service description */}
            {job.description && (
              <div className="px-5 pt-5 pb-4 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Service
                </p>
                <p className="text-gray-800 font-medium leading-relaxed">{job.description}</p>
              </div>
            )}

            {/* Amount */}
            <div className="px-5 py-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Amount Due
              </p>
              <p className="money text-4xl font-bold text-gray-900 leading-none">
                {centsToDisplay(job.totalAmountCents)}
              </p>
              {job.client?.name && (
                <p className="text-sm text-gray-400 mt-2">Billed to {job.client.name}</p>
              )}
            </div>

            {/* Pay button */}
            {paymentUrl ? (
              <div className="px-5 pb-5">
                <a
                  href={paymentUrl}
                  className="block w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-center text-lg active:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
                >
                  Pay {centsToDisplay(job.totalAmountCents)}
                  <ExternalLink size={18} />
                </a>

                {/* Trust badge */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <ShieldCheck size={13} className="text-gray-300" />
                  <span className="text-xs text-gray-300">Secure payment powered by Stripe</span>
                </div>
              </div>
            ) : (
              <div className="px-5 pb-5">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-500 font-medium">Payment link not yet available</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Contact {business} to arrange payment.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ────────────────────────────────────── */}
          <p className="text-center text-xs text-gray-300 pb-6">
            Invoiced by {business} via SwiftJobs
          </p>

        </div>
      </div>
    </div>
  );
}
