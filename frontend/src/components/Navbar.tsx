"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSearchSuggestions, SearchSuggestion } from "../lib/api";

export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced live autocomplete lookup (<300ms response)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await getSearchSuggestions(searchQuery.trim());
      setSuggestions(results);
      setIsOpen(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-black tracking-tight text-white group-hover:opacity-90 transition-opacity">
              CINE<span className="text-primary">VERSE</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link
              href="/"
              className="hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/movies"
              className="hover:text-white transition-colors"
            >
              Movies
            </Link>
            <Link
              href="/tv"
              className="hover:text-white transition-colors"
            >
              TV Series
            </Link>
            <Link
              href="/anime"
              className="hover:text-white transition-colors"
            >
              Anime
            </Link>
          </nav>
        </div>

        {/* Search & Profile */}
        <div className="flex items-center gap-4 flex-1 max-w-md justify-end">
          <div ref={dropdownRef} className="relative w-full max-w-xs">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, actors, anime..."
                  className="w-full bg-surface-elevated text-sm text-white placeholder-gray-400 rounded-full pl-9 pr-4 py-1.5 border border-surface-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </form>

            {/* Suggestions Popover */}
            {isOpen && suggestions.length > 0 && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-surface-elevated border border-surface-border rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-2 border-b border-surface-border text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Quick Suggestions
                </div>
                <div className="divide-y divide-surface-border max-h-80 overflow-y-auto">
                  {suggestions.map((item) => (
                    <Link
                      key={item.id}
                      href={`/media/${item.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-2.5 hover:bg-surface transition-colors"
                    >
                      <div className="w-10 h-14 bg-neutral-800 rounded overflow-hidden flex-shrink-0">
                        {item.poster_url ? (
                          <img
                            src={item.poster_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                            N/A
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                          <span className="capitalize">{item.media_type.toLowerCase()}</span>
                          {item.release_date && (
                            <span>• {item.release_date.slice(0, 4)}</span>
                          )}
                          {item.vote_average > 0 && (
                            <span className="text-amber-400 font-medium">
                              ★ {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <button
                  onClick={handleSearchSubmit}
                  className="w-full text-center py-2 text-xs font-semibold text-primary hover:bg-surface border-t border-surface-border transition-colors"
                >
                  View all results for &quot;{searchQuery}&quot;
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface-elevated border-b border-surface-border px-4 py-3 space-y-2">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 text-sm font-medium text-gray-300 hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/movies"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 text-sm font-medium text-gray-300 hover:text-white"
          >
            Movies
          </Link>
          <Link
            href="/tv"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 text-sm font-medium text-gray-300 hover:text-white"
          >
            TV Series
          </Link>
          <Link
            href="/anime"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-1.5 text-sm font-medium text-gray-300 hover:text-white"
          >
            Anime
          </Link>
        </div>
      )}
    </header>
  );
}
