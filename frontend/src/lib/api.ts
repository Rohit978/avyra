export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? "/api/v1"
    : process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000/api/v1"
    : "");

export interface AnimeMeta {
  anilist_score?: number | null;
  mal_id?: number | null;
  episodes?: number | null;
  season?: string | null;
  sub_dub?: "SUB / DUB" | "SUB";
  format?: string | null;
}

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
  trailer_key?: string | null;
  anime_meta?: AnimeMeta | null;
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

const CINEMETA_BASE = "https://v3-cinemeta.strem.io";

interface CinemetaMetaItem {
  id: string;
  imdb_id?: string;
  moviedb_id?: number | string;
  type?: "movie" | "series";
  name: string;
  poster?: string;
  background?: string;
  description?: string;
  imdbRating?: string;
  releaseInfo?: string;
  runtime?: string;
  genres?: string[];
  cast?: string[];
  director?: string[];
  trailers?: { source: string; type?: string }[];
  videos?: {
    id: string;
    name?: string;
    title?: string;
    season?: number;
    episode?: number;
    number?: number;
    overview?: string;
    description?: string;
    thumbnail?: string;
    released?: string;
    firstAired?: string;
  }[];
}

function mapCinemetaToSummary(
  m: CinemetaMetaItem,
  forcedType?: "MOVIE" | "TV_SHOW"
): MediaSummary {
  const rating = parseFloat(m.imdbRating || "0");
  const isSeries = forcedType === "TV_SHOW" || m.type === "series";
  const yearMatch = (m.releaseInfo || "").match(/\d{4}/);
  const releaseDate = yearMatch ? `${yearMatch[0]}-01-01` : null;
  const genres = Array.isArray(m.genres) && m.genres.length > 0 ? m.genres : [];
  const isAnime =
    isSeries &&
    genres.some((g) => g.toLowerCase() === "animation");

  return {
    id: m.id || m.imdb_id || "",
    title: m.name || "Untitled",
    original_title: m.name || "Untitled",
    media_type: isAnime ? "ANIME" : isSeries ? "TV_SHOW" : "MOVIE",
    status: "RELEASED",
    overview: m.description || null,
    release_date: releaseDate,
    poster_url:
      m.poster ||
      (m.id?.startsWith("tt")
        ? `https://images.metahub.space/poster/small/${m.id}/img`
        : null),
    backdrop_url:
      m.background ||
      (m.id?.startsWith("tt")
        ? `https://images.metahub.space/background/medium/${m.id}/img`
        : null),
    vote_average: Number.isFinite(rating) ? rating : 0,
    vote_count: 5000,
    popularity: Number.isFinite(rating) ? rating * 15 : 80,
    genres,
    trailer_key: m.trailers?.[0]?.source || null,
  };
}

async function fetchCinemetaCatalog(
  type: "movie" | "series",
  catalog: "top" | "imdbRating",
  options?: { search?: string; genre?: string; skip?: number }
): Promise<MediaSummary[]> {
  try {
    const extraParts: string[] = [];
    if (options?.search) {
      extraParts.push(`search=${encodeURIComponent(options.search)}`);
    } else {
      if (options?.genre) {
        extraParts.push(`genre=${encodeURIComponent(options.genre)}`);
      }
      if (options?.skip && options.skip > 0) {
        extraParts.push(`skip=${options.skip}`);
      }
    }
    const extraPath = extraParts.length > 0 ? `/${extraParts.join("&")}` : "";
    const path = `${CINEMETA_BASE}/catalog/${type}/${catalog}${extraPath}.json`;
    const res = await fetch(path, {
      next: { revalidate: 1800 },
    } as RequestInit);
    if (!res.ok) return [];
    const data = await res.json();
    const metas: CinemetaMetaItem[] = Array.isArray(data?.metas) ? data.metas : [];
    return metas
      .filter((m) => m && m.id && m.name)
      .map((m) => mapCinemetaToSummary(m, type === "series" ? "TV_SHOW" : "MOVIE"));
  } catch {
    return [];
  }
}

