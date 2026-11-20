"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { MediaSummary } from "../lib/api";
import MediaCard from "./MediaCard";
import MediaCardSkeleton from "./MediaCardSkeleton";

interface MediaCarouselProps {
  title: string;
  items: MediaSummary[];
  viewAllHref?: string;
  isLoading?: boolean;
}

export default function MediaCarousel({
  title,
  items,
  viewAllHref,
  isLoading = false,
}: MediaCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -640 : 640;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="w-full my-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <span className="w-1 h-6 bg-gradient-to-b from-primary to-amber-400 rounded-full inline-block shadow-[0_0_12px_rgba(225,29,72,0.7)]" />
          {title}
        </h2>

        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs sm:text-sm font-semibold text-neutral-300 hover:text-primary transition-colors"
            >
              See All &rarr;
            </Link>
          )}

          {/* Glass Slider Buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Slider */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 pb-4 max-w-[1440px] mx-auto scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="w-[155px] sm:w-[190px] md:w-[210px] shrink-0">
                <MediaCardSkeleton />
              </div>
            ))
          : items.map((item) => (
              <div key={item.id} className="w-[155px] sm:w-[190px] md:w-[210px] shrink-0">
                <MediaCard media={item} />
              </div>
            ))}
      </div>
    </section>
  );
}
