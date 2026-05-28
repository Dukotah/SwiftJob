"use client";

// Two-tap delete: first tap shows confirmation, second tap deletes.
// Only shown for draft jobs.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteJob } from "@/lib/actions";
import { useToast } from "@/components/toast-provider";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      // Auto-reset confirmation state after 4 seconds if user doesn't confirm
      setTimeout(() => setConfirming(false), 4000);
      return;
    }

    startTransition(async () => {
      const result = await deleteJob(jobId);
      if (result.success) {
        showToast("Job deleted", "success");
        router.push("/home");
        router.refresh();
      } else {
        showToast(result.error ?? "Could not delete job", "error");
        setConfirming(false);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
        confirming
          ? "bg-red-500 text-white active:bg-red-600"
          : "bg-gray-100 text-gray-500 active:bg-gray-200"
      }`}
    >
      {isPending ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
      {isPending ? "Deleting…" : confirming ? "Tap again to confirm delete" : "Delete Job"}
    </button>
  );
}