async function fetchCinemetaMeta(id: string): Promise<CinemetaMetaItem | null> {
  if (!id.startsWith("tt")) return null;
  // Query "series" FIRST: Cinemeta returns empty meta for movies on /meta/series/,
  // whereas /meta/movie/ collides with TMDB movie IDs when given a series IMDb ID!
  for (const kind of ["series", "movie"] as const) {
    try {
      const res = await fetch(`${CINEMETA_BASE}/meta/${kind}/${id}.json`, {
        next: { revalidate: 3600 },
      } as RequestInit);
      if (res.ok) {
        const data = await res.json();
        if (data?.meta?.name) {
          return { ...data.meta, type: data.meta.type || kind };
        }
      }
    } catch {}
  }
  return null;
}

const ANILIST_GQL_URL = "https://graphql.anilist.co";

interface AniListRawMedia {
  id: number;
  idMal?: number | null;
  title?: { english?: string | null; romaji?: string | null; native?: string | null };
  episodes?: number | null;
  duration?: number | null;
  season?: string | null;
  seasonYear?: number | null;
  format?: string | null;
  status?: string | null;
  averageScore?: number | null;
  popularity?: number | null;
  genres?: string[];
  coverImage?: { extraLarge?: string | null; large?: string | null };
  bannerImage?: string | null;
  description?: string | null;
  trailer?: { id?: string | null; site?: string | null } | null;
  characters?: {
    edges?: {
      role?: string | null;
      node?: {
        id?: number;
        name?: { full?: string | null };
        image?: { large?: string | null };
      };
      voiceActors?: {
        id?: number;
        name?: { full?: string | null };
        image?: { large?: string | null };
      }[];
    }[];
  };
}

function stripHtml(text?: string | null): string | null {
  if (!text) return null;
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function mapAniListToSummary(a: AniListRawMedia): MediaSummary {
  const title = a.title?.english || a.title?.romaji || "Untitled Anime";
  const score = a.averageScore || 0;
  const seasonLabel =
    a.season && a.seasonYear
      ? `${a.season} ${a.seasonYear}`
      : a.seasonYear
      ? String(a.seasonYear)
      : null;

  return {
    id: `al-${a.id}`,
    title,
    original_title: a.title?.romaji || a.title?.native || title,
    media_type: "ANIME",
    status: a.status || "RELEASED",
    overview: stripHtml(a.description),
    release_date: a.seasonYear ? `${a.seasonYear}-01-01` : null,
    poster_url: a.coverImage?.extraLarge || a.coverImage?.large || null,
    backdrop_url: a.bannerImage || a.coverImage?.extraLarge || null,
    vote_average: score > 0 ? Number((score / 10).toFixed(1)) : 8.2,
    vote_count: a.popularity || 10000,
    popularity: a.popularity || 100,
    genres: Array.isArray(a.genres) ? a.genres : ["Animation"],
    trailer_key:
      a.trailer?.site?.toLowerCase() === "youtube" ? a.trailer.id || null : null,
    anime_meta: {
      anilist_score: score > 0 ? score : null,
      mal_id: a.idMal || null,
      episodes: a.episodes || null,
      season: seasonLabel,
      sub_dub: a.title?.english ? "SUB / DUB" : "SUB",
      format: a.format || "TV",
    },
  };
}

async function fetchAniListCatalog(
  sort: "TRENDING_DESC" | "SCORE_DESC" | "POPULARITY_DESC" = "TRENDING_DESC",
  page = 1,
  perPage = 24
): Promise<MediaSummary[]> {
  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: $sort, isAdult: false) {
          id
          idMal
          title { english romaji native }
          episodes
          duration
          season
          seasonYear
          format
          status
          averageScore
          popularity
          genres
          coverImage { extraLarge large }
          bannerImage
          description(asHtml: false)
          trailer { id site }
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { page, perPage, sort: [sort] } }),
      next: { revalidate: 1800 },
    } as RequestInit);
    if (!res.ok) return [];
    const json = await res.json();
    const list: AniListRawMedia[] = json?.data?.Page?.media || [];
    return list.map(mapAniListToSummary);
  } catch {
    return [];
  }
}

