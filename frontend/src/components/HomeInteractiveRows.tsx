"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MediaSummary } from "../lib/api";
import MediaCarousel from "./MediaCarousel";
import TopTenRow from "./TopTenRow";
import ContinueWatchingRow from "./ContinueWatchingRow";

interface HomeInteractiveRowsProps {
  top10Items: MediaSummary[];
  trending: MediaSummary[];
  topRatedMovies: MediaSummary[];
  topRatedTv: MediaSummary[];
  popularMovies: MediaSummary[];
  popularTv: MediaSummary[];
  anime: MediaSummary[];
}

const FILTER_PILLS = [
  { id: "ALL", label: "All" },
  { id: "TOP8", label: "8.0+ Acclaimed" },
  { id: "Sci-Fi", label: "Sci-Fi" },
  { id: "Action", label: "Action" },
  { id: "Drama", label: "Drama" },
  { id: "Thriller", label: "Thriller" },
  { id: "Comedy", label: "Comedy" },
  { id: "Animation", label: "Animation" },
];

export default function HomeInteractiveRows({
  top10Items,
  trending,
  topRatedMovies,
  topRatedTv,
  popularMovies,
  popularTv,
  anime,
}: HomeInteractiveRowsProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [shuffling, setShuffling] = useState(false);

  const filterList = (list: MediaSummary[]) => {
    if (activeFilter === "ALL") return list;
    if (activeFilter === "TOP8") {
      return list.filter((m) => m.vote_average >= 8.0);
    }
    const lower = activeFilter.toLowerCase();
    return list.filter((m) =>
      m.genres.some((g) => g.toLowerCase().includes(lower))
    );
  };

  const filteredTrending = useMemo(() => filterList(trending), [trending, activeFilter]);
  const filteredTopMovies = useMemo(() => filterList(topRatedMovies), [topRatedMovies, activeFilter]);
  const filteredTopTv = useMemo(() => filterList(topRatedTv), [topRatedTv, activeFilter]);
  const filteredPopMovies = useMemo(() => filterList(popularMovies), [popularMovies, activeFilter]);
  const filteredPopTv = useMemo(() => filterList(popularTv), [popularTv, activeFilter]);
  const filteredAnime = useMemo(() => filterList(anime), [anime, activeFilter]);

  const handleSurpriseMe = () => {
    const pool = [...topRatedMovies, ...top10Items, ...topRatedTv].filter(
      (m) => m.vote_average >= 7.5
    );
    if (pool.length === 0) return;
    setShuffling(true);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => {
      setShuffling(false);
      router.push(`/media/${pick.id}`);
    }, 300);
  };

  return (
    <div className="space-y-2 -mt-10 sm:-mt-14 relative z-20">
      {/* Interactive Genre / Mood Filter Strip + Surprise Me */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap bg-[#0d0f18]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-2.5 shadow-xl">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {FILTER_PILLS.map((pill) => {
              const active = activeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveFilter(pill.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-primary text-white shadow-[0_0_16px_rgba(225,29,72,0.5)]"
                      : "bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.09] border border-white/[0.06]"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSurpriseMe}
            disabled={shuffling}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-primary/20 hover:from-amber-500/35 hover:to-primary/35 border border-amber-400/35 text-xs font-extrabold text-amber-200 transition-all hover:scale-[1.03] active:scale-95"
          >
            <svg
              className={`w-3.5 h-3.5 ${shuffling ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
              />
            </svg>
            <span>{shuffling ? "Picking..." : "Surprise Me"}</span>
          </button>
        </div>
      </div>

      {/* Top 10 Today Numbered Showcase (Distinct from Trending row below) */}
      {activeFilter === "ALL" && <TopTenRow title="Top 10 Today" items={top10Items} />}

      {/* Continue Watching */}
      {activeFilter === "ALL" && <ContinueWatchingRow fallbackItems={top10Items} />}

      {/* Top Rated Movies */}
      {filteredTopMovies.length > 0 && (
        <MediaCarousel
          title="Critically Acclaimed Films"
          items={filteredTopMovies}
          viewAllHref="/movies"
        />
      )}

      {/* Trending Now (Mixes Movies & Series — no misleading /movies See All link; distinct from Top 10) */}
      {filteredTrending.length > 0 && (
        <MediaCarousel
          title={activeFilter === "ALL" ? "Trending Across Film & TV" : `Trending • ${activeFilter}`}
          items={filteredTrending}
        />
      )}

      {/* Top Anime (Powered by AniList with Sub/Dub, Episode Count, Season & AL Score) */}
      {filteredAnime.length > 0 && (
        <MediaCarousel
          title="Trending Anime (Sub & Dub)"
          items={filteredAnime}
          viewAllHref="/anime"
        />
      )}

      {/* Top Rated TV Series */}
      {filteredTopTv.length > 0 && (
        <MediaCarousel
          title="Top Rated TV Series"
          items={filteredTopTv}
          viewAllHref="/tv"
        />
      )}

      {/* Popular Movies (Deduplicated against Top 10, Trending, and Acclaimed) */}
      {filteredPopMovies.length > 0 && (
        <MediaCarousel
          title="Popular Movies"
          items={filteredPopMovies}
          viewAllHref="/movies"
        />
      )}

      {/* Binge-Worthy TV Series */}
      {filteredPopTv.length > 0 && (
        <MediaCarousel
          title="Popular TV Series"
          items={filteredPopTv}
          viewAllHref="/tv"
        />
      )}
    </div>
  );
}
