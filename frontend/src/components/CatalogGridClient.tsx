"use client";

import React, { useState } from "react";
import { browseMedia, MediaSummary } from "../lib/api";
import MediaCard from "./MediaCard";

interface CatalogGridClientProps {
  title: string;
  description: string;
  mediaType: "MOVIE" | "TV_SHOW" | "ANIME";
  initialItems: MediaSummary[];
}

const GENRES = [
  "All",
  "Action",
  "Sci-Fi",
  "Drama",
  "Thriller",
  "Comedy",
  "Crime",
  "Adventure",
  "Horror",
  "Fantasy",
  "Mystery",
  "Romance",
  "Animation",
];

export default function CatalogGridClient({
  title,
  description,
  mediaType,
  initialItems,
}: CatalogGridClientProps) {
  const [items, setItems] = useState<MediaSummary[]>(initialItems);
  const [page, setPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<"popularity" | "rating">("popularity");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchFiltered = async (
    nextSort: "popularity" | "rating",
    nextGenre: string
  ) => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    try {
      const res = await browseMedia({
        media_type: mediaType,
        sort_by: nextSort,
        genre: nextGenre === "All" ? undefined : nextGenre,
        page: 1,
        limit: 48,
      });
      setItems(res.items);
      setHasMore(res.items.length >= 20);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (nextSort: "popularity" | "rating") => {
    if (nextSort === sortBy) return;
    setSortBy(nextSort);
    fetchFiltered(nextSort, selectedGenre);
  };

  const handleGenreChange = (nextGenre: string) => {
    if (nextGenre === selectedGenre) return;
    setSelectedGenre(nextGenre);
    fetchFiltered(sortBy, nextGenre);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const res = await browseMedia({
        media_type: mediaType,
        sort_by: sortBy,
        genre: selectedGenre === "All" ? undefined : selectedGenre,
        page: nextPage,
        limit: 48,
      });

      if (res.items.length === 0) {
        setHasMore(false);
        return;
      }

      setItems((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const fresh = res.items.filter((m) => !seen.has(m.id));
        if (fresh.length === 0) {
          setHasMore(false);
          return prev;
        }
        return [...prev, ...fresh];
      });
      setPage(nextPage);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 space-y-8">
      {/* Header + Sort Controls */}
      <div className="border-b border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-amber-400 rounded-full" />
            {title}
          </h1>
          <p className="text-sm text-neutral-400 mt-1.5">{description}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => handleSortChange("popularity")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === "popularity"
                  ? "bg-primary text-white shadow-sm"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              🔥 Popular
            </button>
            <button
              onClick={() => handleSortChange("rating")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === "rating"
                  ? "bg-primary text-white shadow-sm"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              ★ Top Rated
            </button>
          </div>

          <div className="text-xs text-neutral-300 bg-white/[0.05] px-3.5 py-2 rounded-xl border border-white/[0.08] font-semibold">
            {items.length} titles loaded
          </div>
        </div>
      </div>

      {/* Genre Filter Strip */}
      {mediaType !== "ANIME" && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {GENRES.map((genre) => {
            const active = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => handleGenreChange(genre)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active
                    ? "bg-white text-black shadow-sm"
                    : "bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.09] border border-white/[0.07]"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {Array.from({ length: 18 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-[2/3] rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {items.map((item) => (
              <MediaCard key={item.id} media={item} />
            ))}
          </div>

          {/* Load More Pagination */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-rose-600 hover:from-primary-hover hover:to-rose-500 disabled:opacity-60 text-white font-bold text-sm shadow-[0_8px_30px_rgba(225,29,72,0.35)] transition-all hover:scale-[1.03] active:scale-95"
              >
                {loadingMore ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Loading more titles...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Titles</span>
                    <span>↓</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-20 text-center text-neutral-400">
          <p className="text-lg font-semibold text-white">No titles found</p>
          <p className="text-sm mt-1">Try switching genre or sort order.</p>
        </div>
      )}
    </div>
  );
}