async function fetchAniListById(anilistId: number): Promise<AniListRawMedia | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title { english romaji native }
        episodes
        duration
        season
        seasonYear
        format
        status
        averageScore
        popularity
        genres
        coverImage { extraLarge large }
        bannerImage
        description(asHtml: false)
        trailer { id site }
        characters(sort: [ROLE, RELEVANCE], perPage: 8) {
          edges {
            role
            node { id name { full } image { large } }
            voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
              id
              name { full }
              image { large }
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_GQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { id: anilistId } }),
      next: { revalidate: 3600 },
    } as RequestInit);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.Media || null;
  } catch {
    return null;
  }
}

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
  // Fetch live, current real-time catalogs from Cinemeta (cached 30 min via ISR)
  try {
    if (collection === "top-rated") {
      if (mediaType === "TV_SHOW") {
        const series = await fetchCinemetaCatalog("series", "imdbRating");
        const rated = series
          .filter((s) => s.vote_average >= 7.5)
          .sort((a, b) => b.vote_average - a.vote_average);
        if (rated.length > 0) return rated.slice(0, 20);
      } else {
        const movies = await fetchCinemetaCatalog("movie", "imdbRating");
        const rated = movies
          .filter((m) => m.vote_average >= 7.5)
          .sort((a, b) => b.vote_average - a.vote_average);
        if (rated.length > 0) return rated.slice(0, 20);
      }
    }

    if (collection === "trending") {
      const [movies, series] = await Promise.all([
        fetchCinemetaCatalog("movie", "top"),
        fetchCinemetaCatalog("series", "top"),
      ]);
      const merged: MediaSummary[] = [];
      const maxLen = Math.max(movies.length, series.length);
      for (let i = 0; i < Math.min(maxLen, 14); i++) {
        if (movies[i]) merged.push(movies[i]);
        if (series[i]) merged.push(series[i]);
      }
      if (merged.length > 0) return merged.slice(0, 24);
    }

    if (collection === "popular") {
      if (mediaType === "MOVIE") {
        const movies = await fetchCinemetaCatalog("movie", "top", { skip: 15 });
        if (movies.length > 0) return movies.slice(0, 24);
      } else if (mediaType === "TV_SHOW") {
        const series = await fetchCinemetaCatalog("series", "top", { skip: 15 });
        if (series.length > 0) return series.slice(0, 24);
      } else if (mediaType === "ANIME") {
        const anilistAnime = await fetchAniListCatalog("TRENDING_DESC", 1, 24);
        if (anilistAnime.length > 0) return anilistAnime;
        const anime = await fetchCinemetaCatalog("series", "top", { genre: "Animation" });
        if (anime.length > 0) return anime.slice(0, 24);
      }
    }
  } catch {
    // Fallback below if offline
  }

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
  // Deep live pagination via Cinemeta skip= & genre= (thousands of movies, series, and anime)
  try {
    const page = params.page || 1;
    const limit = params.limit || 48;
    const skip = (page - 1) * 50;
    const catalogKind: "top" | "imdbRating" =
      params.sort_by === "rating" ? "imdbRating" : "top";

    let live: MediaSummary[] = [];
    if (params.media_type === "MOVIE") {
      live = await fetchCinemetaCatalog("movie", catalogKind, {
        genre: params.genre,
        skip,
      });
    } else if (params.media_type === "TV_SHOW") {
      live = await fetchCinemetaCatalog("series", catalogKind, {
        genre: params.genre,
        skip,
      });
    } else if (params.media_type === "ANIME") {
      const anilistSort =
        params.sort_by === "rating" ? "SCORE_DESC" : "TRENDING_DESC";
      const anilistItems = await fetchAniListCatalog(anilistSort, page, limit);
      if (anilistItems.length > 0) {
        live = anilistItems;
      } else {
        const [animSeries, animMovies] = await Promise.all([
          fetchCinemetaCatalog("series", catalogKind, { genre: "Animation", skip }),
          fetchCinemetaCatalog("movie", catalogKind, { genre: "Animation", skip }),
        ]);
        const merged: MediaSummary[] = [];
        const maxLen = Math.max(animSeries.length, animMovies.length);
        for (let i = 0; i < maxLen; i++) {
          if (animSeries[i]) merged.push(animSeries[i]);
          if (animMovies[i]) merged.push(animMovies[i]);
        }
        live = merged;
      }
    } else {
      const [m, s] = await Promise.all([
        fetchCinemetaCatalog("movie", catalogKind, { genre: params.genre, skip }),
        fetchCinemetaCatalog("series", catalogKind, { genre: params.genre, skip }),
      ]);
      live = [...m.slice(0, 24), ...s.slice(0, 24)];
    }

    if (params.year) {
      live = live.filter((i) => i.release_date?.startsWith(String(params.year)));
    }
    if (live.length > 0) {
      return {
        items: live.slice(0, limit),
        page,
        limit,
        total: 1000,
        total_pages: 20,
      };
    }
  } catch {}

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
  try {
    const [movies, series] = await Promise.all([
      fetchCinemetaCatalog("movie", "top", { search: query.trim() }),
      fetchCinemetaCatalog("series", "top", { search: query.trim() }),
    ]);
    const combined = [...movies.slice(0, 18), ...series.slice(0, 18)];
    if (combined.length > 0) {
      return {
        items: combined,
        page,
        limit: 36,
        total: combined.length,
        total_pages: 1,
      };
    }
  } catch {}

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
  try {
    const [movies, series] = await Promise.all([
      fetchCinemetaCatalog("movie", "top", { search: query.trim() }),
      fetchCinemetaCatalog("series", "top", { search: query.trim() }),
    ]);
    const combined = [...movies.slice(0, 5), ...series.slice(0, 5)];
    if (combined.length > 0) {
      return combined.map((i) => ({
        id: i.id,
        title: i.title,
        media_type: i.media_type,
        release_date: i.release_date,
        poster_url: i.poster_url,
        vote_average: i.vote_average,
      }));
    }
  } catch {}

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

