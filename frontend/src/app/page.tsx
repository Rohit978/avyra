import React from "react";
import HeroShowcase from "../components/HeroShowcase";
import MediaCarousel from "../components/MediaCarousel";
import ContinueWatchingRow from "../components/ContinueWatchingRow";
import { getCuratedCollection } from "../lib/api";

export default async function HomePage() {
  const [trending, popularMovies, popularTv, anime, upcoming] = await Promise.all([
    getCuratedCollection("trending"),
    getCuratedCollection("popular", "MOVIE"),
    getCuratedCollection("popular", "TV_SHOW"),
    getCuratedCollection("popular", "ANIME"),
    getCuratedCollection("upcoming"),
  ]);

  const heroSlides = popularMovies.length > 0 ? popularMovies.slice(0, 5) : trending.slice(0, 5);

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Full-Bleed Multi-Slide Hero Showcase */}
      {heroSlides.length > 0 && <HeroShowcase items={heroSlides} />}

      {/* Curated Rows */}
      <div className="space-y-2 -mt-10 sm:-mt-14 relative z-20">
        <MediaCarousel
          title="Trending Now"
          items={trending}
          viewAllHref="/movies"
        />

        <ContinueWatchingRow fallbackItems={trending} />

        <MediaCarousel
          title="Popular Movies"
          items={popularMovies}
          viewAllHref="/movies"
        />

        <MediaCarousel
          title="Binge-Worthy TV Series"
          items={popularTv}
          viewAllHref="/tv"
        />

        {anime.length > 0 && (
          <MediaCarousel
            title="Top Anime"
            items={anime}
            viewAllHref="/anime"
          />
        )}

        <MediaCarousel
          title="Anticipated & Upcoming"
          items={upcoming}
          viewAllHref="/movies"
        />
      </div>
    </div>
  );
}
