"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export default function SearchBox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  }

  if (open) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => !query && setOpen(false)}
          placeholder="Search articles…"
          className="w-32 rounded-md border-none bg-white/90 px-2 py-1 text-sm text-gray-900 outline-none sm:w-48"
        />
        <button type="submit" aria-label="Search">
          <SearchIcon />
        </button>
      </form>
    );
  }

  return (
    <button onClick={() => setOpen(true)} aria-label="Search">
      <SearchIcon />
    </button>
  );
}