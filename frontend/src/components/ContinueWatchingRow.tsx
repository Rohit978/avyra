"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MediaSummary } from "../lib/api";
import {
  AUTH_EVENT,
  ContinueWatchingItem,
  getContinueWatching,
  pullAccountSync,
  SYNC_EVENT,
} from "../lib/sync";

export type { ContinueWatchingItem };

interface ContinueWatchingRowProps {
  fallbackItems: MediaSummary[];
}

export default function ContinueWatchingRow({ fallbackItems }: ContinueWatchingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const refresh = () => {
      const saved = getContinueWatching();
      if (saved.length > 0) {
        setItems(saved);
        return;
      }

      const demoProgress = [68, 34, 82, 47, 21];
      const seeded: ContinueWatchingItem[] = fallbackItems.slice(0, 5).map((m, idx) => ({
        id: m.id,
        title: m.title,
        media_type: m.media_type,
        backdrop_url: m.backdrop_url ?? m.poster_url ?? null,
        poster_url: m.poster_url ?? null,
        progress: demoProgress[idx % demoProgress.length],
        subtitle:
          m.media_type === "MOVIE"
            ? `${45 + idx * 18}m left`
            : `S1 • E${idx + 1} • ${22 + idx * 5}m left`,
      }));
      setItems(seeded);
    };

    refresh();
    pullAccountSync();

    window.addEventListener(SYNC_EVENT, refresh);
    window.addEventListener(AUTH_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SYNC_EVENT, refresh);
      window.removeEventListener(AUTH_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [fallbackItems]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -520 : 520, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <section className="w-full my-8">
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <span className="w-1 h-6 bg-gradient-to-b from-primary to-amber-400 rounded-full inline-block shadow-[0_0_12px_rgba(225,29,72,0.7)]" />
          Continue Watching
        </h2>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll continue watching left"
            className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll continue watching right"
            className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 pb-4 max-w-[1440px] mx-auto scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => {
          const imgSrc = !failedImages[item.id]
            ? item.backdrop_url || item.poster_url
            : null;
          return (
            <Link
              key={item.id}
              href={`/media/${item.id}?play=true`}
              className="group relative w-[270px] sm:w-[320px] shrink-0 rounded-2xl overflow-hidden bg-surface border border-white/[0.08] hover:border-primary/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(225,29,72,0.22)]"
            >
              <div className="relative w-full aspect-video bg-neutral-900 overflow-hidden">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={item.title}
                    width={480}
                    height={270}
                    loading="lazy"
                    decoding="async"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                    }
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-90 group-hover:brightness-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-500 text-xs font-semibold">
                    {item.title}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/25 to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-12 h-12 rounded-full bg-primary/90 backdrop-blur-md text-white flex items-center justify-center shadow-[0_0_24px_rgba(225,29,72,0.75)] scale-90 group-hover:scale-100 transition-transform">
                    <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate drop-shadow">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-neutral-300/90 font-medium">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/60 backdrop-blur border border-white/10 text-neutral-200 shrink-0">
                    Resume
                  </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-amber-400 shadow-[0_0_10px_rgba(225,29,72,0.9)]"
                    style={{ width: `${Math.min(100, Math.max(5, item.progress))}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
