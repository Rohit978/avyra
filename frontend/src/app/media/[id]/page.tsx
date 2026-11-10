import React from "react";
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

  return (
    <MediaDetailClient
      media={media}
      credits={credits}
      seasons={seasons}
      initialPlayback={playback}
      autoPlay={autoPlay}
    />
  );
}
