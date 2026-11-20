import React from "react";
import CatalogGridClient from "../../components/CatalogGridClient";
import { browseMedia } from "../../lib/api";

export const revalidate = 1800;

export default async function AnimePage() {
  const data = await browseMedia({
    media_type: "ANIME",
    sort_by: "popularity",
    page: 1,
    limit: 48,
  });

  return (
    <CatalogGridClient
      title="Anime & Animation"
      description="Stream trending Japanese anime series, acclaimed animated films, and classic sagas."
      mediaType="ANIME"
      initialItems={data.items}
    />
  );
}
