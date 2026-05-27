import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combines Tailwind class names safely — use this everywhere instead of template strings
// Example: cn("px-4 py-2", isActive && "bg-blue-600", className)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Money helpers ────────────────────────────────────────────────────────────
// We store all money as cents (integers) in the database.
// Use these helpers to convert between cents and display dollars.

/** Convert cents (integer) to a display string: 18000 → "$180.00" */
export function centsToDisplay(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** Convert a dollar string input to cents: "180" → 18000 */
export function dollarsToCents(dollars: string | number): number {
  const num = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  return Math.round(num * 100);
}

// ── Date helpers ─────────────────────────────────────────────────────────────

/** Format a date as "May 27, 2026" */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/** Format a date as "Today", "Yesterday", or "May 15" */
export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

// ── String helpers ────────────────────────────────────────────────────────────

/** Convert a trade type key to a display label: "pressure_washing" → "Pressure Washing" */
export function tradeTypeLabel(tradeType: string): string {
  return tradeType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Generate a URL-safe username from a business name: "Duke's Pressure Washing" → "dukes-pressure-washing" */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
