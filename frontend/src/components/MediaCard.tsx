"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MediaSummary } from "../lib/api";

interface MediaCardProps {
  media: MediaSummary;
}

export default function MediaCard({ media }: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const year = media.release_date ? media.release_date.slice(0, 4) : null;
  const animeMeta = media.anime_meta;

  return (
    <Link
      href={`/media/${media.id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-surface border border-white/[0.07] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-[0_0_28px_rgba(225,29,72,0.32)]"
    >
      {/* 2:3 Poster with fixed aspect ratio & explicit dimensions to prevent CLS */}
      <div className="relative w-full aspect-[2/3] bg-neutral-900 overflow-hidden">
        {media.poster_url && !imgError ? (
          <img
            src={media.poster_url}
            alt={media.title}
            width={300}
            height={450}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-neutral-500 bg-gradient-to-br from-neutral-900 to-neutral-950">
            <svg
              className="w-10 h-10 mb-2 opacity-40"
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
            <span className="text-xs font-medium text-neutral-400 truncate max-w-full px-2">
              {media.title}
            </span>
          </div>
        )}

        {/* Hover Dark Vignette + Play Circle */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d]/90 via-[#07080d]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.8)] scale-75 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Rating Badge: AniList Score (%) for Anime, IMDb Star Rating for Movies/TV */}
        {animeMeta?.anilist_score ? (
          <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md border border-cyan-400/30 rounded-lg px-2 py-0.5 text-[11px] font-extrabold text-cyan-300 flex items-center gap-1 shadow-md">
            <span>AL</span>
            <span>{animeMeta.anilist_score}%</span>
          </div>
        ) : media.vote_average > 0 ? (
          <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg px-2 py-0.5 text-[11px] font-bold text-amber-400 flex items-center gap-1 shadow-md">
            <span>★</span>
            <span>{media.vote_average.toFixed(1)}</span>
          </div>
        ) : null}

        {/* Media Type / Sub-Dub Pill */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
          <span className="bg-primary/90 backdrop-blur-md rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md">
            {media.media_type === "TV_SHOW"
              ? "TV"
              : media.media_type === "MOVIE"
              ? "FILM"
              : "ANIME"}
          </span>
          {animeMeta?.sub_dub && (
            <span className="bg-black/75 backdrop-blur-md border border-white/15 rounded-lg px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 shadow-md">
              {animeMeta.sub_dub}
            </span>
          )}
        </div>

        {/* Bottom Episode Count Pill on Poster for Anime */}
        {animeMeta?.episodes && (
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-md px-2 py-0.5 text-[10px] font-bold text-neutral-200">
            {animeMeta.episodes} EPS
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-surface to-[#0a0c12]">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition-colors">
          {media.title}
        </h3>
        <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400 font-medium">
          <span>{animeMeta?.season || year || "TBA"}</span>
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
