"use client";

// Global toast notification system.
// Wrap the app layout with <ToastProvider>, then call useToast() anywhere
// in a client component to trigger a floating notification.

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 3.5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — fixed top of screen, above all other UI */}
      <div
        className="fixed left-0 right-0 z-[200] flex flex-col gap-2 px-4 pointer-events-none"
        style={{ top: "max(16px, env(safe-area-inset-top, 16px))" }}
      >
        {toasts.map((toast) => {
          const Icon =
            toast.type === "success" ? CheckCircle :
            toast.type === "error"   ? XCircle     : Info;

          const styles =
            toast.type === "success" ? "bg-emerald-500 shadow-emerald-100" :
            toast.type === "error"   ? "bg-red-500 shadow-red-100"         :
                                       "bg-gray-800 shadow-gray-100";

          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium pointer-events-auto animate-in slide-in-from-top-2 duration-200 ${styles}`}
            >
              <Icon size={17} className="shrink-0" />
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 active:opacity-100 transition-opacity ml-1"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
