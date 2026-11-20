import React from "react";
import CatalogGridClient from "../../components/CatalogGridClient";
import { browseMedia } from "../../lib/api";

export const revalidate = 1800;

export default async function MoviesPage() {
  const data = await browseMedia({
    media_type: "MOVIE",
    sort_by: "popularity",
    page: 1,
    limit: 48,
  });

  return (
    <CatalogGridClient
      title="Movies"
      description="Explore thousands of live feature films, blockbusters, and critically acclaimed cinema."
      mediaType="MOVIE"
      initialItems={data.items}
    />
  );
}
