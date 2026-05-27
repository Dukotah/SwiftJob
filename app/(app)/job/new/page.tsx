"use client";

// Screen 2 — Job Capture
// The core money-making screen. Photo → describe → price → generate invoice.
// This is a client component because it uses camera and form state.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, DollarSign } from "lucide-react";

export default function NewJobPage() {
  const router = useRouter();

  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto,  setAfterPhoto]  = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [clientName,  setClientName]  = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [totalDollars, setTotalDollars] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview URLs so we can show the photos immediately after capture
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview,  setAfterPreview]  = useState<string | null>(null);

  function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview instantly (optimistic — upload happens later)
    const previewUrl = URL.createObjectURL(file);
    if (type === "before") {
      setBeforePhoto(file);
      setBeforePreview(previewUrl);
    } else {
      setAfterPhoto(file);
      setAfterPreview(previewUrl);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Upload photos to Uploadthing, then POST job to /api/jobs
      // For now, just navigate to a mock invoice page
      console.log("Creating job:", { description, clientName, clientPhone, totalDollars });
      router.push("/invoice/mock-id");
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-500 text-sm font-medium min-h-touch flex items-center"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo capture */}
        <div className="grid grid-cols-2 gap-3">
          <PhotoButton
            label="Before Photo"
            preview={beforePreview}
            inputId="before-photo"
            onChange={(e) => handlePhotoChange(e, "before")}
          />
          <PhotoButton
            label="After Photo"
            preview={afterPreview}
            inputId="after-photo"
            onChange={(e) => handlePhotoChange(e, "after")}
          />
        </div>

        {/* What did you do? */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            What did you do?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full driveway wash + seal coat"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Client Name
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Mike Johnson"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Client Phone (for SMS)
          </label>
          <input
            type="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Total — uses number pad on mobile */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Total
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <DollarSign size={18} />
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={totalDollars}
              onChange={(e) => setTotalDollars(e.target.value)}
              placeholder="180"
              min="0"
              step="0.01"
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 text-xl font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !totalDollars || !clientName}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-700 min-h-touch"
        >
          {isSubmitting ? "Creating Invoice..." : "Generate Invoice →"}
        </button>
      </form>
    </div>
  );
}

// ── Photo Button Component ────────────────────────────────────────────────────
function PhotoButton({
  label,
  preview,
  inputId,
  onChange,
}: {
  label: string;
  preview: string | null;
  inputId: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label htmlFor={inputId} className="cursor-pointer">
      <input
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment" // Opens the rear camera directly on mobile
        onChange={onChange}
        className="hidden"
      />
      <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden active:bg-gray-100">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <>
            <Camera size={28} className="text-gray-400 mb-1" />
            <span className="text-xs text-gray-500 font-medium text-center px-2">{label}</span>
          </>
        )}
      </div>
    </label>
  );
}
