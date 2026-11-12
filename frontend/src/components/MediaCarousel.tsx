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
      const scrollAmount = direction === "left" ? -600 : 600;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full my-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full inline-block" />
          {title}
        </h2>

        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              See All &rarr;
            </Link>
          )}

          {/* Slider Buttons */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="p-1.5 rounded-full bg-surface-elevated border border-surface-border hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="p-1.5 rounded-full bg-surface-elevated border border-surface-border hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
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
        className="flex gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 pb-4 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="w-[150px] sm:w-[185px] md:w-[210px] shrink-0">
                <MediaCardSkeleton />
              </div>
            ))
          : items.map((item) => (
              <div key={item.id} className="w-[150px] sm:w-[185px] md:w-[210px] shrink-0">
                <MediaCard media={item} />
              </div>
            ))}
      </div>
    </section>
  );
}
