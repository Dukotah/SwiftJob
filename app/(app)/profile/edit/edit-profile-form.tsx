"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/actions";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const TRADE_TYPES = [
  { value: "pressure_washing", label: "Pressure Washing", emoji: "💧" },
  { value: "auto_detailing",   label: "Auto Detailing",   emoji: "🚗" },
  { value: "landscaping",      label: "Landscaping",      emoji: "🌿" },
  { value: "window_cleaning",  label: "Window Cleaning",  emoji: "🪟" },
  { value: "house_cleaning",   label: "House Cleaning",   emoji: "🏠" },
  { value: "pool_service",     label: "Pool Service",     emoji: "🏊" },
  { value: "painting",         label: "Painting",         emoji: "🎨" },
  { value: "handyman",         label: "Handyman",         emoji: "🔧" },
  { value: "other",            label: "Other",            emoji: "⚡" },
];

interface Props {
  initialBusinessName: string;
  initialTradeType:    string;
  initialCity:         string;
  initialState:        string;
  initialPhone:        string;
}

export function EditProfileForm({
  initialBusinessName,
  initialTradeType,
  initialCity,
  initialState,
  initialPhone,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [tradeType,    setTradeType]    = useState(initialTradeType);
  const [city,         setCity]         = useState(initialCity);
  const [state,        setState]        = useState(initialState);
  const [phone,        setPhone]        = useState(initialPhone);
  const [error,        setError]        = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("businessName", businessName);
    formData.set("tradeType",    tradeType);
    formData.set("city",         city);
    formData.set("state",        state);
    formData.set("phone",        phone);

    startTransition(async () => {
      const result = await saveProfile(formData);
      if (result.success) {
        router.push("/profile");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to save");
      }
    });
  }

  const canSubmit = businessName.trim().length > 0 && tradeType.length > 0 && !isPending;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <Link href="/profile" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">

        {/* Business name */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Business Name *
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Duke's Pressure Washing"
            required
            className="field-input"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Your Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 000-0000"
            className="field-input"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Location
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="field-input flex-1"
            />
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="ST"
              maxLength={2}
              className="field-input w-16 text-center uppercase"
            />
          </div>
        </div>

        {/* Trade type */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            Trade Type *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TRADE_TYPES.map((t) => {
              const active = tradeType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTradeType(t.value)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border-2 transition-colors ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-100 bg-white text-gray-600"
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-[11px] font-semibold text-center leading-tight">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving…
            </>
          ) : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
