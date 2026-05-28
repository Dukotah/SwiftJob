"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";
import { Search, X } from "lucide-react";

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function push(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else   params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push(q), 280);
  }

  function clear() {
    setValue("");
    push("");
  }

  return (
    <div className="relative px-4 py-3">
      <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Search by client or job description…"
        className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {value && (
        <button type="button" onClick={clear} className="absolute right-7 top-1/2 -translate-y-1/2 p-1">
          <X size={15} className="text-gray-400" />
        </button>
      )}
    </div>
  );
}
