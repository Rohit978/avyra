export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? "/api/v1"
    : process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000/api/v1"
    : "");

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
  poster_url: "https://images.metahub.space/poster/small/tt15239678/img",
  backdrop_url: "https://images.metahub.space/background/medium/tt15239678/img",
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
    poster_url: "https://images.metahub.space/poster/small/tt15398776/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt15398776/img",
    vote_average: 8.9,
    vote_count: 14000,
    popularity: 120.0,
    genres: ["Biography", "Drama", "History"],
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    title: "Interstellar",
    original_title: "Interstellar",
    media_type: "MOVIE",
    status: "RELEASED",
    overview: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans.",
    release_date: "2014-11-05",
    poster_url: "https://images.metahub.space/poster/small/tt0816692/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt0816692/img",
    vote_average: 8.7,
    vote_count: 35000,
    popularity: 110.0,
    genres: ["Sci-Fi", "Adventure", "Drama"],
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    title: "Inception",
    original_title: "Inception",
    media_type: "MOVIE",
    status: "RELEASED",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    release_date: "2010-07-16",
    poster_url: "https://images.metahub.space/poster/small/tt1375666/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt1375666/img",
    vote_average: 8.8,
    vote_count: 36000,
    popularity: 105.0,
    genres: ["Sci-Fi", "Action", "Thriller"],
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    title: "The Dark Knight",
    original_title: "The Dark Knight",
    media_type: "MOVIE",
    status: "RELEASED",
    overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    release_date: "2008-07-18",
    poster_url: "https://images.metahub.space/poster/small/tt0468569/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt0468569/img",
    vote_average: 9.0,
    vote_count: 32000,
    popularity: 130.0,
    genres: ["Action", "Crime", "Drama"],
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    title: "Top Gun: Maverick",
    original_title: "Top Gun: Maverick",
    media_type: "MOVIE",
    status: "RELEASED",
    overview: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on an impossible mission.",
    release_date: "2022-05-27",
    poster_url: "https://images.metahub.space/poster/small/tt1745960/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt1745960/img",
    vote_average: 8.3,
    vote_count: 8500,
    popularity: 95.0,
    genres: ["Action", "Drama"],
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
    title: "Breaking Bad",
    original_title: "Breaking Bad",
    media_type: "TV_SHOW",
    status: "COMPLETED",
    overview: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family's financial future.",
    release_date: "2008-01-20",
    poster_url: "https://images.metahub.space/poster/small/tt0903747/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt0903747/img",
    vote_average: 9.5,
    vote_count: 21000,
    popularity: 140.0,
    genres: ["Crime", "Drama", "Thriller"],
  },
  {
    id: "00000000-0000-0000-0000-000000000008",
    title: "Stranger Things",
    original_title: "Stranger Things",
    media_type: "TV_SHOW",
    status: "RETURNING",
    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
    release_date: "2016-07-15",
    poster_url: "https://images.metahub.space/poster/small/tt4574334/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt4574334/img",
    vote_average: 8.7,
    vote_count: 17000,
    popularity: 115.0,
    genres: ["Sci-Fi", "Mystery", "Drama"],
  },
  {
    id: "00000000-0000-0000-0000-000000000009",
    title: "The Last of Us",
    original_title: "The Last of Us",
    media_type: "TV_SHOW",
    status: "RETURNING",
    overview: "After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity's last hope.",
    release_date: "2023-01-15",
    poster_url: "https://images.metahub.space/poster/small/tt3581920/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt3581920/img",
    vote_average: 8.8,
    vote_count: 10500,
    popularity: 108.0,
    genres: ["Drama", "Sci-Fi", "Action"],
  },
  {
    id: "00000000-0000-0000-0000-000000000010",
    title: "Shogun",
    original_title: "Shogun",
    media_type: "TV_SHOW",
    status: "COMPLETED",
    overview: "When a mysterious European ship is found marooned in a fishing village, Lord Toranaga discovers secrets that could tip the scales of power.",
    release_date: "2024-02-27",
    poster_url: "https://images.metahub.space/poster/small/tt2788316/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt2788316/img",
    vote_average: 8.7,
    vote_count: 9500,
    popularity: 90.0,
    genres: ["Drama", "War & Politics"],
  },
  {
    id: "00000000-0000-0000-0000-000000000011",
    title: "Game of Thrones",
    original_title: "Game of Thrones",
    media_type: "TV_SHOW",
    status: "COMPLETED",
    overview: "Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.",
    release_date: "2011-04-17",
    poster_url: "https://images.metahub.space/poster/small/tt0944947/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt0944947/img",
    vote_average: 9.2,
    vote_count: 24000,
    popularity: 125.0,
    genres: ["Sci-Fi & Fantasy", "Drama", "Action"],
  },
  {
    id: "00000000-0000-0000-0000-000000000012",
    title: "Arcane",
    original_title: "Arcane",
    media_type: "ANIME",
    status: "COMPLETED",
    overview: "Amid the clash between the twin cities of Piltover and Zaun, two sisters fight on opposite sides of a war between band technologies and incompatible convictions.",
    release_date: "2021-11-06",
    poster_url: "https://images.metahub.space/poster/small/tt11126994/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt11126994/img",
    vote_average: 9.1,
    vote_count: 22000,
    popularity: 98.0,
    genres: ["Animation", "Sci-Fi", "Action"],
  },
  {
    id: "00000000-0000-0000-0000-000000000013",
    title: "Attack on Titan",
    original_title: "Shingeki no Kyojin",
    media_type: "ANIME",
    status: "COMPLETED",
    overview: "After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.",
    release_date: "2013-04-07",
    poster_url: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg",
    backdrop_url: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg",
    vote_average: 9.0,
    vote_count: 19500,
    popularity: 110.0,
    genres: ["Animation", "Action", "Fantasy"],
  },
  {
    id: "00000000-0000-0000-0000-000000000014",
    title: "Demon Slayer",
    original_title: "Kimetsu no Yaiba",
    media_type: "ANIME",
    status: "RETURNING",
    overview: "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon herself.",
    release_date: "2019-04-06",
    poster_url: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg",
    backdrop_url: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-33MtJGsUSxga.jpg",
    vote_average: 8.7,
    vote_count: 15000,
    popularity: 104.0,
    genres: ["Animation", "Action", "Fantasy"],
  },
  {
    id: "00000000-0000-0000-0000-000000000015",
    title: "Jujutsu Kaisen",
    original_title: "Jujutsu Kaisen",
    media_type: "ANIME",
    status: "RETURNING",
    overview: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself.",
    release_date: "2020-10-03",
    poster_url: "https://images.metahub.space/poster/small/tt12343534/img",
    backdrop_url: "https://images.metahub.space/background/medium/tt12343534/img",
    vote_average: 8.6,
    vote_count: 13000,
    popularity: 102.0,
    genres: ["Animation", "Action", "Fantasy"],
  },
];

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  if (
    !url ||
    (typeof window === "undefined" && !url.startsWith("http://") && !url.startsWith("https://")) ||
    (url.startsWith("http://127.0.0.1") && process.env.NODE_ENV === "production")
  ) {
    return fallback;
  }
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
  const filteredMock = mediaType
    ? MOCK_ITEMS.filter((i) => i.media_type === mediaType)
    : collection === "upcoming"
    ? MOCK_ITEMS.slice(0, 8)
    : collection === "top-rated"
    ? [...MOCK_ITEMS].sort((a, b) => b.vote_average - a.vote_average)
    : MOCK_ITEMS;

  const res = await safeFetch<PaginatedMedia>(
    `${API_BASE_URL}/media/curated/${collection}${query}`,
    { items: filteredMock, page: 1, limit: 20, total: filteredMock.length, total_pages: 1 }
  );
  return res.items && res.items.length > 0 ? res.items : filteredMock;
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

