"use client";

// Screen 3 — Invoice Preview & Send
// Shows the generated invoice and lets the tradesperson send it via SMS, email, or link.
// Also has a "Mark as Cash Paid" option for off-platform payments.

import { useState } from "react";
import { MessageSquare, Mail, Link2, Banknote, Check } from "lucide-react";
import { centsToDisplay } from "@/lib/utils";

// TODO: Replace with real data fetched by job ID
const MOCK_INVOICE = {
  id: "mock-id",
  jobId: "job-1",
  clientName: "Mike Johnson",
  clientPhone: "+15551234567",
  clientEmail: "mike@example.com",
  description: "Full driveway wash + seal coat",
  totalAmountCents: 18000,
  beforePhotoUrl: null as string | null,
  afterPhotoUrl:  null as string | null,
  paymentUrl: "https://buy.stripe.com/test_example",
};

type SendStatus = "idle" | "sending" | "sent";

export default function InvoicePage() {
  const [smsSent,   setSmsSent]   = useState<SendStatus>("idle");
  const [emailSent, setEmailSent] = useState<SendStatus>("idle");
  const [linkCopied, setLinkCopied] = useState(false);

  async function handleSendSms() {
    setSmsSent("sending");
    // TODO: POST to /api/invoices/[id]/send with { method: "sms" }
    await new Promise((r) => setTimeout(r, 1000)); // Simulated delay
    setSmsSent("sent");
  }

  async function handleSendEmail() {
    setEmailSent("sending");
    // TODO: POST to /api/invoices/[id]/send with { method: "email" }
    await new Promise((r) => setTimeout(r, 1000));
    setEmailSent("sent");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(MOCK_INVOICE.paymentUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  async function handleMarkCashPaid() {
    // TODO: POST to /api/jobs/[id]/mark-paid with { method: "cash" }
    alert("Marked as cash paid!"); // Replace with proper confirmation
  }

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Invoice preview card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Invoice</p>
            <p className="text-lg font-bold text-gray-900">{MOCK_INVOICE.clientName}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {centsToDisplay(MOCK_INVOICE.totalAmountCents)}
          </p>
        </div>

        <p className="text-sm text-gray-600 mb-4">{MOCK_INVOICE.description}</p>

        {/* Before/After photos */}
        {(MOCK_INVOICE.beforePhotoUrl || MOCK_INVOICE.afterPhotoUrl) && (
          <div className="grid grid-cols-2 gap-2 mb-2">
            {MOCK_INVOICE.beforePhotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={MOCK_INVOICE.beforePhotoUrl}
                alt="Before"
                className="aspect-square rounded-xl object-cover"
              />
            )}
            {MOCK_INVOICE.afterPhotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={MOCK_INVOICE.afterPhotoUrl}
                alt="After"
                className="aspect-square rounded-xl object-cover"
              />
            )}
          </div>
        )}
      </div>

      {/* Send options */}
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">
        Send via
      </p>

      <div className="space-y-3 mb-4">
        <SendButton
          icon={<MessageSquare size={22} />}
          label={`Text ${MOCK_INVOICE.clientName.split(" ")[0]}`}
          sublabel={MOCK_INVOICE.clientPhone}
          status={smsSent}
          onClick={handleSendSms}
          color="green"
        />
        <SendButton
          icon={<Mail size={22} />}
          label={`Email ${MOCK_INVOICE.clientName.split(" ")[0]}`}
          sublabel={MOCK_INVOICE.clientEmail}
          status={emailSent}
          onClick={handleSendEmail}
          color="blue"
        />
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-left active:bg-gray-50"
        >
          <div className="text-purple-500">
            {linkCopied ? <Check size={22} /> : <Link2 size={22} />}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {linkCopied ? "Link Copied!" : "Copy Payment Link"}
            </p>
            <p className="text-xs text-gray-400">Paste anywhere</p>
          </div>
        </button>
      </div>

      {/* Cash option */}
      <button
        onClick={handleMarkCashPaid}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-2xl py-3 text-gray-600 font-medium text-sm active:bg-gray-50"
      >
        <Banknote size={18} />
        Mark as Cash Paid
      </button>
    </div>
  );
}

// ── Send Button Component ─────────────────────────────────────────────────────
function SendButton({
  icon,
  label,
  sublabel,
  status,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  status: SendStatus;
  onClick: () => void;
  color: "green" | "blue";
}) {
  const colorMap = {
    green: "text-green-600",
    blue:  "text-blue-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={status !== "idle"}
      className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-left active:bg-gray-50 disabled:opacity-60"
    >
      <div className={colorMap[color]}>
        {status === "sent" ? <Check size={22} /> : icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">
          {status === "sending" ? "Sending..." : status === "sent" ? "Sent!" : label}
        </p>
        <p className="text-xs text-gray-400">{sublabel}</p>
      </div>
    </button>
  );
}
