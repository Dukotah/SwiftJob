"use client";

import { useState } from "react";
import { MessageSquare, Mail, Link2, Banknote, Check, ChevronRight } from "lucide-react";
import { markJobCashPaid } from "@/lib/actions";

type SendStatus = "idle" | "sending" | "sent";

interface Props {
  jobId: string;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  amountDisplay: string;
  paymentUrl: string | null;
  isPaid: boolean;
}

export default function InvoiceSendButtons({ jobId, clientName, clientPhone, clientEmail, amountDisplay, paymentUrl, isPaid }: Props) {
  const [smsSent,    setSmsSent]    = useState<SendStatus>("idle");
  const [emailSent,  setEmailSent]  = useState<SendStatus>("idle");
  const [linkCopied, setLinkCopied] = useState(false);
  const [marking,    setMarking]    = useState(false);

  const firstName  = clientName.split(" ")[0];
  const shareUrl   = paymentUrl ?? (typeof window !== "undefined" ? `${window.location.origin}/pay/${jobId}` : "");

  async function send(method: "sms" | "email") {
    if (method === "sms")   setSmsSent("sending");
    if (method === "email") setEmailSent("sending");

    await fetch(`/api/invoices/${jobId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });

    if (method === "sms")   setSmsSent("sent");
    if (method === "email") setEmailSent("sent");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
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

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Send Invoice</p>

      <div className="card overflow-hidden divide-y divide-gray-100">
        {/* SMS */}
        <ActionRow
          icon={<MessageSquare size={18} className="text-green-600" />}
          iconBg="bg-green-50"
          title={smsSent === "sent" ? "Sent!" : clientPhone ? `Text ${firstName}` : "Text client"}
          subtitle={clientPhone ?? "No phone saved"}
          disabled={!clientPhone || smsSent !== "idle"}
          loading={smsSent === "sending"}
          done={smsSent === "sent"}
          onClick={() => send("sms")}
        />

        {/* Email */}
        <ActionRow
          icon={<Mail size={18} className="text-blue-600" />}
          iconBg="bg-blue-50"
          title={emailSent === "sent" ? "Sent!" : clientEmail ? `Email ${firstName}` : "Email client"}
          subtitle={clientEmail ?? "No email saved"}
          disabled={!clientEmail || emailSent !== "idle"}
          loading={emailSent === "sending"}
          done={emailSent === "sent"}
          onClick={() => send("email")}
        />

        {/* Copy link */}
        <ActionRow
          icon={linkCopied ? <Check size={18} className="text-purple-600" /> : <Link2 size={18} className="text-purple-600" />}
          iconBg="bg-purple-50"
          title={linkCopied ? "Copied to clipboard!" : "Copy payment link"}
          subtitle="Paste into iMessage, WhatsApp, anywhere"
          disabled={false}
          loading={false}
          done={false}
          onClick={copyLink}
        />
      </div>

      {/* Cash */}
      <button
        onClick={async () => { setMarking(true); await markJobCashPaid(jobId); }}
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
