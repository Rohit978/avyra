"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MediaSummary } from "../../lib/api";
import MediaCard from "../../components/MediaCard";
import {
  AUTH_EVENT,
  getCurrentUser,
  getWatchlist,
  pullAccountSync,
  saveWatchlist,
  SYNC_EVENT,
} from "../../lib/sync";

export default function WatchlistPage() {
  const [items, setItems] = useState<MediaSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setItems(getWatchlist());
      setUserEmail(getCurrentUser()?.email || null);
      setLoaded(true);
    };

    refresh();
    pullAccountSync();

    window.addEventListener(SYNC_EVENT, refresh);
    window.addEventListener(AUTH_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SYNC_EVENT, refresh);
      window.removeEventListener(AUTH_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const clearList = () => {
    saveWatchlist([]);
    setItems([]);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 min-h-[75vh]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-amber-400 rounded-full" />
            My List
          </h1>
          <p className="text-sm text-neutral-400 mt-1 flex items-center gap-2">
            <span>Your saved movies, TV series, and anime ready to watch anytime.</span>
            {userEmail && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Synced to {userEmail}
              </span>
            )}
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearList}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            Clear List
          </button>
        )}
      </div>

      {!loaded ? (
        <div className="text-sm text-neutral-400">Loading your list...</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-surface border border-white/[0.08] p-12 text-center max-w-lg mx-auto mt-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-neutral-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Your list is empty</h2>
          <p className="text-sm text-neutral-400">
            Tap <strong>+ My List</strong> or <strong>Add to Watchlist</strong> on any movie, series, or anime to bookmark it here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
          >
            Explore Catalog &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {items.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      )}
    </div>
  );
}
