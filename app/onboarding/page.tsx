"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { saveOnboarding } from "@/lib/actions";

function isNextInternalError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err;
}

const TRADE_TYPES = [
  { value: "pressure_washing", label: "🚿 Pressure Washing" },
  { value: "auto_detailing",   label: "🚗 Auto Detailing" },
  { value: "landscaping",      label: "🌿 Landscaping" },
  { value: "window_cleaning",  label: "🪟 Window Cleaning" },
  { value: "house_cleaning",   label: "🏠 House Cleaning" },
  { value: "pool_service",     label: "🏊 Pool Service" },
  { value: "painting",         label: "🎨 Painting" },
  { value: "handyman",         label: "🔧 Handyman" },
  { value: "other",            label: "⚙️ Other" },
];

export default function OnboardingPage() {
  const [step,     setStep]     = useState(1);
  const [trade,    setTrade]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await saveOnboarding(formData);
    } catch (err) {
      if (isNextInternalError(err)) throw err;
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-12 pb-8">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-blue-600 rounded-xl p-2">
          <Zap size={22} color="white" />
        </div>
        <span className="text-xl font-bold text-gray-900">SwiftJobs</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Set up your profile</h1>
      <p className="text-gray-500 text-sm mb-8">Takes 30 seconds. You can change this later.</p>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-5">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Business Name
          </label>
          <input
            type="text"
            name="businessName"
            placeholder="Duke's Pressure Washing"
            required
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-base"
          />
        </div>

        {/* Trade Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            What do you do?
          </label>
          <input type="hidden" name="tradeType" value={trade} />
          <div className="grid grid-cols-2 gap-2">
            {TRADE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTrade(t.value)}
                className={`px-3 py-3 rounded-2xl text-sm font-medium text-left border-2 transition-colors ${
                  trade === t.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              placeholder="Austin"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
            <input
              type="text"
              name="state"
              placeholder="TX"
              maxLength={2}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 uppercase"
            />
          </div>
        </div>

        <div className="flex-1" />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !trade}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 active:bg-blue-700"
        >
          {loading ? "Saving..." : "Let's go →"}
        </button>
      </form>
    </div>
  );
}
