# Phase 10: Frontend Discovery & Cinematic Web UI - Research

## 1. Next.js 15 App Router Structure
- `src/app/layout.tsx`: Root layout with persistent `<Navbar />` and `<Footer />`.
- `src/app/page.tsx`: Home page with Hero Showcase, Trending carousel, Popular carousel, Top Rated carousel, and Upcoming releases.
- `src/app/movies/page.tsx`: Movies catalogue with genre and year filter bar.
- `src/app/tv/page.tsx`: TV Series catalogue with filters.
- `src/app/anime/page.tsx`: Anime catalogue with filters.
- `src/app/search/page.tsx`: Full search results page with query parameters.
- `src/app/media/[id]/page.tsx`: Interactive Media Detail page with client tabs, episodes selector, and stream player.

## 2. API Integration Layer
- Create `src/lib/api.ts` wrapping fetch calls to the FastAPI backend (`http://127.0.0.1:8000` or `NEXT_PUBLIC_API_URL`):
  - `fetchTrending()`, `fetchPopular()`, `fetchTopRated()`, `fetchUpcoming()`
  - `fetchMediaList(mediaType, genre, year, page)`
  - `fetchMediaDetail(id)`
  - `fetchMediaCredits(id)`
  - `fetchMediaSeasons(id)`
  - `fetchSeasonDetail(id, seasonNumber)`
  - `fetchPlaybackOptions(id, season, episode)`
  - `searchMedia(query, page)`
  - `fetchSuggestions(query)`
- Provide sensible fallback mock data so frontend components render gracefully even when backend is offline during static builds or client-side development.

## 3. Component Architecture
- `src/components/Navbar.tsx`: Search input with suggestion popup, links (`Movies`, `TV Shows`, `Anime`, `Watchlist`).
- `src/components/Footer.tsx`: Brand credits and provenance tags.
- `src/components/MediaCard.tsx`: Standard 2:3 card with poster image, rating pill, title, and release date.
- `src/components/MediaCarousel.tsx`: Horizontal scroll slider with previous/next controls.
- `src/components/HeroShowcase.tsx`: High-impact cinematic banner with backdrop, synopsis, and action CTA.
- `src/components/MediaCardSkeleton.tsx`: Pulsing skeleton placeholder.
