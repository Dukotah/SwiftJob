"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateJob } from "@/lib/actions";
import { useToast } from "@/components/toast-provider";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface EditJobFormProps {
  jobId: string;
  initialDescription: string;
  initialAmountDollars: string;
  initialClientName: string;
  initialClientPhone: string;
  initialClientEmail: string;
  status: "draft" | "invoiced";
}

export function EditJobForm({
  jobId,
  initialDescription,
  initialAmountDollars,
  initialClientName,
  initialClientPhone,
  initialClientEmail,
  status,
}: EditJobFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [description, setDescription]   = useState(initialDescription);
  const [amount, setAmount]             = useState(initialAmountDollars);
  const [clientName, setClientName]     = useState(initialClientName);
  const [clientPhone, setClientPhone]   = useState(initialClientPhone);
  const [clientEmail, setClientEmail]   = useState(initialClientEmail);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("jobId",       jobId);
    formData.set("description", description);
    formData.set("total",       amount);
    formData.set("clientName",  clientName);
    formData.set("clientPhone", clientPhone);
    formData.set("clientEmail", clientEmail);

    startTransition(async () => {
      const result = await updateJob(formData);
      if (result.success) {
        showToast("Job updated", "success");
        router.push(`/job/${jobId}`);
        router.refresh();
      } else {
        showToast(result.error ?? "Update failed", "error");
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100 flex items-center gap-3">
        <Link href={`/job/${jobId}`} className="text-gray-500 text-sm font-medium">
          ← Cancel
        </Link>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Edit Job</h1>
        {status === "invoiced" && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
            Sent
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4">

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            What was done
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full driveway wash + seal"
            rows={3}
            className="field-input resize-none"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Total ($)
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="field-input text-2xl font-bold money"
          />
        </div>

        {/* Client info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</p>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Name *</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Mike Johnson"
              required
              className="field-input"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Phone</label>
            <input
              type="tel"
              inputMode="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className="field-input"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input
              type="email"
              inputMode="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="mike@example.com"
              className="field-input"
            />
          </div>
        </div>

        {status === "invoiced" && (
          <p className="text-xs text-amber-600 text-center px-4">
            This invoice has already been sent. Editing the amount won't update the existing Stripe link.
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !clientName || !amount}
          className="btn-primary w-full py-4 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
}