export const TMDB_ID_MAP: Record<
  string,
  { tmdb_id: string; title: string; media_type: "MOVIE" | "TV_SHOW" | "ANIME" }
> = {
  "00000000-0000-0000-0000-000000000001": { tmdb_id: "693134", title: "Dune: Part Two", media_type: "MOVIE" },
  "00000000-0000-0000-0000-000000000002": { tmdb_id: "872585", title: "Oppenheimer", media_type: "MOVIE" },
  "00000000-0000-0000-0000-000000000003": { tmdb_id: "157336", title: "Interstellar", media_type: "MOVIE" },
  "00000000-0000-0000-0000-000000000004": { tmdb_id: "27205", title: "Inception", media_type: "MOVIE" },
  "00000000-0000-0000-0000-000000000005": { tmdb_id: "155", title: "The Dark Knight", media_type: "MOVIE" },
  "00000000-0000-0000-0000-000000000006": { tmdb_id: "361743", title: "Top Gun: Maverick", media_type: "MOVIE" },
  "00000000-0000-0000-0000-000000000007": { tmdb_id: "1396", title: "Breaking Bad", media_type: "TV_SHOW" },
  "00000000-0000-0000-0000-000000000008": { tmdb_id: "66732", title: "Stranger Things", media_type: "TV_SHOW" },
  "00000000-0000-0000-0000-000000000009": { tmdb_id: "100088", title: "The Last of Us", media_type: "TV_SHOW" },
  "00000000-0000-0000-0000-000000000010": { tmdb_id: "126308", title: "Shogun", media_type: "TV_SHOW" },
  "00000000-0000-0000-0000-000000000011": { tmdb_id: "1399", title: "Game of Thrones", media_type: "TV_SHOW" },
  "00000000-0000-0000-0000-000000000012": { tmdb_id: "94605", title: "Arcane", media_type: "ANIME" },
  "00000000-0000-0000-0000-000000000013": { tmdb_id: "1429", title: "Attack on Titan", media_type: "ANIME" },
  "00000000-0000-0000-0000-000000000014": { tmdb_id: "85937", title: "Demon Slayer", media_type: "ANIME" },
  "00000000-0000-0000-0000-000000000015": { tmdb_id: "95479", title: "Jujutsu Kaisen", media_type: "ANIME" },
};

