"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MediaSummary } from "../lib/api";

interface HeroShowcaseProps {
  media?: MediaSummary;
  items?: MediaSummary[];
}

export default function HeroShowcase({ media, items }: HeroShowcaseProps) {
  const slides = items && items.length > 0 ? items.slice(0, 5) : media ? [media] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedBackdrops, setFailedBackdrops] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const current = slides[activeIndex] || slides[0];

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cineverse_watchlist");
      if (raw) {
        const parsed: MediaSummary[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedIds(parsed.map((i) => i.id));
        }
      }
    } catch {}
  }, []);

  // Auto-advance featured hero every 9 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!current) return null;

  const year = current.release_date ? current.release_date.slice(0, 4) : "";
  const isSaved = savedIds.includes(current.id);

  const toggleMyList = () => {
    try {
      const raw = localStorage.getItem("cineverse_watchlist");
      const list: MediaSummary[] = raw ? JSON.parse(raw) : [];
      const exists = list.some((m) => m.id === current.id);
      const next = exists
        ? list.filter((m) => m.id !== current.id)
        : [current, ...list];
      localStorage.setItem("cineverse_watchlist", JSON.stringify(next));
      setSavedIds(next.map((m) => m.id));
    } catch {}
  };

  return (
    <section className="relative w-full h-[78vh] min-h-[540px] max-h-[780px] bg-[#07080d] overflow-hidden flex items-end">
      {/* Full-bleed Backdrop Image */}
      {current.backdrop_url && !failedBackdrops[current.id] && (
        <img
          key={current.id}
          src={current.backdrop_url}
          alt={current.title}
          onError={() =>
            setFailedBackdrops((prev) => ({ ...prev, [current.id]: true }))
          }
          className="absolute inset-0 w-full h-full object-cover object-center opacity-55 scale-105 transition-opacity duration-700 animate-fade-in"
        />
      )}

      {/* Multi-layer Obsidian Cinema Vignettes */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/55 to-[#07080d]/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07080d] via-[#07080d]/65 to-transparent" />
      <div className="absolute -bottom-24 left-1/4 w-[520px] h-[220px] bg-primary/15 blur-[120px] pointer-events-none" />

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl space-y-4">
          {/* Premiere Badge + Metadata Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-[11px] font-extrabold uppercase tracking-widest text-rose-200 backdrop-blur-md shadow-[0_0_20px_rgba(225,29,72,0.3)]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Featured Premiere • 4K HDR
            </span>

            {current.vote_average > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-400">
                ★ {current.vote_average.toFixed(1)}
              </span>
            )}

            {year && (
              <span className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-xs font-semibold text-neutral-200">
                {year}
              </span>
            )}

            {current.genres.slice(0, 3).map((g) => (
              <span
                key={g}
                className="px-2.5 py-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-xs font-medium text-neutral-300"
              >
                {g}
              </span>
            ))}
          </div>

          {/* Display Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
            {current.title}
          </h1>

          {/* Synopsis */}
          {current.overview && (
            <p className="text-sm sm:text-base text-neutral-200/90 max-w-xl line-clamp-3 leading-relaxed">
              {current.overview}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link
              href={`/media/${current.id}?play=true`}
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-primary to-rose-600 hover:from-primary-hover hover:to-rose-500 text-white font-bold px-7 py-3.5 rounded-2xl transition-all shadow-[0_8px_30px_rgba(225,29,72,0.45)] hover:scale-[1.03] active:scale-95 text-sm sm:text-base"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Now
            </Link>

            <button
              onClick={toggleMyList}
              className={`inline-flex items-center gap-2 font-semibold px-6 py-3.5 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.03] active:scale-95 text-sm sm:text-base ${
                isSaved
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30"
                  : "bg-white/[0.08] hover:bg-white/[0.15] border-white/15 text-white"
              }`}
            >
              <span>{isSaved ? "✓ In My List" : "+ My List"}</span>
            </button>

            <Link
              href={`/media/${current.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-3.5 rounded-2xl text-neutral-300 hover:text-white hover:bg-white/[0.06] font-semibold text-sm transition-colors"
            >
              More Info &rarr;
            </Link>
          </div>
        </div>

        {/* Slide Indicator Dots */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2 self-start md:self-end">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Show featured title ${s.title}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? "w-8 bg-primary shadow-[0_0_12px_rgba(225,29,72,0.9)]"
                    : "w-2 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
