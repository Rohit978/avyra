"use client";

import React, { useState } from "react";
import Player, { PlaybackOptions } from "../../../components/Player";
import { CastMember, CrewMember, MediaDetail, SeasonDetail } from "../../../lib/api";

interface MediaDetailClientProps {
  media: MediaDetail;
  credits: { cast: CastMember[]; crew: CrewMember[] };
  seasons: SeasonDetail[];
  initialPlayback: PlaybackOptions;
  autoPlay?: boolean;
}

export default function MediaDetailClient({
  media,
  credits,
  seasons,
  initialPlayback,
  autoPlay = false,
}: MediaDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "cast" | "episodes" | "watch">(
    autoPlay ? "watch" : "overview"
  );

  const isEpisodic = media.media_type === "TV_SHOW" || media.media_type === "ANIME";

  // Provide fallback season & episodes if a web series has empty seasons array or empty season.episodes
  const rawSeasons: SeasonDetail[] =
    seasons.length > 0
      ? seasons
      : isEpisodic
      ? [
          {
            id: "fallback-s1",
            season_number: 1,
            title: "Season 1",
            overview: null,
            poster_path: null,
            air_date: null,
            episode_count: media.episode_count || 12,
            episodes: [],
          },
        ]
      : [];

  const effectiveSeasons: SeasonDetail[] = rawSeasons.map((s) => {
    const epCount = Math.max(
      s.episodes?.length || 0,
      s.episode_count || 0,
      media.episode_count || 0,
      12
    );
    const resolvedEpisodes =
      s.episodes && s.episodes.length > 0
        ? s.episodes
        : Array.from({ length: epCount }, (_, i) => ({
            id: `ep-${s.season_number}-${i + 1}`,
            season_id: s.id || `s-${s.season_number}`,
            media_id: media.id,
            episode_number: i + 1,
            title: `Episode ${i + 1}`,
            overview: null,
            still_path: null,
            air_date: null,
            runtime: null,
          }));
    return {
      ...s,
      episode_count: Math.max(s.episode_count || 0, resolvedEpisodes.length),
      episodes: resolvedEpisodes,
    };
  });

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    initialPlayback.season_number || effectiveSeasons[0]?.season_number || 1
  );
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number>(
    initialPlayback.episode_number || 1
  );
  const [currentPlayback, setCurrentPlayback] = useState<PlaybackOptions>(initialPlayback);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const currentSeason =
    effectiveSeasons.find((s) => s.season_number === selectedSeasonNumber) ||
    effectiveSeasons[0];

  const currentEpisodes = currentSeason?.episodes || [];

  const validEpisodeNumber = Math.min(
    Math.max(selectedEpisodeNumber, 1),
    Math.max(currentEpisodes.length, 1)
  );

  const updatePlaybackEpisode = (sNum: number, epNum: number) => {
    setSelectedSeasonNumber(sNum);
    setSelectedEpisodeNumber(epNum);

    const tmdbId =
      media.provenance.find((p) => p.provider === "tmdb")?.external_id ||
      currentPlayback.tmdb_id ||
      "693134";

    setCurrentPlayback({
      ...currentPlayback,
      has_stream: true,
      reason: null,
      season_number: sNum,
      episode_number: epNum,
      embed_sources: [
        {
          id: "vidbolt-tv",
          name: "Server 1",
          embed_url: `https://vidbolt.xyz/tv/${tmdbId}/${sNum}/${epNum}`,
          domain: "vidbolt.xyz",
          is_primary: true,
        },
        {
          id: "reelsdownload",
          name: "Server 2",
          embed_url: `https://embed.reelsdownload.online/player/${tmdbId}?key=k_5661ac637169a1733857dc50&s=${sNum}&e=${epNum}`,
          domain: "embed.reelsdownload.online",
          is_primary: false,
        },
        {
          id: "vidsrc",
          name: "Server 3",
          embed_url: `https://vidsrc.to/embed/tv/${tmdbId}/${sNum}/${epNum}`,
          domain: "vidsrc.to",
          is_primary: false,
        },
      ],
    });
    setActiveTab("watch");
  };

  const handlePrevEpisode = () => {
    if (selectedEpisodeNumber > 1) {
      updatePlaybackEpisode(selectedSeasonNumber, selectedEpisodeNumber - 1);
    }
  };

  const handleNextEpisode = () => {
    const maxEp = currentEpisodes.length || 24;
    if (selectedEpisodeNumber < maxEp) {
      updatePlaybackEpisode(selectedSeasonNumber, selectedEpisodeNumber + 1);
    } else {
      const nextSeason = effectiveSeasons.find(
        (s) => s.season_number === selectedSeasonNumber + 1
      );
      if (nextSeason) {
        updatePlaybackEpisode(selectedSeasonNumber + 1, 1);
      }
    }
  };

  return (
    <div className="w-full pb-20">
      {/* Top Banner / Backdrop */}
      <div className="relative w-full h-[45vh] min-h-[340px] bg-neutral-950 overflow-hidden flex items-end">
        {media.backdrop_url && (
          <img
            src={media.backdrop_url}
            alt={media.title}
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full flex flex-col md:flex-row gap-6 items-end">
          {/* Poster */}
          <div className="w-36 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-surface-border flex-shrink-0 hidden md:block bg-neutral-900">
            {media.poster_url && (
              <img src={media.poster_url} alt={media.title} className="w-full h-full object-cover" />
            )}
          </div>

          {/* Title Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-primary px-2.5 py-0.5 rounded text-xs font-bold uppercase text-white">
                {media.media_type}
              </span>
              {media.release_date && (
                <span className="text-xs text-neutral-400">
                  {media.release_date.slice(0, 4)}
                </span>
              )}
              {media.vote_average > 0 && (
                <span className="text-xs text-amber-400 font-bold bg-black/60 px-2 py-0.5 rounded border border-neutral-800">
                  ★ {media.vote_average.toFixed(1)}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              {media.title}
            </h1>

            {media.original_title && media.original_title !== media.title && (
              <p className="text-xs text-neutral-400 italic">
                Original Title: {media.original_title}
              </p>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab("watch")}
                className="bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Now
              </button>

              <button
                onClick={() => setIsInWatchlist(!isInWatchlist)}
                className={`text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                  isInWatchlist
                    ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                    : "bg-surface-elevated hover:bg-neutral-800 border-surface-border text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isInWatchlist ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"}
                  />
                </svg>
                {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content & Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Tab Controls */}
        <div className="flex items-center gap-6 border-b border-surface-border pb-3 mb-8 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 transition-colors ${
              activeTab === "overview"
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab("watch")}
            className={`pb-3 transition-colors flex items-center gap-1.5 ${
              activeTab === "watch"
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Watch / Player
          </button>

          {isEpisodic && (
            <button
              onClick={() => setActiveTab("episodes")}
              className={`pb-3 transition-colors ${
                activeTab === "episodes"
                  ? "text-primary border-b-2 border-primary font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Episodes
            </button>
          )}

          <button
            onClick={() => setActiveTab("cast")}
            className={`pb-3 transition-colors ${
              activeTab === "cast"
                ? "text-primary border-b-2 border-primary font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Cast &amp; Crew
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Synopsis</h3>
                <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                  {media.overview || "No synopsis available for this title."}
                </p>
              </div>

              {media.genres.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider mb-2">
                    Genres
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {media.genres.map((g) => (
                      <span
                        key={g}
                        className="bg-surface-elevated text-neutral-300 text-xs px-3 py-1 rounded-full border border-surface-border"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Meta */}
            <div className="bg-surface-elevated border border-surface-border rounded-xl p-5 space-y-4 text-xs">
              <h4 className="text-sm font-bold text-white border-b border-surface-border pb-2">
                Title Details
              </h4>
              <div className="space-y-2.5 text-neutral-300">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status</span>
                  <span>{media.status}</span>
                </div>
                {media.runtime && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Runtime</span>
                    <span>{media.runtime} mins</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-500">Language</span>
                  <span>{media.original_language?.toUpperCase() || "N/A"}</span>
                </div>
                {media.season_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Seasons</span>
                    <span>{media.season_count}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Player */}
        {activeTab === "watch" && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Episodic Dropdown Controls for Webseries & Anime */}
            {isEpisodic && (
              <div className="bg-surface-elevated/90 backdrop-blur border border-surface-border rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Season Dropdown */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="watch-season-select"
                      className="text-xs uppercase font-bold text-neutral-400"
                    >
                      Season:
                    </label>
                    <select
                      id="watch-season-select"
                      value={selectedSeasonNumber}
                      onChange={(e) => {
                        const newSeasonNum = parseInt(e.target.value, 10);
                        updatePlaybackEpisode(newSeasonNum, 1);
                      }}
                      className="bg-neutral-900 text-sm font-semibold text-white border border-neutral-700 hover:border-primary rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                    >
                      {effectiveSeasons.map((s) => (
                        <option key={s.season_number} value={s.season_number}>
                          Season {s.season_number} ({s.episode_count || s.episodes.length} eps)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Episode Dropdown */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="watch-episode-select"
                      className="text-xs uppercase font-bold text-neutral-400"
                    >
                      Episode:
                    </label>
                    <select
                      id="watch-episode-select"
                      value={validEpisodeNumber}
                      onChange={(e) => {
                        const newEpNum = parseInt(e.target.value, 10);
                        updatePlaybackEpisode(selectedSeasonNumber, newEpNum);
                      }}
                      className="bg-neutral-900 text-sm font-semibold text-white border border-neutral-700 hover:border-primary rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer min-w-[150px] max-w-[280px] truncate"
                    >
                      {currentEpisodes.map((ep) => (
                        <option key={ep.episode_number} value={ep.episode_number}>
                          Ep {ep.episode_number}{ep.title ? `: ${ep.title}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Quick Prev / Next Episode Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevEpisode}
                    disabled={selectedEpisodeNumber <= 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 disabled:opacity-35 disabled:hover:bg-neutral-800 text-white transition-colors flex items-center gap-1 border border-neutral-700 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                    Prev
                  </button>

                  <button
                    onClick={handleNextEpisode}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-all shadow-md shadow-primary/25 flex items-center gap-1 cursor-pointer"
                  >
                    Next
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <Player playback={currentPlayback} />
          </div>
        )}

        {/* Tab 3: Episodes */}
        {activeTab === "episodes" && isEpisodic && (
          <div className="space-y-6">
            {/* Season Selector & Episode Dropdown Bar */}
            <div className="bg-surface-elevated/70 border border-surface-border rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase">Season:</span>
                  <select
                    value={selectedSeasonNumber}
                    onChange={(e) => {
                      const newSeasonNum = parseInt(e.target.value, 10);
                      updatePlaybackEpisode(newSeasonNum, 1);
                    }}
                    className="bg-neutral-900 text-sm font-semibold text-white border border-neutral-700 hover:border-primary rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                  >
                    {effectiveSeasons.map((s) => (
                      <option key={s.season_number} value={s.season_number}>
                        Season {s.season_number} ({s.episode_count || s.episodes.length} eps)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-400 uppercase">Jump to Episode:</span>
                  <select
                    value={validEpisodeNumber}
                    onChange={(e) => {
                      const newEpNum = parseInt(e.target.value, 10);
                      updatePlaybackEpisode(selectedSeasonNumber, newEpNum);
                    }}
                    className="bg-neutral-900 text-sm font-semibold text-white border border-neutral-700 hover:border-primary rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer min-w-[150px] max-w-[280px] truncate"
                  >
                    {currentEpisodes.map((ep) => (
                      <option key={ep.episode_number} value={ep.episode_number}>
                        Ep {ep.episode_number}{ep.title ? `: ${ep.title}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("watch")}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Resume Episode {selectedEpisodeNumber}
              </button>
            </div>

            {/* Episode List */}
            <div className="space-y-3">
              {currentEpisodes.map((ep) => (
                <div
                  key={ep.id}
                  className={`border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                    ep.episode_number === selectedEpisodeNumber
                      ? "bg-primary/10 border-primary/40"
                      : "bg-surface-elevated border-surface-border hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xl font-black w-8 text-center ${
                        ep.episode_number === selectedEpisodeNumber
                          ? "text-primary"
                          : "text-neutral-500"
                      }`}
                    >
                      {ep.episode_number}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        {ep.title || `Episode ${ep.episode_number}`}
                        {ep.episode_number === selectedEpisodeNumber && (
                          <span className="text-[10px] bg-primary text-white font-bold px-1.5 py-0.5 rounded">
                            Playing
                          </span>
                        )}
                      </h4>
                      {ep.overview && (
                        <p className="text-xs text-neutral-400 line-clamp-1 max-w-xl mt-0.5">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => updatePlaybackEpisode(selectedSeasonNumber, ep.episode_number)}
                    className="bg-primary/90 hover:bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Cast */}
        {activeTab === "cast" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Cast</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {credits.cast.map((c) => (
                  <div key={c.id} className="bg-surface-elevated border border-surface-border rounded-xl p-3 text-center space-y-2">
                    <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-neutral-800">
                      {c.profile_path ? (
                        <img src={c.profile_path} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                          N/A
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-white truncate">{c.name}</h5>
                      <p className="text-[11px] text-neutral-400 truncate">{c.character_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
