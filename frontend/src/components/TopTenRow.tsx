"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { MediaSummary } from "../lib/api";

interface TopTenRowProps {
  title?: string;
  items: MediaSummary[];
}

export default function TopTenRow({ title = "Top 10 Today", items }: TopTenRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const top10 = items.slice(0, 10);

  if (top10.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -640 : 640, behavior: "smooth" });
  };

  return (
    <section className="w-full my-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-3">
          <span className="w-1 h-7 bg-gradient-to-b from-primary via-rose-500 to-amber-400 rounded-full shadow-[0_0_14px_rgba(225,29,72,0.85)]" />
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h2>
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/35 text-[10px] font-extrabold uppercase tracking-widest text-rose-300">
            Trending today
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll top 10 left"
            className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll top 10 right"
            className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Numbered Horizontal Track */}
      <div
        ref={scrollRef}
        className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 pb-5 max-w-[1440px] mx-auto scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {top10.map((item, idx) => {
          const rank = idx + 1;
          const isDoubleDigit = rank >= 10;
          return (
            <Link
              key={item.id}
              href={`/media/${item.id}`}
              className="group relative flex items-end shrink-0 pl-10 sm:pl-14 pt-2"
            >
              {/* Giant Hollow Metallic Rank Numeral */}
              <span
                aria-hidden="true"
                className={`select-none pointer-events-none absolute left-0 bottom-0 font-black leading-[0.82] tracking-tighter transition-all duration-300 group-hover:scale-105 ${
                  isDoubleDigit
                    ? "text-[96px] sm:text-[118px] -left-2"
                    : "text-[118px] sm:text-[148px]"
                }`}
                style={{
                  WebkitTextStroke: "2px rgba(255, 255, 255, 0.28)",
                  color: "rgba(10, 11, 18, 0.9)",
                  textShadow: "0 8px 24px rgba(0,0,0,0.85)",
                }}
              >
                {rank}
              </span>

              {/* Poster Card Overlapping Numeral */}
              <div className="relative z-10 w-[145px] sm:w-[170px] rounded-2xl overflow-hidden bg-surface border border-white/[0.09] transition-all duration-300 group-hover:-translate-y-2 group-hover:border-primary/70 group-hover:shadow-[0_12px_32px_rgba(225,29,72,0.38)]">
                <div className="relative w-full aspect-[2/3] bg-neutral-900 overflow-hidden">
                  {item.poster_url && !failedImages[item.id] ? (
                    <img
                      src={item.poster_url}
                      alt={item.title}
                      width={300}
                      height={450}
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-neutral-400">
                      {item.title}
                    </div>
                  )}

                  {/* Top Rating Pill */}
                  {item.vote_average > 0 && (
                    <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-md border border-white/10 rounded-lg px-2 py-0.5 text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <span>★</span>
                      <span>{item.vote_average.toFixed(1)}</span>
                    </div>
                  )}

                  {/* Bottom Title Gradient */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5 pt-8">
                    <p className="text-xs font-bold text-white truncate group-hover:text-rose-300 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-medium">
                      {item.release_date?.slice(0, 4) || "2026"} •{" "}
                      {item.media_type === "TV_SHOW"
                        ? "Series"
                        : item.media_type === "MOVIE"
                        ? "Film"
                        : item.media_type}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
