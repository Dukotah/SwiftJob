"use client";

import { useState } from "react";
import { MessageSquare, Mail, Link2, Share2, Banknote, Check, ChevronRight, AlertCircle } from "lucide-react";
import { markJobCashPaid } from "@/lib/actions";

function isNextInternalError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err;
}

type SendStatus = "idle" | "sending" | "sent" | "error";

interface Props {
  jobId: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  amountDisplay: string;
  paymentUrl: string | null;
  isPaid: boolean;
  sentVia?: string | null;
  sentAt?: Date | null;
}

export default function InvoiceSendButtons({ jobId, clientName, clientPhone, clientEmail, amountDisplay, paymentUrl, isPaid, sentVia, sentAt }: Props) {
  const [smsSent,    setSmsSent]    = useState<SendStatus>("idle");
  const [emailSent,  setEmailSent]  = useState<SendStatus>("idle");
  const [linkCopied, setLinkCopied] = useState(false);
  const [marking,    setMarking]    = useState(false);
  const [cashError,  setCashError]  = useState<string | null>(null);

  const firstName = clientName.split(" ")[0];
  // Always share the branded /pay/[id] page — clients see your business
  // name and photos before the Stripe checkout.
  const shareUrl  = typeof window !== "undefined" ? `${window.location.origin}/pay/${jobId}` : `/pay/${jobId}`;

  async function send(method: "sms" | "email") {
    if (method === "sms")   setSmsSent("sending");
    if (method === "email") setEmailSent("sending");

    try {
      const res = await fetch(`/api/invoices/${jobId}/send`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ method }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to send");
      }

      if (method === "sms")   setSmsSent("sent");
      if (method === "email") setEmailSent("sent");
    } catch (err) {
      if (method === "sms")   setSmsSent("error");
      if (method === "email") setEmailSent("error");
      console.error(`Send ${method} failed:`, err);
    }
  }

  async function shareOrCopyLink() {
    // Use the native share sheet on mobile if available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Your invoice is ready",
          text:  `Invoice for ${amountDisplay} — tap to pay securely`,
          url:   shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }

  async function handleCashPaid() {
    setCashError(null);
    setMarking(true);
    try {
      await markJobCashPaid(jobId);
    } catch (err) {
      if (isNextInternalError(err)) throw err;
      setCashError("Failed to mark as paid. Please try again.");
      setMarking(false);
    }
  }

  if (isPaid) {
    return (
      <div className="card p-5 text-center">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={24} className="text-emerald-600" />
        </div>
        <p className="font-bold text-gray-900">Paid — {amountDisplay}</p>
        <p className="text-sm text-gray-400 mt-1">This job is complete</p>
      </div>
    );
  }

  // Sent history banner
  const sentBanner = sentVia && sentAt ? (
    <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2.5">
      <span className="text-sm">
        {sentVia === "sms" ? "📱" : sentVia === "email" ? "✉️" : sentVia === "cash" ? "💵" : "🔗"}
      </span>
      <p className="text-xs text-blue-700 font-medium flex-1">
        {sentVia === "cash"
          ? `Marked as cash paid`
          : `Last sent via ${sentVia === "sms" ? "SMS" : sentVia === "email" ? "email" : "link"}`}
        {" · "}
        {new Date(sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
      <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">Resend?</span>
    </div>
  ) : null;

  return (
    <div className="space-y-3">
      {sentBanner}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
        {sentVia ? "Send Again" : "Send Invoice"}
      </p>

      <div className="card overflow-hidden divide-y divide-gray-100">
        {/* SMS */}
        <ActionRow
          icon={<MessageSquare size={18} className={smsSent === "error" ? "text-red-500" : "text-green-600"} />}
          iconBg={smsSent === "error" ? "bg-red-50" : "bg-green-50"}
          title={
            smsSent === "sent"    ? "Sent!" :
            smsSent === "error"   ? "Failed — tap to retry" :
            clientPhone           ? `Text ${firstName}` : "Text client"
          }
          subtitle={clientPhone ?? "No phone saved"}
          disabled={!clientPhone || smsSent === "sending"}
          loading={smsSent === "sending"}
          done={smsSent === "sent"}
          onClick={() => send("sms")}
        />

        {/* Email */}
        <ActionRow
          icon={<Mail size={18} className={emailSent === "error" ? "text-red-500" : "text-blue-600"} />}
          iconBg={emailSent === "error" ? "bg-red-50" : "bg-blue-50"}
          title={
            emailSent === "sent"  ? "Sent!" :
            emailSent === "error" ? "Failed — tap to retry" :
            clientEmail           ? `Email ${firstName}` : "Email client"
          }
          subtitle={clientEmail ?? "No email saved"}
          disabled={!clientEmail || emailSent === "sending"}
          loading={emailSent === "sending"}
          done={emailSent === "sent"}
          onClick={() => send("email")}
        />

        {/* Share / Copy link */}
        <ActionRow
          icon={linkCopied ? <Check size={18} className="text-purple-600" /> : <Share2 size={18} className="text-purple-600" />}
          iconBg="bg-purple-50"
          title={linkCopied ? "Copied!" : "Share payment link"}
          subtitle="iMessage, WhatsApp, email, anywhere"
          disabled={false}
          loading={false}
          done={linkCopied}
          onClick={shareOrCopyLink}
        />
      </div>

      {/* Cash */}
      {cashError && (
        <div className="flex items-center gap-2 px-1">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-500">{cashError}</p>
        </div>
      )}
      <button
        onClick={handleCashPaid}
        disabled={marking}
        className="btn-ghost w-full flex items-center justify-center gap-2"
      >
        <Banknote size={16} className="text-gray-500" />
        {marking ? "Marking..." : "Mark as Cash Paid"}
      </button>
    </div>
  );
}

function ActionRow({ icon, iconBg, title, subtitle, disabled, loading, done, onClick }: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  disabled: boolean;
  loading: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{loading ? "Sending..." : title}</p>
        <p className="text-xs text-gray-400 truncate">{subtitle}</p>
      </div>
      {!done && !loading && <ChevronRight size={16} className="text-gray-300 shrink-0" />}
      {done && <Check size={16} className="text-emerald-500 shrink-0" />}
    </button>
  );
}
