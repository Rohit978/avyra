import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-surface border-t border-surface-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <span className="text-xl font-black tracking-tight text-white">
              CINE<span className="text-primary">VERSE</span>
            </span>
            <p className="text-sm text-gray-400">
              Unified multi-source media discovery, catalogue browsing, and playback integration.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">
                  Popular Movies
                </Link>
              </li>
              <li>
                <Link href="/tv" className="hover:text-white transition-colors">
                  TV Series
                </Link>
              </li>
              <li>
                <Link href="/anime" className="hover:text-white transition-colors">
                  Anime Seasons
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-white transition-colors">
                  Catalogue Search
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              Data &amp; Provenance
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              This product uses the TMDB API and AniList GraphQL API but is not endorsed or certified by TMDB or AniList. Video streaming embeds are routed through allowlisted third-party players.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-3">
              Platform Status
            </h4>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-full px-3 py-1.5 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              API Operational
            </div>
          </div>
        </div>

        <div className="border-t border-surface-border pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Cineverse. Built with Next.js 15, FastAPI &amp; PostgreSQL.</p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span>Dark Cinematic Edition</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
