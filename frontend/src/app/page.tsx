import React from "react";
import HeroShowcase from "../components/HeroShowcase";
import MediaCarousel from "../components/MediaCarousel";
import { getCuratedCollection } from "../lib/api";

export default async function HomePage() {
  const [trending, popularMovies, popularTv, upcoming] = await Promise.all([
    getCuratedCollection("trending"),
    getCuratedCollection("popular", "MOVIE"),
    getCuratedCollection("popular", "TV_SHOW"),
    getCuratedCollection("upcoming"),
  ]);

  const heroItem = popularMovies[0] || trending[0];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Hero Banner */}
      {heroItem && <HeroShowcase media={heroItem} />}

      {/* Media Carousels */}
      <div className="space-y-4 -mt-6 sm:-mt-10 relative z-20">
        <MediaCarousel
          title="Trending Now"
          items={trending}
          viewAllHref="/movies"
        />

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

        <MediaCarousel
          title="Anticipated & Upcoming"
          items={upcoming}
          viewAllHref="/movies"
        />
      </div>
    </div>
  );
}