function resolveTmdbId(id: string): { tmdb_id: string; title: string; media_type: string } {
  if (TMDB_ID_MAP[id]) {
    return TMDB_ID_MAP[id];
  }
  const byTitle = MOCK_ITEMS.find((m) => m.id === id);
  if (byTitle && TMDB_ID_MAP[byTitle.id]) {
    return TMDB_ID_MAP[byTitle.id];
  }
  if (/^\d+$/.test(id)) {
    return { tmdb_id: id, title: byTitle?.title || "Featured Stream", media_type: byTitle?.media_type || "MOVIE" };
  }
  return { tmdb_id: "693134", title: byTitle?.title || "Dune: Part Two", media_type: byTitle?.media_type || "MOVIE" };
}

export async function getMediaDetail(id: string): Promise<MediaDetail | null> {
  const item = MOCK_ITEMS.find((m) => m.id === id) || MOCK_HERO;
  const resolved = resolveTmdbId(id);
  const fallback: MediaDetail = {
    ...item,
    runtime: item.media_type === "MOVIE" ? 148 : 55,
    original_language: "en",
    country_of_origin: "US",
    is_adult: false,
    titles: [{ title: item.title, title_type: "primary", language: "en" }],
    provenance: [{ provider: "tmdb", external_id: resolved.tmdb_id }],
    season_count: item.media_type !== "MOVIE" ? 4 : 0,
    episode_count: item.media_type !== "MOVIE" ? 36 : 0,
  };

  return safeFetch<MediaDetail>(`${API_BASE_URL}/media/${id}`, fallback);
}

export async function getMediaCredits(id: string): Promise<MediaCredits> {
  const resolved = resolveTmdbId(id);
  return safeFetch<MediaCredits>(`${API_BASE_URL}/media/${id}/credits`, {
    cast: [
      {
        id: `cast-${resolved.tmdb_id}-1`,
        person_id: "p-1",
        name: "Lead Actor",
        character_name: "Protagonist",
        profile_path: "https://images.metahub.space/poster/small/tt15239678/img",
        order: 0,
      },
      {
        id: `cast-${resolved.tmdb_id}-2`,
        person_id: "p-2",
        name: "Supporting Cast",
        character_name: "Co-Star",
        profile_path: "https://images.metahub.space/poster/small/tt15398776/img",
        order: 1,
      },
    ],
    crew: [
      {
        id: `crew-${resolved.tmdb_id}-1`,
        person_id: "p-3",
        name: "Director",
        department: "Directing",
        job: "Director",
        profile_path: null,
      },
    ],
  });
}

