"use client";

// Job Capture — clean, fast, one-handed.
// Inspired by Joist's simplicity: photo first, price last, one big CTA.

import { useState } from "react";
import { Camera, DollarSign, User, Phone, Mail, ArrowLeft } from "lucide-react";
import { createJob } from "@/lib/actions";
import Link from "next/link";

export default function NewJobPage() {
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview,  setAfterPreview]  = useState<string | null>(null);
  const [submitting,    setSubmitting]    = useState(false);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    type === "before" ? setBeforePreview(url) : setAfterPreview(url);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    await createJob(new FormData(e.currentTarget));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <Link href="/home" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">New Job</h1>
          <p className="text-xs text-gray-400">Capture your work</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">

        {/* ── Photos ──────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Photos</p>
          <div className="grid grid-cols-2 gap-3">
            <PhotoTile label="Before" id="before" preview={beforePreview}
              onChange={(e) => handlePhoto(e, "before")} />
            <PhotoTile label="After"  id="after"  preview={afterPreview}
              onChange={(e) => handlePhoto(e, "after")} />
          </div>
        </div>

        {/* ── Job details ──────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Job Details</p>
          <div className="card p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">What did you do?</label>
              <textarea
                name="description"
                placeholder="e.g. Full driveway wash and seal coat"
                rows={2}
                className="field-input resize-none"
              />
            </div>

            {/* Total — big and obvious */}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Total ($)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  name="total"
                  inputMode="decimal"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className="field-input pl-9 money text-2xl font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Client ──────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client</p>
          <div className="card p-4 space-y-4">
            <div className="flex items-center gap-3">
              <User size={16} className="text-gray-400 shrink-0" />
              <input type="text" name="clientName" placeholder="Full name" required className="field-input border-0 p-0 focus:ring-0 text-sm" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-gray-400 shrink-0" />
              <input type="tel" name="clientPhone" placeholder="Phone number" className="field-input border-0 p-0 focus:ring-0 text-sm" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <input type="email" name="clientEmail" placeholder="Email (optional)" className="field-input border-0 p-0 focus:ring-0 text-sm" />
            </div>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────── */}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Creating invoice..." : "Generate Invoice →"}
        </button>

      </form>
    </div>
  );
}

function PhotoTile({ label, id, preview, onChange }: {
  label: string;
  id: string;
  preview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label htmlFor={id} className="cursor-pointer block">
      <input id={id} type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" />
      <div className={`aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 transition-colors ${
        preview ? "border-transparent" : "border-dashed border-gray-200 bg-white"
      }`}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Camera size={20} className="text-gray-400" />
            </div>
            <span className="text-xs font-semibold text-gray-400">{label}</span>
          </div>
        )}
      </div>
    </label>
  );
}
