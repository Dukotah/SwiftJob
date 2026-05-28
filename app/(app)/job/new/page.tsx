"use client";

// Screen 2 — Job Capture
// Photo → describe → client → price → generate invoice.
// Submits to a Server Action which saves to the database.

import { useState } from "react";
import { Camera, DollarSign } from "lucide-react";
import { createJob } from "@/lib/actions";

export default function NewJobPage() {
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview,  setAfterPreview]  = useState<string | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show preview instantly — upload happens in the background later
    const url = URL.createObjectURL(file);
    if (type === "before") setBeforePreview(url);
    else setAfterPreview(url);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await createJob(formData);
    // createJob redirects to /invoice/[id] on success
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <a href="/home" className="text-gray-500 text-sm font-medium">← Back</a>
        <h1 className="text-xl font-bold text-gray-900">New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photos */}
        <div className="grid grid-cols-2 gap-3">
          <PhotoButton label="Before Photo" preview={beforePreview} inputId="before-photo"
            onChange={(e) => handlePhotoChange(e, "before")} />
          <PhotoButton label="After Photo"  preview={afterPreview}  inputId="after-photo"
            onChange={(e) => handlePhotoChange(e, "after")} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">What did you do?</label>
          <textarea
            name="description"
            placeholder="Full driveway wash + seal coat"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Client Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Client Name</label>
          <input
            type="text"
            name="clientName"
            placeholder="Mike Johnson"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Client Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Client Phone</label>
          <input
            type="tel"
            name="clientPhone"
            placeholder="+1 (555) 000-0000"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Client Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Client Email <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="email"
            name="clientEmail"
            placeholder="mike@email.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Total */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Total</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <DollarSign size={18} />
            </div>
            <input
              type="number"
              inputMode="decimal"
              name="total"
              placeholder="180"
              min="0"
              step="0.01"
              required
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 text-xl font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 active:bg-blue-700"
        >
          {isSubmitting ? "Saving..." : "Generate Invoice →"}
        </button>
      </form>
    </div>
  );
}

function PhotoButton({ label, preview, inputId, onChange }: {
  label: string;
  preview: string | null;
  inputId: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label htmlFor={inputId} className="cursor-pointer">
      <input id={inputId} type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" />
      <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden active:bg-gray-100">
        {preview
          ? <img src={preview} alt={label} className="w-full h-full object-cover" /> // eslint-disable-line
          : <><Camera size={28} className="text-gray-400 mb-1" /><span className="text-xs text-gray-500 font-medium text-center px-2">{label}</span></>
        }
      </div>
    </label>
  );
}
