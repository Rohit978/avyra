import React from "react";
import Link from "next/link";
import { MediaSummary } from "../lib/api";

interface HeroShowcaseProps {
  media: MediaSummary;
}

export default function HeroShowcase({ media }: HeroShowcaseProps) {
  const year = media.release_date ? media.release_date.slice(0, 4) : "";

  return (
    <div className="relative w-full h-[65vh] min-h-[460px] max-h-[680px] bg-neutral-950 overflow-hidden flex items-end">
      {/* Backdrop Image */}
      {media.backdrop_url && (
        <img
          src={media.backdrop_url}
          alt={media.title}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40 scale-105"
        />
      )}

      {/* Radial Vignette & Gradient Shadows */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full space-y-4">
        {/* Meta badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded-md shadow-md">
            Featured
          </span>
          {year && (
            <span className="text-xs text-neutral-300 font-medium bg-black/60 px-2.5 py-1 rounded-md border border-neutral-700/50">
              {year}
            </span>
          )}
          {media.vote_average > 0 && (
            <span className="text-xs text-amber-400 font-semibold bg-black/60 px-2.5 py-1 rounded-md border border-neutral-700/50 flex items-center gap-1">
              ★ {media.vote_average.toFixed(1)}
            </span>
          )}
          {media.genres.map((g) => (
            <span
              key={g}
              className="text-xs text-neutral-400 bg-surface-elevated/80 px-2 py-1 rounded-md border border-surface-border"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-3xl leading-tight">
          {media.title}
        </h1>

        {/* Overview */}
        {media.overview && (
          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl line-clamp-3 leading-relaxed">
            {media.overview}
          </p>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-4">
          <Link
            href={`/media/${media.id}?play=true`}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/25 hover:scale-105"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Now
          </Link>

          <Link
            href={`/media/${media.id}`}
            className="flex items-center gap-2 bg-surface-elevated/90 hover:bg-neutral-800 text-white font-semibold px-5 py-3 rounded-xl border border-surface-border transition-all hover:scale-105"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            More Info
          </Link>
        </div>
      </div>
    </div>
  );
}