export async function getMediaSeasons(id: string): Promise<SeasonDetail[]> {
  const summaries = await safeFetch<SeasonDetail[]>(
    `${API_BASE_URL}/media/${id}/seasons`,
    []
  );

  if (!summaries || summaries.length === 0) {
    return [];
  }

  // Enrich each season with its detailed episodes array
  try {
    const detailed = await Promise.all(
      summaries.map(async (s) => {
        try {
          const detail = await safeFetch<SeasonDetail>(
            `${API_BASE_URL}/media/${id}/seasons/${s.season_number}`,
            s
          );
          if (detail && detail.episodes && detail.episodes.length > 0) {
            return detail;
          }
          return s;
        } catch {
          return s;
        }
      })
    );
    return detailed;
  } catch {
    return summaries;
  }
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

  const resolved = resolveTmdbId(id);
  const item = MOCK_ITEMS.find((m) => m.id === id) || MOCK_HERO;
  const isMovie = item.media_type === "MOVIE";
  const sNum = season || 1;
  const epNum = episode || 1;

  const vidlinkUrl = isMovie
    ? `https://vidlink.pro/movie/${resolved.tmdb_id}?primaryColor=e11d48&secondaryColor=fbbf24`
    : `https://vidlink.pro/tv/${resolved.tmdb_id}/${sNum}/${epNum}?primaryColor=e11d48&secondaryColor=fbbf24`;

  const vidsrcUrl = isMovie
    ? `https://vidsrc.me/embed/movie?tmdb=${resolved.tmdb_id}`
    : `https://vidsrc.me/embed/tv?tmdb=${resolved.tmdb_id}&season=${sNum}&episode=${epNum}`;

  const twoEmbedUrl = isMovie
    ? `https://www.2embed.cc/embed/${resolved.tmdb_id}`
    : `https://www.2embed.cc/embedtv/${resolved.tmdb_id}&s=${sNum}&e=${epNum}`;

  const vidflixUrl = isMovie
    ? `https://vidsrc.pm/embed/movie?tmdb=${resolved.tmdb_id}`
    : `https://vidsrc.pm/embed/tv?tmdb=${resolved.tmdb_id}&season=${sNum}&episode=${epNum}`;

  const reelsUrl = isMovie
    ? `https://embed.reelsdownload.online/player/${resolved.tmdb_id}?key=k_5661ac637169a1733857dc50`
    : `https://embed.reelsdownload.online/player/${resolved.tmdb_id}?key=k_5661ac637169a1733857dc50&s=${sNum}&e=${epNum}`;

  const vidboltUrl = isMovie
    ? `https://vidbolt.xyz/movie/${resolved.tmdb_id}`
    : `https://vidbolt.xyz/tv/${resolved.tmdb_id}/${sNum}/${epNum}`;

  const fallback = {
    media_id: id,
    media_type: item.media_type,
    title: item.title,
    has_stream: true,
    tmdb_id: resolved.tmdb_id,
    season_number: isMovie ? null : sNum,
    episode_number: isMovie ? null : epNum,
    embed_sources: [
      {
        id: "vidlink-primary",
        name: "Server 1 (VidLink - No Ads)",
        embed_url: vidlinkUrl,
        domain: "vidlink.pro",
        is_primary: true,
      },
      {
        id: "vidsrc",
        name: "Server 2 (VidSrc)",
        embed_url: vidsrcUrl,
        domain: "vidsrc.me",
        is_primary: false,
      },
      {
        id: "2embed",
        name: "Server 3 (2Embed HD)",
        embed_url: twoEmbedUrl,
        domain: "2embed.cc",
        is_primary: false,
      },
      {
        id: "vidflix",
        name: "Server 4 (Vidflix)",
        embed_url: vidflixUrl,
        domain: "vidsrc.pm",
        is_primary: false,
      },
      {
        id: "reelsdownload",
        name: "Server 5 (Reels)",
        embed_url: reelsUrl,
        domain: "embed.reelsdownload.online",
        is_primary: false,
      },
      {
        id: isMovie ? "vidbolt" : "vidbolt-tv",
        name: "Server 6 (Vidbolt)",
        embed_url: vidboltUrl,
        domain: "vidbolt.xyz",
        is_primary: false,
      },
    ],
    sandbox_policy: "allow-scripts allow-same-origin allow-forms allow-presentation",
    referrer_policy: "origin",
  };

  return safeFetch(`${API_BASE_URL}/media/${id}/playback-options${qStr}`, fallback);
}

