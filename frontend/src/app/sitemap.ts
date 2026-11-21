import type { MetadataRoute } from "next";
import { getCuratedCollection } from "../lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://avyra-vert.vercel.app";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/movies`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tv`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/anime`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  try {
    const [trending, popMovies, popTv, popAnime] = await Promise.all([
      getCuratedCollection("trending").catch(() => []),
      getCuratedCollection("popular", "MOVIE").catch(() => []),
      getCuratedCollection("popular", "TV_SHOW").catch(() => []),
      getCuratedCollection("popular", "ANIME").catch(() => []),
    ]);

    const seen = new Set<string>();
    const mediaPages: MetadataRoute.Sitemap = [];

    for (const item of [...trending, ...popMovies, ...popTv, ...popAnime]) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        mediaPages.push({
          url: `${baseUrl}/media/${item.id}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }

    return [...staticPages, ...mediaPages];
  } catch {
    return staticPages;
  }
}
