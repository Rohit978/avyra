# Phase 10: Frontend Discovery & Cinematic Web UI - Context

## Requirements
- **UI-01**: User can experience a responsive, dark cinematic home page with hero showcase and horizontal scroll carousels.
- **UI-02**: User can browse dedicated listing pages for `/movies`, `/tv`, and `/anime` with responsive card grids.
- **UI-03**: User can search from navigation header with immediate suggestion popover and full results page.
- **UI-04**: User can navigate tabs on detail pages (Overview, Cast, Episodes, Watch/Player) across mobile and desktop.
- **UI-05**: User interface displays skeleton loaders during loading states and graceful error boundaries on network failure.

## Design Decisions
1. **Design System & Aesthetics**:
   - Palette: Deep charcoal & obsidian background (`#0b0c0f`), elevated surfaces (`#13151b`), subtle borders (`#282c37`), vibrant cinematic accent (`#e50914` primary, `#00f0ff` cyan accent).
   - Card Aspect Ratios: Poster 2:3 (`aspect-[2/3]`) with gradient overlays, ratings badge, and release year pill.
2. **Navigation & Search**:
   - Fixed header with blurred background (`backdrop-blur-md bg-background/80`).
   - Search popover triggered on type, debouncing requests (300ms) to `/api/v1/search/suggestions`.
   - "View all results" link leading to `/search?q=...`.
3. **Detail Page Experience**:
   - Dynamic route `/media/[id]`.
   - Hero banner with backdrop image, title, metadata pills, rating, and quick action buttons ("Watch Now", "Add to Watchlist").
   - Tabbed sections: Overview & Details, Cast & Crew, Episodes (with Season selector for TV/Anime), and Watch / Stream Embed Player (`<Player />`).
4. **Resilience & Loading**:
   - Skeleton cards with pulsing animations (`animate-pulse bg-neutral-800`).
   - Clean empty states and fallback images when poster or backdrop URLs are missing.