async function resolveAniListStreamIds(
  a: AniListRawMedia
): Promise<{ tmdbId: string | null; imdbId: string | null }> {
  const candidates = [a.title?.english, a.title?.romaji].filter(
    (t): t is string => Boolean(t && t.trim())
  );
  for (const title of candidates) {
    try {
      const kind = a.format === "MOVIE" ? "movie" : "series";
      const matches = await fetchCinemetaCatalog(kind, "top", { search: title });
      const topMatch = matches[0];
      if (topMatch?.id?.startsWith("tt")) {
        const meta = await fetchCinemetaMeta(topMatch.id);
        return {
          tmdbId: meta?.moviedb_id ? String(meta.moviedb_id) : null,
          imdbId: topMatch.id,
        };
      }
    } catch {}
  }
  return { tmdbId: null, imdbId: null };
}

export async function getMediaDetail(id: string): Promise<MediaDetail | null> {
  if (id.startsWith("al-")) {
    const anilistId = parseInt(id.slice(3), 10);
    if (Number.isFinite(anilistId)) {
      const raw = await fetchAniListById(anilistId);
      if (raw) {
        const summary = mapAniListToSummary(raw);
        const streamIds = await resolveAniListStreamIds(raw);
        const provenance = [
          { provider: "anilist", external_id: String(raw.id) },
        ];
        if (raw.idMal) {
          provenance.push({ provider: "mal", external_id: String(raw.idMal) });
        }
        if (streamIds.tmdbId) {
          provenance.push({ provider: "tmdb", external_id: streamIds.tmdbId });
        }
        if (streamIds.imdbId) {
          provenance.push({ provider: "imdb", external_id: streamIds.imdbId });
        }
        const titles = [
          { title: summary.title, title_type: "english", language: "en" },
        ];
        if (raw.title?.romaji && raw.title.romaji !== summary.title) {
          titles.push({ title: raw.title.romaji, title_type: "romaji", language: "ja-ro" });
        }
        if (raw.title?.native) {
          titles.push({ title: raw.title.native, title_type: "native", language: "ja" });
        }
        return {
          ...summary,
          runtime: raw.duration || 24,
          original_language: "ja",
          country_of_origin: "JP",
          is_adult: false,
          titles,
          provenance,
          season_count: raw.format === "MOVIE" ? 0 : 1,
          episode_count: raw.episodes || (raw.format === "MOVIE" ? 1 : 12),
        };
      }
    }
  }

  if (id.startsWith("tt")) {
    const meta = await fetchCinemetaMeta(id);
    if (meta) {
      const summary = mapCinemetaToSummary(
        meta,
        meta.type === "series" ? "TV_SHOW" : "MOVIE"
      );
      const runtimeMatch = (meta.runtime || "").match(/\d+/);
      const seasonSet = new Set(
        (meta.videos || [])
          .map((v) => v.season)
          .filter((s): s is number => typeof s === "number" && s > 0)
      );
      const provenance = [];
      if (meta.moviedb_id) {
        provenance.push({ provider: "tmdb", external_id: String(meta.moviedb_id) });
      }
      provenance.push({ provider: "imdb", external_id: id });
      return {
        ...summary,
        runtime: runtimeMatch ? parseInt(runtimeMatch[0], 10) : summary.media_type === "MOVIE" ? 125 : 50,
        original_language: "en",
        country_of_origin: "US",
        is_adult: false,
        titles: [{ title: summary.title, title_type: "primary", language: "en" }],
        provenance,
        season_count: seasonSet.size,
        episode_count: (meta.videos || []).filter((v) => (v.season || 0) > 0).length,
      };
    }
  }

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
  if (id.startsWith("al-")) {
    const anilistId = parseInt(id.slice(3), 10);
    if (Number.isFinite(anilistId)) {
      const raw = await fetchAniListById(anilistId);
      const edges = raw?.characters?.edges || [];
      if (edges.length > 0) {
        return {
          cast: edges.map((edge, idx) => {
            const va = edge.voiceActors?.[0];
            return {
              id: `al-cast-${anilistId}-${idx}`,
              person_id: `al-va-${va?.id || idx}`,
              name: va?.name?.full || edge.node?.name?.full || "Voice Actor",
              character_name: edge.node?.name?.full || "Character",
              profile_path: va?.image?.large || edge.node?.image?.large || null,
              order: idx,
            };
          }),
          crew: [],
        };
      }
    }
  }

  if (id.startsWith("tt")) {
    const meta = await fetchCinemetaMeta(id);
    if (meta && (meta.cast?.length || meta.director?.length)) {
      return {
        cast: (meta.cast || []).slice(0, 10).map((name, idx) => ({
          id: `cast-${id}-${idx}`,
          person_id: `p-${idx}`,
          name,
          character_name: idx === 0 ? "Lead Role" : "Cast",
          profile_path: null,
          order: idx,
        })),
        crew: (meta.director || []).map((name, idx) => ({
          id: `crew-${id}-${idx}`,
          person_id: `d-${idx}`,
          name,
          department: "Directing",
          job: "Director",
          profile_path: null,
        })),
      };
    }
  }

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
  if (id.startsWith("al-")) {
    const anilistId = parseInt(id.slice(3), 10);
    if (Number.isFinite(anilistId)) {
      const raw = await fetchAniListById(anilistId);
      if (raw && raw.format !== "MOVIE") {
        const epTotal = Math.min(Math.max(raw.episodes || 12, 1), 100);
        const episodes: Episode[] = Array.from({ length: epTotal }, (_, idx) => ({
          id: `${id}-s1-e${idx + 1}`,
          season_id: `${id}-s1`,
          media_id: id,
          episode_number: idx + 1,
          title: `Episode ${idx + 1} (SUB / DUB)`,
          overview: `Stream Episode ${idx + 1} of ${raw.title?.english || raw.title?.romaji || "Anime"}.`,
          still_path: raw.bannerImage || raw.coverImage?.extraLarge || null,
          air_date: raw.seasonYear ? `${raw.seasonYear}-01-01` : null,
          runtime: raw.duration || 24,
        }));
        return [
          {
            id: `${id}-season-1`,
            season_number: 1,
            title: raw.season && raw.seasonYear ? `Season 1 (${raw.season} ${raw.seasonYear})` : "Season 1",
            overview: stripHtml(raw.description),
            poster_path: raw.coverImage?.extraLarge || null,
            air_date: raw.seasonYear ? `${raw.seasonYear}-01-01` : null,
            episode_count: epTotal,
            episodes,
          },
        ];
      }
    }
  }

  if (id.startsWith("tt")) {
    const meta = await fetchCinemetaMeta(id);
    if (meta?.videos && meta.videos.length > 0) {
      const grouped = new Map<number, Episode[]>();
      for (const v of meta.videos) {
        const sNum = v.season || 0;
        const epNum = v.episode || v.number || 0;
        if (sNum <= 0 || epNum <= 0) continue;
        if (!grouped.has(sNum)) grouped.set(sNum, []);
        grouped.get(sNum)!.push({
          id: v.id || `${id}-${sNum}-${epNum}`,
          season_id: `${id}-s${sNum}`,
          media_id: id,
          episode_number: epNum,
          title: v.name || v.title || `Episode ${epNum}`,
          overview: v.overview || v.description || null,
          still_path: v.thumbnail || null,
          air_date: (v.released || v.firstAired || "").slice(0, 10) || null,
          runtime: null,
        });
      }
      return Array.from(grouped.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([seasonNumber, eps]) => ({
          id: `${id}-season-${seasonNumber}`,
          season_number: seasonNumber,
          title: `Season ${seasonNumber}`,
          overview: null,
          poster_path: meta.poster || null,
          air_date: eps[0]?.air_date || null,
          episode_count: eps.length,
          episodes: eps.sort((a, b) => a.episode_number - b.episode_number),
        }));
    }
  }

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

  const sNum = season || 1;
  const epNum = episode || 1;

  // Live AniList al-... title playback resolution
  if (id.startsWith("al-")) {
    const anilistId = parseInt(id.slice(3), 10);
    if (Number.isFinite(anilistId)) {
      const raw = await fetchAniListById(anilistId);
      if (raw) {
        const streamIds = await resolveAniListStreamIds(raw);
        if (streamIds.imdbId) {
          return getPlaybackOptions(streamIds.imdbId, sNum, epNum);
        }
      }
    }
  }

  // Live Cinemeta tt... title playback resolution
  if (id.startsWith("tt")) {
    const meta = await fetchCinemetaMeta(id);
    const isMovie = meta?.type !== "series";
    const tmdbId = meta?.moviedb_id ? String(meta.moviedb_id) : null;
    const title = meta?.name || "Featured Stream";

    const sources = [];
    if (tmdbId) {
      sources.push({
        id: "vidlink-primary",
        name: "Server 1 (VidLink HD)",
        embed_url: isMovie
          ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=e11d48&secondaryColor=fbbf24`
          : `https://vidlink.pro/tv/${tmdbId}/${sNum}/${epNum}?primaryColor=e11d48&secondaryColor=fbbf24`,
        domain: "vidlink.pro",
        is_primary: true,
      });
    }
    sources.push({
      id: "vidsrc",
      name: tmdbId ? "Server 2 (VidSrc)" : "Server 1 (VidSrc HD)",
      embed_url: isMovie
        ? tmdbId
          ? `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`
          : `https://vidsrc.me/embed/movie?imdb=${id}`
        : tmdbId
        ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${sNum}&episode=${epNum}`
        : `https://vidsrc.me/embed/tv?imdb=${id}&season=${sNum}&episode=${epNum}`,
      domain: "vidsrc.me",
      is_primary: !tmdbId,
    });
    sources.push({
      id: "2embed",
      name: "Server 3 (2Embed HD)",
      embed_url: isMovie
        ? `https://www.2embed.cc/embed/${tmdbId || id}`
        : `https://www.2embed.cc/embedtv/${tmdbId || id}&s=${sNum}&e=${epNum}`,
      domain: "2embed.cc",
      is_primary: false,
    });
    if (tmdbId) {
      sources.push({
        id: "reelsdownload",
        name: "Server 4 (Reels)",
        embed_url: isMovie
          ? `https://embed.reelsdownload.online/player/${tmdbId}?key=k_5661ac637169a1733857dc50`
          : `https://embed.reelsdownload.online/player/${tmdbId}?key=k_5661ac637169a1733857dc50&s=${sNum}&e=${epNum}`,
        domain: "embed.reelsdownload.online",
        is_primary: false,
      });
      sources.push({
        id: isMovie ? "vidbolt" : "vidbolt-tv",
        name: "Server 5 (Vidbolt)",
        embed_url: isMovie
          ? `https://vidbolt.xyz/movie/${tmdbId}`
          : `https://vidbolt.xyz/tv/${tmdbId}/${sNum}/${epNum}`,
        domain: "vidbolt.xyz",
        is_primary: false,
      });
    }

    return {
      media_id: id,
      media_type: isMovie ? "MOVIE" : "TV_SHOW",
      title,
      has_stream: true,
      tmdb_id: tmdbId,
      season_number: isMovie ? null : sNum,
      episode_number: isMovie ? null : epNum,
      embed_sources: sources,
      sandbox_policy: "",
      referrer_policy: "origin",
    };
  }

  const resolved = resolveTmdbId(id);
  const item = MOCK_ITEMS.find((m) => m.id === id) || MOCK_HERO;
  const isMovie = item.media_type === "MOVIE";

  const vidlinkUrl = isMovie
    ? `https://vidlink.pro/movie/${resolved.tmdb_id}?primaryColor=e11d48&secondaryColor=fbbf24`
    : `https://vidlink.pro/tv/${resolved.tmdb_id}/${sNum}/${epNum}?primaryColor=e11d48&secondaryColor=fbbf24`;

  const vidsrcUrl = isMovie
    ? `https://vidsrc.me/embed/movie?tmdb=${resolved.tmdb_id}`
    : `https://vidsrc.me/embed/tv?tmdb=${resolved.tmdb_id}&season=${sNum}&episode=${epNum}`;

  const twoEmbedUrl = isMovie
    ? `https://www.2embed.cc/embed/${resolved.tmdb_id}`
    : `https://www.2embed.cc/embedtv/${resolved.tmdb_id}&s=${sNum}&e=${epNum}`;

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
        name: "Server 1 (VidLink HD)",
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
        id: "reelsdownload",
        name: "Server 4 (Reels)",
        embed_url: reelsUrl,
        domain: "embed.reelsdownload.online",
        is_primary: false,
      },
      {
        id: isMovie ? "vidbolt" : "vidbolt-tv",
        name: "Server 5 (Vidbolt)",
        embed_url: vidboltUrl,
        domain: "vidbolt.xyz",
        is_primary: false,
      },
    ],
    sandbox_policy: "",
    referrer_policy: "origin",
  };

  return safeFetch(`${API_BASE_URL}/media/${id}/playback-options${qStr}`, fallback);
}

