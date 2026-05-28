"use client";

import { useState, useRef } from "react";
import { Camera, DollarSign, User, Phone, Mail, ArrowLeft, Loader2, ChevronRight, Plus, X } from "lucide-react";
import { createJob } from "@/lib/actions";
import { useUploadThing } from "@/lib/uploadthing-react";
import Link from "next/link";

function isNextInternalError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err;
}

interface ExistingClient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface DetailPhoto {
  preview: string | null;
  url:     string | null;
  uploading: boolean;
}

interface NewJobFormProps {
  defaultClientName?: string;
  defaultClientPhone?: string;
  defaultClientEmail?: string;
  existingClients?: ExistingClient[];
}

export function NewJobForm({
  defaultClientName  = "",
  defaultClientPhone = "",
  defaultClientEmail = "",
  existingClients    = [],
}: NewJobFormProps) {
  const [beforePreview,   setBeforePreview]   = useState<string | null>(null);
  const [afterPreview,    setAfterPreview]     = useState<string | null>(null);
  const [beforeUrl,       setBeforeUrl]        = useState<string | null>(null);
  const [afterUrl,        setAfterUrl]         = useState<string | null>(null);
  const [beforeUploading, setBeforeUploading]  = useState(false);
  const [afterUploading,  setAfterUploading]   = useState(false);
  const [details,         setDetails]          = useState<DetailPhoto[]>([]);
  const [submitting,      setSubmitting]       = useState(false);
  const [error,           setError]            = useState<string | null>(null);

  const [clientName,      setClientName]      = useState(defaultClientName);
  const [clientPhone,     setClientPhone]     = useState(defaultClientPhone);
  const [clientEmail,     setClientEmail]     = useState(defaultClientEmail);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { startUpload } = useUploadThing("jobPhoto");

  // Client autocomplete
  const suggestions = clientName.trim().length > 0
    ? existingClients.filter((c) => c.name.toLowerCase().includes(clientName.toLowerCase())).slice(0, 5)
    : [];

  function selectClient(client: ExistingClient) {
    setClientName(client.name);
    setClientPhone(client.phone ?? "");
    setClientEmail(client.email ?? "");
    setShowSuggestions(false);
  }

  function handleNameBlur() {
    blurTimer.current = setTimeout(() => setShowSuggestions(false), 150);
  }

  function handleNameFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setShowSuggestions(true);
  }

  // Before / after photo upload
  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    if (type === "before") { setBeforePreview(preview); setBeforeUrl(null); setBeforeUploading(true); }
    else                   { setAfterPreview(preview);  setAfterUrl(null);  setAfterUploading(true);  }

    try {
      const result = await startUpload([file]);
      const url = result?.[0]?.url ?? null;
      if (url) { type === "before" ? setBeforeUrl(url) : setAfterUrl(url); }
      else     { type === "before" ? setBeforePreview(null) : setAfterPreview(null); setError("Photo upload failed."); }
    } catch {
      type === "before" ? setBeforePreview(null) : setAfterPreview(null);
      setError("Photo upload failed. Please try again.");
    } finally {
      type === "before" ? setBeforeUploading(false) : setAfterUploading(false);
    }
  }

  // Detail photo upload
  async function handleDetailPhoto(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setDetails((prev) => prev.map((d, i) => i === idx ? { ...d, preview, uploading: true } : d));

    try {
      const result = await startUpload([file]);
      const url = result?.[0]?.url ?? null;
      setDetails((prev) => prev.map((d, i) => i === idx ? { ...d, url, uploading: false } : d));
      if (!url) setError("Photo upload failed.");
    } catch {
      setDetails((prev) => prev.map((d, i) => i === idx ? { preview: null, url: null, uploading: false } : d));
      setError("Photo upload failed.");
    }
  }

  function addDetailSlot() {
    if (details.length >= 3) return;
    setDetails((prev) => [...prev, { preview: null, url: null, uploading: false }]);
  }

  function removeDetailSlot(idx: number) {
    setDetails((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const isUploading = beforeUploading || afterUploading || details.some((d) => d.uploading);
    if (isUploading) { setError("Please wait for photos to finish uploading."); return; }
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set("clientName",  clientName);
      formData.set("clientPhone", clientPhone);
      formData.set("clientEmail", clientEmail);
      if (beforeUrl) formData.set("beforePhotoUrl", beforeUrl);
      if (afterUrl)  formData.set("afterPhotoUrl",  afterUrl);
      details.forEach((d, i) => { if (d.url) formData.set(`detailPhotoUrl_${i}`, d.url); });
      await createJob(formData);
    } catch (err) {
      if (isNextInternalError(err)) throw err;
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const anyUploading = beforeUploading || afterUploading || details.some((d) => d.uploading);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <Link href="/home" className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:bg-gray-200">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">New Job</h1>
          <p className="text-xs text-gray-400">
            {defaultClientName ? `For ${defaultClientName}` : "Capture your work"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">

        {/* Photos */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Photos</p>
          <div className="grid grid-cols-2 gap-3">
            <PhotoTile label="Before" id="before" preview={beforePreview} uploading={beforeUploading}
              onChange={(e) => handlePhoto(e, "before")} />
            <PhotoTile label="After" id="after" preview={afterPreview} uploading={afterUploading}
              onChange={(e) => handlePhoto(e, "after")} />

            {/* Detail photo slots */}
            {details.map((d, i) => (
              <div key={i} className="relative">
                <PhotoTile
                  label={`Detail ${i + 1}`}
                  id={`detail_${i}`}
                  preview={d.preview}
                  uploading={d.uploading}
                  onChange={(e) => handleDetailPhoto(e, i)}
                />
                <button
                  type="button"
                  onClick={() => removeDetailSlot(i)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center z-10"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}

            {/* Add detail photo button */}
            {details.length < 3 && (
              <button
                type="button"
                onClick={addDetailSlot}
                className="aspect-square rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 flex flex-col items-center justify-center gap-2 active:bg-blue-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plus size={20} className="text-blue-500" />
                </div>
                <span className="text-xs font-semibold text-blue-500">Add Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* Job details */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Job Details</p>
          <div className="card p-4 space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">What did you do?</label>
              <textarea name="description" placeholder="e.g. Full driveway wash and seal coat"
                rows={2} className="field-input resize-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Total ($)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="number" name="total" inputMode="decimal" placeholder="0.00"
                  min="0" step="0.01" required className="field-input pl-9 money text-2xl font-bold" />
              </div>
            </div>
          </div>
        </div>

        {/* Client — with autocomplete */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client</p>
          <div className="card p-4 space-y-4">

            <div className="relative">
              <div className="flex items-center gap-3">
                <User size={16} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => { setClientName(e.target.value); setShowSuggestions(true); }}
                  onFocus={handleNameFocus}
                  onBlur={handleNameBlur}
                  placeholder="Client name"
                  required
                  autoComplete="off"
                  className="field-input border-0 p-0 focus:ring-0 text-sm flex-1"
                />
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                  {suggestions.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onMouseDown={() => selectClient(client)}
                      onTouchStart={() => selectClient(client)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-blue-50 border-b border-gray-50 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{client.name}</p>
                        {client.phone && <p className="text-xs text-gray-400 mt-0.5">{client.phone}</p>}
                      </div>
                      <ChevronRight size={14} className="text-gray-300 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100" />
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-gray-400 shrink-0" />
              <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                placeholder="Phone number" className="field-input border-0 p-0 focus:ring-0 text-sm flex-1" />
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                placeholder="Email (optional)" className="field-input border-0 p-0 focus:ring-0 text-sm flex-1" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting || anyUploading} className="btn-primary">
          {anyUploading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Uploading photos...
            </span>
          ) : submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Creating invoice...
            </span>
          ) : "Generate Invoice →"}
        </button>
      </form>
    </div>
  );
}

function PhotoTile({ label, id, preview, uploading, onChange }: {
  label: string; id: string; preview: string | null;
  uploading: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label htmlFor={id} className="cursor-pointer block">
      <input id={id} type="file" accept="image/*" capture="environment" onChange={onChange} className="hidden" />
      <div className={`aspect-square rounded-2xl overflow-hidden flex flex-col items-center justify-center border-2 transition-colors ${
        preview ? "border-transparent" : "border-dashed border-gray-200 bg-white"
      }`}>
        {preview ? (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={24} className="text-white animate-spin" />
              </div>
            )}
          </div>
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
