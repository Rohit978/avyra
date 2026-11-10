import React from "react";
import MediaCard from "../../components/MediaCard";
import { searchMedia } from "../../lib/api";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const page = params.page ? parseInt(params.page, 10) : 1;

  const data = await searchMedia(query, page);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search Header */}
      <div className="border-b border-surface-border pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight">
          {query ? (
            <>
              Search results for &quot;<span className="text-primary">{query}</span>&quot;
            </>
          ) : (
            "Catalogue Search"
          )}
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          {query
            ? `Found ${data.total} matching titles`
            : "Enter a movie, TV show, anime, or person name to begin searching."}
        </p>
      </div>

      {/* Grid */}
      {data.items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {data.items.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      ) : query ? (
        <div className="py-24 text-center text-neutral-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-lg text-white font-medium">No results found</p>
          <p className="text-sm text-neutral-400 mt-1">
            Check your spelling or try broader search terms.
          </p>
        </div>
      ) : null}
    </div>
  );
}
