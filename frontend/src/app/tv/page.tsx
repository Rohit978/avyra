import React from "react";
import CatalogGridClient from "../../components/CatalogGridClient";
import { browseMedia } from "../../lib/api";

export const revalidate = 1800;

export default async function TVSeriesPage() {
  const data = await browseMedia({
    media_type: "TV_SHOW",
    sort_by: "popularity",
    page: 1,
    limit: 48,
  });

  return (
    <CatalogGridClient
      title="TV Series"
      description="Binge thousands of live episodic dramas, comedies, miniseries, and top-rated shows."
      mediaType="TV_SHOW"
      initialItems={data.items}
    />
  );
}
