"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSearchSuggestions, SearchSuggestion } from "../lib/api";

const QUICK_LINKS = [
  { label: "Top Rated Movies", href: "/movies" },
  { label: "Popular TV Series", href: "/tv" },
  { label: "Anime Catalog (Sub & Dub)", href: "/anime" },
  { label: "My Watchlist", href: "/watchlist" },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts: Cmd+K / Ctrl+K / '/'
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "/" && !isInput && !open) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    const onCustomOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onCustomOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onCustomOpen);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIdx(0);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getSearchSuggestions(query.trim());
        setResults(res);
        setSelectedIdx(0);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const listLength = query.trim() ? results.length : QUICK_LINKS.length;

  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (listLength > 0) setSelectedIdx((prev) => (prev + 1) % listLength);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (listLength > 0) setSelectedIdx((prev) => (prev - 1 + listLength) % listLength);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim()) {
        if (results[selectedIdx]) {
          router.push(`/media/${results[selectedIdx].id}`);
          setOpen(false);
        } else {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          setOpen(false);
        }
      } else if (QUICK_LINKS[selectedIdx]) {
        router.push(QUICK_LINKS[selectedIdx].href);
        setOpen(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-[#0e1018]/95 border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Spotlight Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08]">
          <svg
            className="w-5 h-5 text-primary shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyNav}
            placeholder="Search any movie, TV series, or anime..."
            className="w-full bg-transparent text-white placeholder-neutral-400 text-base focus:outline-none"
          />
          {loading && (
            <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
          )}
          <kbd className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-mono text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto p-2.5">
          {!query.trim() ? (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Quick Jump
              </div>
              {QUICK_LINKS.map((link, idx) => (
                <button
                  key={link.href}
                  onClick={() => {
                    router.push(link.href);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    selectedIdx === idx
                      ? "bg-primary/20 text-white border border-primary/35"
                      : "text-neutral-300 hover:bg-white/[0.05] border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{link.label}</span>
                  </span>
                  <span className="text-xs text-neutral-500">↵</span>
                </button>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                Live Results
              </div>
              {results.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(`/media/${item.id}`);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  className={`w-full flex items-center gap-3.5 p-2 rounded-xl text-left transition-all ${
                    selectedIdx === idx
                      ? "bg-white/[0.09] border border-primary/40"
                      : "hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <div className="w-10 h-14 rounded-lg bg-neutral-800 overflow-hidden shrink-0">
                    {item.poster_url ? (
                      <img
                        src={item.poster_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-300">
                        {item.media_type === "TV_SHOW" ? "TV" : item.media_type}
                      </span>
                      {item.release_date && (
                        <span>{item.release_date.slice(0, 4)}</span>
                      )}
                      {item.vote_average > 0 && (
                        <span className="text-amber-400 font-semibold">
                          ★ {item.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500 pr-2">Watch &rarr;</span>
                </button>
              ))}
            </div>
          ) : !loading ? (
            <div className="py-10 text-center text-sm text-neutral-400">
              No titles found for &quot;{query}&quot;. Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs">Enter</kbd> to run a full search.
            </div>
          ) : null}
        </div>

        {/* Footer Hints */}
        <div className="px-5 py-2.5 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
          </div>
          <span className="text-neutral-400 font-medium">Avyra Spotlight</span>
        </div>
      </div>
    </div>
  );
}
