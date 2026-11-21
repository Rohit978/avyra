import React from "react";
import HeroShowcase from "../components/HeroShowcase";
import HomeInteractiveRows from "../components/HomeInteractiveRows";
import { getCuratedCollection, getMediaDetail, MediaSummary } from "../lib/api";

// Revalidate homepage live every 30 minutes
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
    topRatedMovies.length > 0
      ? topRatedMovies
      : popularMovies.length > 0
      ? popularMovies
      : trending
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

  // Deduplicate rows & cap each row to 12 posters (~60 total posters on homepage for fast mobile performance)
  const top10Items = trending.slice(0, 10);
  const top10Ids = new Set(top10Items.map((i) => i.id));

  const dedupe = (list: MediaSummary[], exclude: Set<string>, limit = 12) => {
    const out: MediaSummary[] = [];
    for (const item of list) {
      if (!exclude.has(item.id)) {
        out.push(item);
        exclude.add(item.id);
        if (out.length >= limit) break;
      }
    }
    return out;
  };

  const seenMovies = new Set<string>(top10Ids);
  const seenTv = new Set<string>(top10Ids);

  const distinctTrending = trending.filter((i) => !top10Ids.has(i.id)).slice(0, 12);
  distinctTrending.forEach((i) => {
    seenMovies.add(i.id);
    seenTv.add(i.id);
  });

  const distinctTopMovies = dedupe(topRatedMovies, seenMovies, 12);
  const distinctPopMovies = dedupe(popularMovies, seenMovies, 12);
  const distinctTopTv = dedupe(topRatedTv, seenTv, 12);
  const distinctPopTv = dedupe(popularTv, seenTv, 12);
  const distinctAnime = anime.slice(0, 12);

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Accessible Site/Page H1 for SEO & Screen Readers */}
      <h1 className="sr-only">
        Avyra — Watch Movies, TV Series, and Sub/Dub Anime Online in HD
      </h1>

      {/* Full-Bleed Multi-Slide Hero Showcase */}
      {heroSlides.length > 0 && <HeroShowcase items={heroSlides} />}

      {/* Deduplicated Interactive Rows */}
      <HomeInteractiveRows
        top10Items={top10Items}
        trending={distinctTrending}
        topRatedMovies={distinctTopMovies}
        topRatedTv={distinctTopTv}
        popularMovies={distinctPopMovies}
        popularTv={distinctPopTv}
        anime={distinctAnime}
      />
    </div>
  );
}
