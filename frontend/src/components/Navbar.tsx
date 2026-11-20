"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSearchSuggestions, SearchSuggestion } from "../lib/api";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/tv", label: "TV Series" },
  { href: "/anime", label: "Anime" },
  { href: "/watchlist", label: "My List" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Debounced live autocomplete lookup
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
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-6 pt-3 pointer-events-none">
      <div
        className={`pointer-events-auto max-w-[1440px] mx-auto rounded-2xl border transition-all duration-300 ${
          scrolled
            ? "bg-[#0a0b12]/85 backdrop-blur-2xl border-white/[0.12] shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
            : "bg-[#0a0b12]/55 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
        }`}
      >
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              CINE
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-rose-400">
                VERSE
              </span>
            </span>
          </Link>

          {/* Centered Glass Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/[0.06]">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Search & Arcade Pill */}
          <div className="flex items-center gap-2.5 flex-1 lg:flex-initial justify-end max-w-md">
            {/* Search Pill */}
            <div ref={dropdownRef} className="relative w-full max-w-[260px]">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles, actors, anime..."
                    className="w-full bg-white/[0.06] hover:bg-white/[0.09] focus:bg-[#12141f] text-xs sm:text-sm text-white placeholder-neutral-400 rounded-full pl-9 pr-4 py-2 border border-white/[0.09] focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/50 transition-all"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400"
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
                <div className="absolute right-0 top-full mt-2.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-[#10121c]/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    Quick Suggestions
                  </div>
                  <div className="divide-y divide-white/[0.06] max-h-80 overflow-y-auto">
                    {suggestions.map((item) => (
                      <Link
                        key={item.id}
                        href={`/media/${item.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-2.5 hover:bg-white/[0.05] transition-colors"
                      >
                        <div className="w-10 h-14 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0">
                          {item.poster_url ? (
                            <img
                              src={item.poster_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-500">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                            <span className="capitalize">
                              {item.media_type.replace("_", " ").toLowerCase()}
                            </span>
                            {item.release_date && (
                              <span>• {item.release_date.slice(0, 4)}</span>
                            )}
                            {item.vote_average > 0 && (
                              <span className="text-amber-400 font-semibold">
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
                    className="w-full text-center py-2.5 text-xs font-bold text-primary hover:bg-white/[0.05] border-t border-white/[0.08] transition-colors"
                  >
                    View all results for &quot;{searchQuery}&quot;
                  </button>
                </div>
              )}
            </div>

            {/* Glowing Arcade Button */}
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-cineverse-game"))
              }
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-primary/20 via-rose-500/20 to-amber-500/20 hover:from-primary/35 hover:to-amber-500/35 text-xs font-bold text-white border border-rose-500/40 shadow-[0_0_20px_rgba(225,29,72,0.25)] transition-all hover:scale-105 active:scale-95"
              title="Play Popcorn Catcher Arcade Mini-Game"
            >
              <span>🍿</span>
              <span className="hidden sm:inline">Arcade</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/[0.08] px-4 py-3 flex flex-wrap gap-2">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-white"
                      : "bg-white/[0.05] text-neutral-300 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
