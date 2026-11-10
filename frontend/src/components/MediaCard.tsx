import React from "react";
import Link from "next/link";
import { MediaSummary } from "../lib/api";

interface MediaCardProps {
  media: MediaSummary;
}

export default function MediaCard({ media }: MediaCardProps) {
  const year = media.release_date ? media.release_date.slice(0, 4) : null;

  return (
    <Link
      href={`/media/${media.id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-surface-elevated border border-surface-border transition-all duration-300 hover:scale-[1.03] hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* Poster */}
      <div className="relative w-full aspect-[2/3] bg-neutral-900 overflow-hidden">
        {media.poster_url ? (
          <img
            src={media.poster_url}
            alt={media.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-neutral-500">
            <svg
              className="w-10 h-10 mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              />
            </svg>
            <span className="text-xs">No Poster</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating Badge */}
        {media.vote_average > 0 && (
          <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md border border-neutral-700/50 rounded-md px-2 py-0.5 text-xs font-bold text-amber-400 flex items-center gap-1 shadow-md">
            <span>★</span>
            <span>{media.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Media Type Pill */}
        <div className="absolute top-2.5 left-2.5 bg-primary/90 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
          {media.media_type === "TV_SHOW"
            ? "TV"
            : media.media_type === "MOVIE"
            ? "Film"
            : media.media_type}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
          {media.title}
        </h3>
        <div className="flex items-center justify-between mt-1 text-xs text-neutral-400">
          <span>{year || "TBA"}</span>
          {media.genres.length > 0 && (
            <span className="truncate max-w-[100px] text-neutral-500">
              {media.genres[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
