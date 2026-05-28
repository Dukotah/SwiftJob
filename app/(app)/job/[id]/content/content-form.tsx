"use client";

// Content creator — generates AI captions and posts to social media.
// GBP: posts directly via API (if connected) or deep link fallback.
// Instagram/Facebook: copy caption + open platform.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Copy, CheckCircle, ExternalLink,
  AlertCircle, ChevronLeft, Loader2, Send,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";
import Link from "next/link";

type Platform = "google_business" | "instagram" | "facebook";
type Photo    = { storageUrl: string; type: string };

const PLATFORMS: { key: Platform; label: string; emoji: string }[] = [
  { key: "google_business", label: "Google Business",  emoji: "🗺️" },
  { key: "instagram",       label: "Instagram",        emoji: "📸" },
  { key: "facebook",        label: "Facebook",         emoji: "📘" },
];

const PLATFORM_TIPS: Record<Platform, string> = {
  google_business: "Posts to your Google Business Profile directly — shows up in local search results.",
  instagram:       "Captions are optimized with hashtags. Copy, then post with your photos in the Instagram app.",
  facebook:        "Conversational local business post. Copy and paste into Facebook.",
};

interface Props {
  jobId:          string;
  description?:   string;
  amount:         string;
  photos:         Photo[];
  gbpConnected:   boolean;  // true = direct posting; false = deep link
  hasPlaceId:     boolean;
}

export function ContentForm({
  jobId, description, amount, photos, gbpConnected, hasPlaceId,
}: Props) {
  const router              = useRouter();
  const { showToast }       = useToast();
  const [, startTransition] = useTransition();

  const [platform,  setPlatform]  = useState<Platform>("google_business");
  const [caption,   setCaption]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [posting,   setPosting]   = useState(false);
  const [posted,    setPosted]    = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const beforePhoto = photos.find((p) => p.type === "before");
  const afterPhoto  = photos.find((p) => p.type === "after") ??
                      photos.find((p) => p.type === "detail");

  // ── AI caption generation ────────────────────────────────────────────────────

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setCaption("");
    setPosted(false);

    try {
      const res  = await fetch("/api/content/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ jobId, platform }),
      });
      const data = await res.json();

      if (!res.ok) setError(data.error ?? "Generation failed");
      else         setCaption(data.caption);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Copy to clipboard ────────────────────────────────────────────────────────

  async function handleCopy() {
    if (!caption) return;
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    showToast("Caption copied!", "success");
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Direct GBP post ──────────────────────────────────────────────────────────

  async function handleGbpPost() {
    if (!caption || posting) return;
    setPosting(true);
    setError(null);

    try {
      const res  = await fetch("/api/gbp/post", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ jobId, caption, includePhotos: true }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to post");
        showToast("Post failed — see details below", "error");
      } else {
        setPosted(true);
        showToast("Posted to Google Business! 🎉", "success");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Post</h1>
            <p className="text-xs text-gray-400">{amount} job · AI caption generator</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

        {/* Platform tabs */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Platform</p>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map(({ key, emoji, label }) => (
              <button
                key={key}
                onClick={() => { setPlatform(key); setCaption(""); setError(null); setPosted(false); }}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all text-sm font-semibold ${
                  platform === key
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-100 bg-white text-gray-500"
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-xs">{label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 px-1 mt-2 leading-relaxed">
            {PLATFORM_TIPS[platform]}
          </p>
        </div>

        {/* Photos */}
        {(beforePhoto || afterPhoto) && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-2">Job Photos</p>
            <div className={`grid gap-3 ${beforePhoto && afterPhoto ? "grid-cols-2" : "grid-cols-1"}`}>
              {beforePhoto && (
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={beforePhoto.storageUrl} alt="Before" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-white text-xs font-semibold">Before</span>
                  </div>
                </div>
              )}
              {afterPhoto && (
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={afterPhoto.storageUrl} alt="After" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-white text-xs font-semibold">After</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Caption editor */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Caption</p>
            {caption && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-blue-600 font-semibold"
              >
                {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-start gap-2 mb-3">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={loading ? "Generating…" : "Tap Generate to create an AI caption for this job"}
              rows={6}
              disabled={loading}
              className="w-full px-4 pt-4 pb-3 text-sm text-gray-800 leading-relaxed resize-none outline-none disabled:opacity-50 placeholder:text-gray-300"
            />
            <div className="px-4 pb-4">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3.5 rounded-xl font-bold text-sm active:opacity-90 disabled:opacity-60 shadow-sm"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={16} /> {caption ? "Regenerate" : "Generate Caption with AI"}</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Post actions — only shown once we have a caption */}
        {caption && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Post It</p>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border-2 transition-colors ${
                copied
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-blue-200 bg-blue-50 text-blue-700 active:bg-blue-100"
              }`}
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? "Copied to clipboard!" : "Copy Caption"}
            </button>

            {/* Platform-specific action */}
            {platform === "google_business" && (
              gbpConnected ? (
                // Direct posting via GBP API
                posted ? (
                  <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 font-bold text-sm">
                    <CheckCircle size={16} />
                    Posted to Google Business!
                  </div>
                ) : (
                  <button
                    onClick={handleGbpPost}
                    disabled={posting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm active:bg-gray-50 disabled:opacity-60"
                  >
                    {posting
                      ? <><Loader2 size={16} className="animate-spin" /> Posting…</>
                      : <><Send size={16} /> Post to Google Business</>
                    }
                  </button>
                )
              ) : (
                // Deep link fallback + connect prompt
                <div className="space-y-2">
                  <a
                    href="https://business.google.com/posts/add"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm"
                  >
                    <ExternalLink size={16} />
                    Open Google Business
                  </a>
                  {!hasPlaceId && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-700 font-medium">
                        Connect GBP in Profile to post directly — no copy-paste needed.
                      </p>
                      <Link href="/profile" className="text-xs text-blue-600 font-bold mt-1 inline-block">
                        Go to Profile →
                      </Link>
                    </div>
                  )}
                </div>
              )
            )}

            {platform === "instagram" && (
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm"
              >
                <ExternalLink size={16} />
                Open Instagram
              </a>
            )}

            {platform === "facebook" && (
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm"
              >
                <ExternalLink size={16} />
                Open Facebook
              </a>
            )}

            <p className="text-xs text-gray-400 text-center">
              {platform === "google_business" && gbpConnected
                ? "Photos from this job will be included automatically."
                : "Copy the caption, open the app, paste and add your photos."}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
