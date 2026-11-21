import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MediaDetailClient from "./MediaDetailClient";
import {
  getMediaCredits,
  getMediaDetail,
  getMediaSeasons,
  getPlaybackOptions,
} from "../../../lib/api";

interface MediaPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ play?: string }>;
}

export async function generateMetadata({
  params,
}: MediaPageProps): Promise<Metadata> {
  const { id } = await params;
  const media = await getMediaDetail(id);

  if (!media) {
    return {
      title: "Media Not Found",
    };
  }

  const year = media.release_date ? ` (${media.release_date.slice(0, 4)})` : "";
  const typeLabel =
    (media.media_type as string) === "ANIME"
      ? "Anime"
      : media.media_type === "TV_SHOW"
      ? "TV Series"
      : "Movie";

  const title = `${media.title}${year} — Watch ${typeLabel} in HD`;
  const description =
    media.overview ||
    `Stream ${media.title} online in HD with cast details, trailer, and episode list on Avyra.`;
  const poster = media.backdrop_url || media.poster_url || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/media/${id}`,
    },
    openGraph: {
      title: `${title} | Avyra`,
      description,
      type: "video.movie",
      images: poster ? [{ url: poster, alt: media.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Avyra`,
      description,
      images: poster ? [poster] : [],
    },
  };
}

export default async function MediaDetailPage({
  params,
  searchParams,
}: MediaPageProps) {
  const { id } = await params;
  const sParams = await searchParams;
  const autoPlay = sParams.play === "true";

  const [media, credits, seasons, playback] = await Promise.all([
    getMediaDetail(id),
    getMediaCredits(id),
    getMediaSeasons(id),
    getPlaybackOptions(id),
  ]);

  if (!media) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type":
      media.media_type === "TV_SHOW" || (media.media_type as string) === "ANIME"
        ? "TVSeries"
        : "Movie",
    name: media.title,
    description: media.overview || undefined,
    image: media.poster_url || media.backdrop_url || undefined,
    datePublished: media.release_date || undefined,
    genre: media.genres || undefined,
    aggregateRating: media.vote_average
      ? {
          "@type": "AggregateRating",
          ratingValue: media.vote_average,
          bestRating: "10",
          worstRating: "1",
          ratingCount: media.vote_count || 100,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MediaDetailClient
        media={media}
        credits={credits}
        seasons={seasons}
        initialPlayback={playback}
        autoPlay={autoPlay}
      />
    </>
  );
}
