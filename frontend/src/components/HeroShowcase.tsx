"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MediaSummary } from "../lib/api";

interface HeroShowcaseProps {
  media?: MediaSummary;
  items?: MediaSummary[];
}

const ACCENT_BLOOMS = [
  "bg-rose-600/20",
  "bg-amber-500/20",
  "bg-cyan-500/20",
  "bg-violet-500/20",
  "bg-emerald-500/15",
];

export default function HeroShowcase({ media, items }: HeroShowcaseProps) {
  const slides = items && items.length > 0 ? items.slice(0, 5) : media ? [media] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedBackdrops, setFailedBackdrops] = useState<Record<string, boolean>>({});
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const current = slides[activeIndex] || slides[0];

  useEffect(() => {
    try {
      const raw = localStorage.getItem("avyra_watchlist") || localStorage.getItem("cineverse_watchlist");
      if (raw) {
        const parsed: MediaSummary[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedIds(parsed.map((i) => i.id));
        }
      }
    } catch {}
  }, []);

  // Auto-advance featured hero every 9 seconds (paused while trailer modal is open)
  useEffect(() => {
    if (slides.length <= 1 || trailerKey) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [slides.length, trailerKey]);

  if (!current) return null;

  const year = current.release_date ? current.release_date.slice(0, 4) : "";
  const isSaved = savedIds.includes(current.id);
  const bloomClass = ACCENT_BLOOMS[activeIndex % ACCENT_BLOOMS.length];

  const toggleMyList = () => {
    try {
      const raw = localStorage.getItem("avyra_watchlist") || localStorage.getItem("cineverse_watchlist");
      const list: MediaSummary[] = raw ? JSON.parse(raw) : [];
      const exists = list.some((m) => m.id === current.id);
      const next = exists
        ? list.filter((m) => m.id !== current.id)
        : [current, ...list];
      localStorage.setItem("avyra_watchlist", JSON.stringify(next));
      setSavedIds(next.map((m) => m.id));
    } catch {}
  };

  return (
    <>
      <section className="relative w-full h-[78vh] min-h-[540px] max-h-[780px] bg-[#07080d] overflow-hidden flex items-end">
        {/* Full-bleed Backdrop Image */}
        {current.backdrop_url && !failedBackdrops[current.id] && (
          <img
            key={current.id}
            src={current.backdrop_url}
            alt={current.title}
            width={1280}
            height={720}
            decoding="async"
            onError={() =>
              setFailedBackdrops((prev) => ({ ...prev, [current.id]: true }))
            }
            className="absolute inset-0 w-full h-full object-cover object-center opacity-55 scale-105 transition-opacity duration-700 animate-fade-in"
          />
        )}

        {/* Multi-layer Obsidian Cinema Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d] via-[#07080d]/55 to-[#07080d]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07080d] via-[#07080d]/65 to-transparent" />

        {/* Dynamic Accent Bloom that shifts per featured slide */}
        <div
          className={`absolute -bottom-24 left-1/4 w-[560px] h-[240px] ${bloomClass} blur-[130px] pointer-events-none transition-colors duration-1000`}
        />

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            {/* Premiere Badge + Metadata Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-[11px] font-extrabold uppercase tracking-widest text-rose-200 backdrop-blur-md shadow-[0_0_20px_rgba(225,29,72,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Top Rated • 4K HDR
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

            {/* Slide Display Title (H2 so page H1 remains site-level) */}
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              {current.title}
            </h2>

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

              {current.trailer_key && (
                <button
                  onClick={() => setTrailerKey(current.trailer_key || null)}
                  className="inline-flex items-center gap-2 bg-white/[0.1] hover:bg-white/[0.18] text-white font-semibold px-5 py-3.5 rounded-2xl border border-white/15 backdrop-blur-xl transition-all hover:scale-[1.03] active:scale-95 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Trailer</span>
                </button>
              )}

              <button
                onClick={toggleMyList}
                className={`inline-flex items-center gap-2 font-semibold px-5 py-3.5 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.03] active:scale-95 text-sm sm:text-base ${
                  isSaved
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30"
                    : "bg-white/[0.06] hover:bg-white/[0.14] border-white/15 text-white"
                }`}
              >
                <span>{isSaved ? "✓ In My List" : "+ My List"}</span>
              </button>

              <Link
                href={`/media/${current.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-3.5 rounded-2xl text-neutral-300 hover:text-white hover:bg-white/[0.06] font-semibold text-sm transition-colors"
              >
                Details &rarr;
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

      {/* Inline Zero-Ad YouTube Trailer Modal */}
      {trailerKey && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fade-in"
          onClick={() => setTrailerKey(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-black border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 bg-[#0e1018] border-b border-white/10">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {current.title} — Official Trailer
              </span>
              <button
                onClick={() => setTrailerKey(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`}
                title={`${current.title} Trailer`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
