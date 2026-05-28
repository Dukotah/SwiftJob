"use client";

// send-buttons.tsx — the interactive send/pay buttons on the invoice page.
// Kept as a separate client component so the parent invoice page can be a server component.

import { useState } from "react";
import { MessageSquare, Mail, Link2, Banknote, Check } from "lucide-react";
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

  const firstName = clientName.split(" ")[0];

  // Stripe not set up yet — show placeholder link
  const shareUrl = paymentUrl ?? `${window.location.origin}/pay/${jobId}`;

  async function handleSendSms() {
    if (!clientPhone) return;
    setSmsSent("sending");
    await fetch(`/api/invoices/${jobId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "sms" }),
    });
    setSmsSent("sent");
  }

  async function handleSendEmail() {
    if (!clientEmail) return;
    setEmailSent("sending");
    await fetch(`/api/invoices/${jobId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "email" }),
    });
    setEmailSent("sent");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  }

  async function handleCashPaid() {
    setMarking(true);
    await markJobCashPaid(jobId);
  }

  if (isPaid) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
        <p className="text-2xl mb-1">✓</p>
        <p className="font-bold text-green-700">Paid {amountDisplay}</p>
        <p className="text-sm text-green-600">This job is complete.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Send via</p>

      {/* SMS */}
      {clientPhone ? (
        <SendButton
          icon={<MessageSquare size={22} />}
          label={smsSent === "sent" ? "Sent!" : `Text ${firstName}`}
          sublabel={clientPhone}
          status={smsSent}
          onClick={handleSendSms}
          color="green"
        />
      ) : (
        <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 opacity-50">
          <MessageSquare size={22} className="text-gray-400" />
          <div>
            <p className="font-semibold text-gray-500 text-sm">Text client</p>
            <p className="text-xs text-gray-400">No phone number saved</p>
          </div>
        </div>
      )}

      {/* Email */}
      {clientEmail ? (
        <SendButton
          icon={<Mail size={22} />}
          label={emailSent === "sent" ? "Sent!" : `Email ${firstName}`}
          sublabel={clientEmail}
          status={emailSent}
          onClick={handleSendEmail}
          color="blue"
        />
      ) : (
        <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 opacity-50">
          <Mail size={22} className="text-gray-400" />
          <div>
            <p className="font-semibold text-gray-500 text-sm">Email client</p>
            <p className="text-xs text-gray-400">No email saved</p>
          </div>
        </div>
      )}

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-left active:bg-gray-50"
      >
        <div className="text-purple-500">
          {linkCopied ? <Check size={22} /> : <Link2 size={22} />}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{linkCopied ? "Copied!" : "Copy Payment Link"}</p>
          <p className="text-xs text-gray-400">Paste anywhere — iMessage, WhatsApp, etc.</p>
        </div>
      </button>

      {/* Cash */}
      <button
        onClick={handleCashPaid}
        disabled={marking}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-2xl py-3 text-gray-600 font-medium text-sm active:bg-gray-50 disabled:opacity-50"
      >
        <Banknote size={18} />
        {marking ? "Marking..." : "Mark as Cash Paid"}
      </button>
    </div>
  );
}

function SendButton({ icon, label, sublabel, status, onClick, color }: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  status: SendStatus;
  onClick: () => void;
  color: "green" | "blue";
}) {
  return (
    <button
      onClick={onClick}
      disabled={status !== "idle"}
      className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-left active:bg-gray-50 disabled:opacity-60"
    >
      <div className={color === "green" ? "text-green-600" : "text-blue-600"}>
        {status === "sent" ? <Check size={22} /> : icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">
          {status === "sending" ? "Sending..." : label}
        </p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
    </button>
  );
}
