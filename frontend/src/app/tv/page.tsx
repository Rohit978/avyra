import React from "react";
import MediaCard from "../../components/MediaCard";
import { browseMedia } from "../../lib/api";

interface TVPageProps {
  searchParams: Promise<{
    genre?: string;
    year?: string;
    sort_by?: string;
    page?: string;
  }>;
}

export default async function TVSeriesPage({ searchParams }: TVPageProps) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const year = params.year ? parseInt(params.year, 10) : undefined;

  const data = await browseMedia({
    media_type: "TV_SHOW",
    genre: params.genre,
    year: year,
    sort_by: params.sort_by || "popularity",
    page: page,
    limit: 24,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="border-b border-surface-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Television Series</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Explore episodic dramas, comedies, miniseries, and ongoing serials.
          </p>
        </div>
        <div className="text-xs text-neutral-400 bg-surface-elevated px-3 py-1.5 rounded-full border border-surface-border w-fit">
          Showing {data.items.length} series
        </div>
      </div>

      {/* Grid */}
      {data.items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {data.items.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-neutral-500">
          <p className="text-lg">No television series found matching the selected criteria.</p>
        </div>
      )}
    </div>
  );
}
