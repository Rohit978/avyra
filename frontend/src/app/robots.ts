import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://avyra-vert.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/signin", "/watchlist"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
