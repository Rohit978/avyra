export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface MediaSummary {
  id: string;
  title: string;
  original_title?: string | null;
  media_type: "MOVIE" | "TV_SHOW" | "ANIME" | "DOCUMENTARY" | "SHORT_FILM";
  status: string;
  overview?: string | null;
  release_date?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genres: string[];
}

export interface SearchSuggestion {
  id: string;
  title: string;
  media_type: string;
  release_date?: string | null;
  poster_url?: string | null;
  vote_average: number;
}

export interface PaginatedMedia {
  items: MediaSummary[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface MediaDetail extends MediaSummary {
  runtime?: number | null;
  original_language?: string | null;
  country_of_origin?: string | null;
  is_adult: boolean;
  titles: { title: string; title_type: string; language?: string | null }[];
  provenance: { provider: string; external_id: string }[];
  season_count: number;
  episode_count: number;
}

export interface CastMember {
  id: string;
  person_id: string;
  name: string;
  original_name?: string | null;
  character_name?: string | null;
  profile_path?: string | null;
  order: number;
}

export interface CrewMember {
  id: string;
  person_id: string;
  name: string;
  original_name?: string | null;
  department?: string | null;
  job?: string | null;
  profile_path?: string | null;
}

export interface MediaCredits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Episode {
  id: string;
  season_id: string;
  media_id: string;
  episode_number: number;
  title?: string | null;
  overview?: string | null;
  still_path?: string | null;
  air_date?: string | null;
  runtime?: number | null;
}

export interface SeasonDetail {
  id: string;
  season_number: number;
  title?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  air_date?: string | null;
  episode_count: number;
  episodes: Episode[];
}

// Fallback Mock Data for resilient offline presentation
const MOCK_HERO: MediaSummary = {
  id: "00000000-0000-0000-0000-000000000001",
  title: "Dune: Part Two",
  original_title: "Dune: Part Two",
  media_type: "MOVIE",
  status: "RELEASED",
  overview:
    "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
  release_date: "2024-03-01",
  poster_url: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  backdrop_url: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520Hgq.jpg",
  vote_average: 8.5,
  vote_count: 8500,
  popularity: 145.0,
  genres: ["Sci-Fi", "Adventure"],
};

const MOCK_ITEMS: MediaSummary[] = [
  MOCK_HERO,
  {
    id: "00000000-0000-0000-0000-000000000002",
    title: "Oppenheimer",
    original_title: "Oppenheimer",
    media_type: "MOVIE",
    status: "RELEASED",
    overview: "The story of J. Robert Oppenheimer's role in the Manhattan Project.",
    release_date: "2023-07-21",
    poster_url: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/rLb2cw69QbHgFDW00ohY298OkVU.jpg",
    vote_average: 8.9,
    vote_count: 14000,
    popularity: 120.0,
    genres: ["Biography", "Drama", "History"],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    title: "Arcane",
    original_title: "Arcane",
    media_type: "ANIME",
    status: "COMPLETED",
    overview: "Amid the clash between the twin cities of Piltover and Zaun, two sisters fight on opposite sides.",
    release_date: "2021-11-06",
    poster_url: "https://image.tmdb.org/t/p/w500/fq2fqH6a6s50sQjW3iFm0e1R.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/aGQeXh5gY77d1mK6s7nJ5e2u.jpg",
    vote_average: 9.1,
    vote_count: 22000,
    popularity: 98.0,
    genres: ["Animation", "Sci-Fi", "Action"],
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    title: "Shogun",
    original_title: "Shogun",
    media_type: "TV_SHOW",
    status: "COMPLETED",
    overview: "When a mysterious European ship is found marooned in a fishing village, Lord Toranaga discovers secrets that could tip the scales of power.",
    release_date: "2024-02-27",
    poster_url: "https://image.tmdb.org/t/p/w500/shogun_poster.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/original/shogun_backdrop.jpg",
    vote_average: 8.7,
    vote_count: 9500,
    popularity: 90.0,
    genres: ["Drama", "War & Politics"],
  },
];

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getCuratedCollection(
  collection: "trending" | "popular" | "top-rated" | "upcoming",
  mediaType?: string
): Promise<MediaSummary[]> {
  const query = mediaType ? `?media_type=${mediaType}` : "";
  const res = await safeFetch<PaginatedMedia>(
    `${API_BASE_URL}/media/curated/${collection}${query}`,
    { items: MOCK_ITEMS, page: 1, limit: 20, total: MOCK_ITEMS.length, total_pages: 1 }
  );
  return res.items.length > 0 ? res.items : MOCK_ITEMS;
}

export async function browseMedia(params: {
  media_type?: string;
  genre?: string;
  year?: number;
  sort_by?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedMedia> {
  const searchParams = new URLSearchParams();
  if (params.media_type) searchParams.set("media_type", params.media_type);
  if (params.genre) searchParams.set("genre", params.genre);
  if (params.year) searchParams.set("year", params.year.toString());
  if (params.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());

  return safeFetch<PaginatedMedia>(
    `${API_BASE_URL}/media?${searchParams.toString()}`,
    {
      items: params.media_type
        ? MOCK_ITEMS.filter((i) => i.media_type === params.media_type)
        : MOCK_ITEMS,
      page: 1,
      limit: 20,
      total: MOCK_ITEMS.length,
      total_pages: 1,
    }
  );
}

export async function searchMedia(query: string, page = 1): Promise<PaginatedMedia> {
  if (!query.trim()) {
    return { items: [], page: 1, limit: 20, total: 0, total_pages: 0 };
  }
  return safeFetch<PaginatedMedia>(
    `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&page=${page}`,
    {
      items: MOCK_ITEMS.filter((i) =>
        i.title.toLowerCase().includes(query.toLowerCase())
      ),
      page: 1,
      limit: 20,
      total: MOCK_ITEMS.length,
      total_pages: 1,
    }
  );
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];
  return safeFetch<SearchSuggestion[]>(
    `${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}&limit=6`,
    MOCK_ITEMS.filter((i) =>
      i.title.toLowerCase().includes(query.toLowerCase())
    ).map((i) => ({
      id: i.id,
      title: i.title,
      media_type: i.media_type,
      release_date: i.release_date,
      poster_url: i.poster_url,
      vote_average: i.vote_average,
    }))
  );
}

export async function getMediaDetail(id: string): Promise<MediaDetail | null> {
  const item = MOCK_ITEMS.find((m) => m.id === id) || MOCK_HERO;
  const fallback: MediaDetail = {
    ...item,
    runtime: 166,
    original_language: "en",
    country_of_origin: "US",
    is_adult: false,
    titles: [{ title: item.title, title_type: "primary", language: "en" }],
    provenance: [{ provider: "tmdb", external_id: "693134" }],
    season_count: item.media_type !== "MOVIE" ? 1 : 0,
    episode_count: item.media_type !== "MOVIE" ? 10 : 0,
  };

  return safeFetch<MediaDetail>(`${API_BASE_URL}/media/${id}`, fallback);
}

export async function getMediaCredits(id: string): Promise<MediaCredits> {
  return safeFetch<MediaCredits>(`${API_BASE_URL}/media/${id}/credits`, {
    cast: [
      {
        id: "cast-1",
        person_id: "p-1",
        name: "Timothée Chalamet",
        character_name: "Paul Atreides",
        profile_path: "https://image.tmdb.org/t/p/w185/BE2sdjpgEV2rNTFaFAURSR7Zu8.jpg",
        order: 0,
      },
      {
        id: "cast-2",
        person_id: "p-2",
        name: "Zendaya",
        character_name: "Chani",
        profile_path: "https://image.tmdb.org/t/p/w185/r3A7evKLrqRZwAoW37v0Q6eH7.jpg",
        order: 1,
      },
    ],
    crew: [
      {
        id: "crew-1",
        person_id: "p-3",
        name: "Denis Villeneuve",
        department: "Directing",
        job: "Director",
        profile_path: "https://image.tmdb.org/t/p/w185/p2R6V9g97vYfK0.jpg",
      },
    ],
  });
}

export async function getMediaSeasons(id: string): Promise<SeasonDetail[]> {
  return safeFetch<SeasonDetail[]>(`${API_BASE_URL}/media/${id}/seasons`, [
    {
      id: "s-1",
      season_number: 1,
      title: "Season 1",
      overview: "First season overview.",
      episode_count: 9,
      episodes: [
        {
          id: "ep-1",
          season_id: "s-1",
          media_id: id,
          episode_number: 1,
          title: "Welcome to the Playground",
          overview: "Two sisters attempt to rob a lab in the topside city.",
          runtime: 42,
          air_date: "2021-11-06",
        },
        {
          id: "ep-2",
          season_id: "s-1",
          media_id: id,
          episode_number: 2,
          title: "Some Mysteries Are Better Left Unsolved",
          overview: "Jayce faces punishment for illicit experiments.",
          runtime: 40,
          air_date: "2021-11-06",
        },
      ],
    },
  ]);
}

export async function getPlaybackOptions(
  id: string,
  season?: number,
  episode?: number
) {
  const query = [];
  if (season) query.push(`season=${season}`);
  if (episode) query.push(`episode=${episode}`);
  const qStr = query.length > 0 ? `?${query.join("&")}` : "";

  return safeFetch(`${API_BASE_URL}/media/${id}/playback-options${qStr}`, {
    media_id: id,
    media_type: "MOVIE",
    title: "Dune: Part Two",
    has_stream: true,
    tmdb_id: "693134",
    embed_sources: [
      {
        id: "vidbolt",
        name: "Vidbolt",
        embed_url: "https://vidbolt.xyz/movie/693134",
        domain: "vidbolt.xyz",
        is_primary: true,
      },
      {
        id: "reelsdownload",
        name: "ReelsDownload",
        embed_url: "https://embed.reelsdownload.online/player/693134?key=k_5661ac637169a1733857dc50",
        domain: "embed.reelsdownload.online",
        is_primary: false,
      },
    ],
    sandbox_policy: "allow-scripts allow-same-origin allow-forms allow-presentation",
    referrer_policy: "no-referrer",
  });
}

