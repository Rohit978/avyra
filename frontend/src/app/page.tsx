import React from "react";
import HeroShowcase from "../components/HeroShowcase";
import HomeInteractiveRows from "../components/HomeInteractiveRows";
import { getCuratedCollection, getMediaDetail } from "../lib/api";

// Revalidate homepage live every 30 minutes for fresh high-rated & trending releases
export const revalidate = 1800;

export default async function HomePage() {
  const [trending, topRatedMovies, topRatedTv, popularMovies, popularTv, anime] =
    await Promise.all([
      getCuratedCollection("trending"),
      getCuratedCollection("top-rated", "MOVIE"),
      getCuratedCollection("top-rated", "TV_SHOW"),
      getCuratedCollection("popular", "MOVIE"),
      getCuratedCollection("popular", "TV_SHOW"),
      getCuratedCollection("popular", "ANIME"),
    ]);

  const rawHeroSlides = (
    topRatedMovies.length > 0 ? topRatedMovies : popularMovies.length > 0 ? popularMovies : trending
  ).slice(0, 5);

  // Enrich top 5 hero slides with live YouTube trailer keys when available
  const heroSlides = await Promise.all(
    rawHeroSlides.map(async (item) => {
      if (item.trailer_key || !item.id.startsWith("tt")) return item;
      try {
        const detail = await getMediaDetail(item.id);
        return detail?.trailer_key
          ? { ...item, trailer_key: detail.trailer_key }
          : item;
      } catch {
        return item;
      }
    })
  );

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Full-Bleed Multi-Slide Hero Showcase with Dynamic Accent Lighting & Trailers */}
      {heroSlides.length > 0 && <HeroShowcase items={heroSlides} />}

      {/* Interactive Filters, Surprise Me, Top 10, Continue Watching & Live Carousels */}
      <HomeInteractiveRows
        trending={trending}
        topRatedMovies={topRatedMovies}
        topRatedTv={topRatedTv}
        popularMovies={popularMovies}
        popularTv={popularTv}
        anime={anime}
      />
    </div>
  );
}
