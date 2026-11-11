"use client";

import React, { useState } from "react";

export interface EmbedSource {
  id: string;
  name: string;
  embed_url: string;
  domain: string;
  is_primary: boolean;
}

export interface PlaybackOptions {
  media_id: string;
  media_type: string;
  title: string;
  has_stream: boolean;
  tmdb_id?: string | null;
  season_number?: number | null;
  episode_number?: number | null;
  embed_sources: EmbedSource[];
  sandbox_policy: string;
  referrer_policy: string;
  reason?: string | null;
}

interface PlayerProps {
  playback: PlaybackOptions;
}

export default function Player({ playback }: PlayerProps) {
  const [activeSourceId, setActiveSourceId] = useState<string>(() => {
    const primary = playback.embed_sources.find((s) => s.is_primary);
    return primary ? primary.id : playback.embed_sources[0]?.id || "";
  });

  const activeSource = playback.embed_sources.find(
    (s) => s.id === activeSourceId
  ) || playback.embed_sources[0];

  if (!playback.has_stream || !activeSource) {
    return (
      <div className="relative w-full aspect-video bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Stream Unavailable</h3>
        <p className="text-sm text-neutral-400 max-w-md">
          {playback.reason ||
            "No streaming embed provider is currently mapped for this title."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Stream Source Selector */}
      {playback.embed_sources.length > 1 && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs uppercase font-semibold tracking-wider text-neutral-400">
            Stream Server:
          </span>
          <div className="flex items-center gap-2">
            {playback.embed_sources.map((source) => (
              <button
                key={source.id}
                onClick={() => setActiveSourceId(source.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  activeSource.id === source.id
                    ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                {source.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video Embed */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
        <iframe
          src={activeSource.embed_url}
          title={`${playback.title} Player`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
          referrerPolicy="origin"
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
        />
      </div>
    </div>
  );
}
