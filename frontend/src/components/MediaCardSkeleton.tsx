import React from "react";

export default function MediaCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-surface-elevated border border-surface-border animate-pulse">
      {/* Poster Placeholder */}
      <div className="w-full aspect-[2/3] bg-neutral-800" />

      {/* Info Placeholder */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-neutral-800 rounded w-3/4" />
        <div className="flex items-center justify-between">
          <div className="h-3 bg-neutral-800 rounded w-1/4" />
          <div className="h-3 bg-neutral-800 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}
