Cineverse --- Product Requirements Document (PRD)
Document version: 1.0
Status: Draft for implementation
Product type: Web-based hybrid media discovery, catalogue and
licensed-playback platform
Initial budget: ₹0 (local development and eligible free tiers)
Primary languages: English initially; architecture should support
localization
Initial market: Global catalogue, with India as the first
availability region
Working product name: Cineverse
1. Executive Summary
Cineverse is a unified media discovery platform for movies, television
series, anime, documentaries and short films. It combines metadata from
multiple external catalogues into one normalized, searchable database
and provides a polished interface for discovering titles, viewing
detailed information, managing watchlists and finding legitimate ways to
watch.

Cineverse is a catalogue and discovery product first. It is not
intended to copy, host, scrape, proxy or redistribute copyrighted video
from unauthorized sources. Playback is limited to content owned by
Cineverse, content licensed to Cineverse, or embeds/deep links
explicitly authorized by the relevant rights holder or provider.

The product's central technical asset is its provider-independent media
catalogue. Each title receives an internal UUID and may be linked to
external identifiers from TMDB, AniList, Jikan/MyAnimeList, TVmaze and
future providers. Provider adapters normalize source data, preserve
provenance, resolve duplicates conservatively and synchronize changes
through repeatable background jobs.

The first release should be a functional, responsive public discovery
website backed by FastAPI and PostgreSQL. It should prove that multiple
metadata providers can feed one consistent catalogue before advanced
personalization, large-scale search infrastructure or video delivery is
introduced.
2. Product Vision
Vision: Make it easy to discover, understand and track any film,
series or anime from one consistent interface, regardless of which
metadata provider originally catalogued it.
2.1 Product principles
1. Provider independence: The internal catalogue must not depend on
   one provider's identifiers or response format.
2. Metadata transparency: Users and operators should be able to
   identify the source of important metadata.
3. Legal playback: A title's presence in the catalogue does not
   imply that Cineverse has streaming rights.
4. Correctness over apparent completeness: Do not fabricate missing
   data or merge uncertain matches.
5. Incremental growth: Start as a modular monolith; add
   infrastructure only when measured need justifies it.
6. Responsive by default: Core discovery and account workflows must
   work on desktop, tablet and mobile.
7. Accessible design: Keyboard navigation, semantic markup,
   readable contrast and assistive-technology support are required.
8. Cost awareness: Prefer local development and free/open-source
   components, while respecting provider quotas and commercial-use
   restrictions.
3. Goals and Non-Goals
3.1 Goals
- Provide a unified catalogue for movies, TV shows, anime,
  documentaries and short films.
- Import and update metadata from approved external providers.
- Map multiple provider IDs to one internal media record.
- Prevent duplicate records and preserve source provenance.
- Offer global search, filters, sorting and detail pages.
- Display seasons and episodes where available.
- Allow registered users to create watchlists and track viewing
  progress.
- Display legitimate streaming availability and provider deep links
  where supported.
- Provide a protected administration area for ingestion health and
  catalogue diagnostics.
- Run locally at zero infrastructure cost for development.
- Make the codebase testable, documented and deployable.
3.2 Non-goals for the initial release
- Hosting or distributing commercial movies or anime.
- Finding, scraping or resolving unauthorized streaming links.
- Circumventing DRM, paywalls, access controls, geographic
  restrictions or provider authentication.
- Guaranteeing that every title ever produced exists in the catalogue.
- Building a social network, messaging system or public review
  community.
- Building a native Android/iOS app.
- Building a machine-learning recommendation engine.
- Deploying Kubernetes, microservices or a custom CDN.
- Downloading and mirroring third-party posters or backdrops unless
  provider terms expressly permit it.
- Guaranteeing real-time streaming availability in every country.
4. Target Users and Personas
4.1 Casual explorer
Wants to browse popular, trending and newly released content without
knowing exactly what to search for.

Needs: attractive home page, curated rows, genre browsing, useful
details and low-friction navigation.
4.2 Specific-title seeker
Knows a title, actor, director, alternate title or franchise and wants
to find the correct record quickly.

Needs: fast search, alternate-language titles, typo tolerance,
external ID resolution and clear disambiguation.
4.3 Anime fan
Wants anime-specific information such as native and romanized titles,
season, format, studios, episode count, airing status and related works.

Needs: AniList/Jikan enrichment, anime filters, seasonal browsing
and episode tracking.
4.4 Returning registered user
Wants to save titles and continue tracking series.

Needs: account, watchlists, watched status, episode progress and
reliable synchronization across sessions.
4.5 Catalogue administrator
Needs to understand provider health, import progress, failures,
duplicates and stale records.

Needs: protected admin dashboard, ingestion run history, retry
controls, provider status and audit logs.
5. Scope and Release Boundaries
5.1 MVP scope
- Responsive public website.
- Home page with trending/popular sections where supported.
- Browse pages for movies, TV, anime, documentaries and short films.
- Search and basic filters.
- Media detail pages.
- External provider ID mapping.
- TMDB and AniList integrations as the initial primary providers.
- Jikan and TVmaze adapters as optional enrichment providers, subject
  to terms and rate limits.
- PostgreSQL catalogue and migrations.
- Repeatable ingestion commands and scheduled incremental jobs.
- User registration/login.
- Personal watchlists.
- Basic watched/progress tracking.
- Streaming availability/deep links only from a permitted provider.
- Admin-only ingestion status and retry functions.
- Tests, Docker local setup, README and environment example.
5.2 Post-MVP scope
- Meilisearch when PostgreSQL search is demonstrably insufficient.
- Redis for shared caching, rate limiting or job coordination.
- More metadata providers and licensed availability providers.
- Recommendations based on explicit user preferences and later viewing
  signals.
- Social lists and sharing.
- Localization and region-aware release dates.
- PWA support.
- Native mobile client.
- Analytics dashboards and advanced catalogue quality scoring.
6. Supported Content Model
Cineverse uses one common Media entity with a controlled media_type:
- MOVIE
- TV_SHOW
- ANIME
- DOCUMENTARY
- SHORT_FILM
Anime is represented as a distinct catalogue type for discovery and
filtering, even when a provider also classifies it as a TV series or
movie. Provider-specific classifications must be preserved in source
metadata.
6.1 Core metadata fields
- Internal UUID.
- Media type.
- Primary display title.
- Original title.
- Alternate titles with language and title type.
- Overview/synopsis.
- Release date and optional end date.
- Original language.
- Country/region of origin.
- Runtime where applicable.
- Content/adult flag where supplied.
- Status (released, upcoming, ongoing, completed, cancelled, unknown).
- Popularity and rating values with provider provenance.
- Vote count and rating source.
- Genres.
- Images: poster, backdrop, logo, still, profile.
- Cast, crew, voice actors and character names.
- External provider identifiers.
- Seasons and episodes.
- Related titles and recommendations where available.
- Streaming availability by region, provider and access type.
- Created/updated timestamps and source refresh timestamps.
Missing information must remain null/unknown rather than being inferred.
7. Data Providers and Licensing
7.1 Initial provider plan
  Provider                Intended use            Integration
  TMDB                    Movie/TV metadata,      REST API
people, genres, images,
seasons, watch-provider
information where
permitted               

  AniList                 Anime titles, formats,  GraphQL
seasons, studios,
genres, characters and
relations               

  Jikan                   Optional                REST API
MyAnimeList-derived
anime enrichment        
TVmaze                  Optional TV show and    REST API
episode enrichment
7.2 Provider adapter contract
Every adapter should implement a common interface where applicable:
- search(query, filters)
- get_details(external_id)
- get_popular(page)
- get_trending(page_or_window) if supported
- get_catalogue_page(page, filters) only where the provider supports
  it
- get_seasons(external_id) / get_episodes(external_id) where
  applicable
- normalize(raw_record)
- health_check()
Do not pretend a provider supports an operation it does not expose.
Unsupported methods should return a clear capability result.
7.3 Compliance requirements
- Review and comply with each provider's current API terms,
  attribution rules, caching limits, image rules, rate limits and
  commercial-use requirements before launch.
- TMDB's free developer access is subject to its non-commercial terms
  and attribution requirements; commercial operation requires
  appropriate licensing.
- Do not assume that public API access grants rights to redistribute
  all images or metadata indefinitely.
- Store source identifiers and provenance.
- Respect deletion, correction and takedown requests.
- Do not scrape websites or bypass access controls when an official
  API or authorized feed is unavailable.
- Do not present a provider's data as original Cineverse-owned data.
- Keep provider credentials server-side and never expose secrets to
  the browser.
- Make provider-specific attribution visible in the product where
  required.
Launch gate: Public/commercial release must not proceed until
applicable provider terms and rights have been reviewed for the intended
use.
8. User Journeys
8.1 Discover a title
1. User opens home page.
2. API returns available trending/popular rows.
3. User selects a media card.
4. Detail page displays title, synopsis, artwork, genres, release
   details, cast and related information.
5. Where available, page shows legitimate provider availability links.
8.2 Search for a title
1. User enters a query.
2. Frontend debounces input and calls search suggestions.
3. Backend searches primary title, alternate titles and indexed people.
4. Results are grouped or labelled by media type.
5. User applies filters and opens a result.
8.3 Track anime progress
1. User signs in.
2. User saves an anime to a watchlist.
3. User marks the title as watching.
4. User selects a season/episode and updates progress.
5. Progress is stored against the user's account and the internal
   media/episode IDs.
8.4 Catalogue ingestion
1. Administrator or scheduler starts an ingestion run.
2. Worker requests provider pages within rate limits.
3. Raw response is validated and optionally snapshotted.
4. Adapter normalizes the record.
5. Resolver checks provider IDs and possible matches.
6. Importer creates or updates the internal record transactionally.
7. Provenance and run statistics are recorded.
8. Search index is updated (PostgreSQL initially).
9. Failed records are logged for retry without failing the entire run.
9. Functional Requirements
Priority levels: P0 = required for MVP, P1 = important next
increment, P2 = later enhancement.
9.1 Home and discovery
- FR-001 (P0): Display a responsive home page.
- FR-002 (P0): Show trending/popular rows when provider data is
  available.
- FR-003 (P0): Show separate rows or navigation for movies, TV and
  anime.
- FR-004 (P1): Show upcoming and seasonal collections.
- FR-005 (P1): Allow a user to continue from a recently viewed or
  saved item.
- FR-006 (P1): Support pagination or cursor-based loading for long
  lists.
9.2 Catalogue browsing
- FR-010 (P0): Browse all supported media types.
- FR-011 (P0): Filter by media type, genre and release year.
- FR-012 (P0): Sort by popularity, rating, release date and title.
- FR-013 (P1): Filter by language, country and status.
- FR-014 (P1): Support anime format, season and airing status
  filters where data exists.
- FR-015 (P1): Clearly label missing or provider-dependent values.
9.3 Search
- FR-020 (P0): Search primary and alternate titles.
- FR-021 (P0): Support type, genre and year filters.
- FR-022 (P0): Provide paginated results.
- FR-023 (P1): Provide debounced autocomplete.
- FR-024 (P1): Search people and characters.
- FR-025 (P1): Support typo-tolerant matching.
- FR-026 (P1): Resolve external IDs to internal records.
- FR-027 (P2): Add relevance tuning and dedicated search
  infrastructure.
9.4 Media detail pages
- FR-030 (P0): Display title, overview, artwork, type, release
  date, genres and available ratings.
- FR-031 (P0): Display external IDs only where useful; internal
  UUID remains canonical.
- FR-032 (P0): Display cast/crew when supplied.
- FR-033 (P0): Display seasons and episodes for episodic media.
- FR-034 (P1): Display trailers using authorized provider embeds
  or links.
- FR-035 (P1): Display related titles and recommendations.
- FR-036 (P0): Display a clear unavailable-data state instead of
  fabricated values.
- FR-037 (P0): Display legitimate streaming availability only when
  verified by a supported source.
9.5 Accounts and personal library
- FR-040 (P0): Register with email, username and password.
- FR-041 (P0): Sign in and sign out securely.
- FR-042 (P0): View and update basic profile details.
- FR-043 (P0): Create, rename and delete personal watchlists.
- FR-044 (P0): Add/remove catalogue titles from a watchlist.
- FR-045 (P1): Track status such as plan-to-watch, watching,
  completed, paused and dropped.
- FR-046 (P1): Track episode progress.
- FR-047 (P1): Allow users to export their personal data.
- FR-048 (P1): Provide account deletion.
9.6 Playback and availability
- FR-050 (P0): Separate metadata availability from playback
  rights.
- FR-051 (P0): Show provider deep links when returned by a
  licensed/authorized availability source.
- FR-052 (P0): Do not expose arbitrary user-supplied iframe URLs.
- FR-053 (P0): Only render embeds from an explicit allowlist of
  approved providers.
- FR-054 (P1): Support authorized playback for owned or licensed
  assets.
- FR-055 (P1): Record region and last-verified time for
  availability data.
- FR-056 (P1): Explain when no legal provider availability is
  known.
9.7 Administration
- FR-060 (P0): Protect admin routes with role-based authorization.
- FR-061 (P0): Show provider status and last successful sync.
- FR-062 (P0): Show ingestion run status, duration and record
  counts.
- FR-063 (P0): Show failed record summaries.
- FR-064 (P0): Allow safe retry of failed ingestion records.
- FR-065 (P1): Show duplicate candidates for review.
- FR-066 (P1): Show stale catalogue records and provider coverage.
- FR-067 (P1): Record admin actions in an audit log.
10. Non-Functional Requirements
10.1 Performance targets
Targets for the MVP under modest load; validate through tests rather
than assuming they are achieved.
- Home page API p95: under 800 ms with warm cache.
- Local catalogue detail API p95: under 500 ms.
- Search API p95: under 1 second for the initial catalogue size.
- Initial page load: optimize for Core Web Vitals and avoid blocking
  on nonessential external providers.
- Images should use responsive sizing and lazy loading.
- Paginate all potentially large results.
- Never perform a full provider catalogue crawl during a user-facing
  request.
10.2 Availability and resilience
- User-facing browsing should continue if an external metadata
  provider is unavailable, using previously stored data.
- Provider timeouts must not block the whole home page.
- Jobs must be retryable and idempotent.
- Use bounded retries with exponential backoff and jitter.
- Respect Retry-After and provider rate-limit headers where present.
- Record provider errors and last successful synchronization.
- Database backups and restore procedures must be documented before
  production.
10.3 Security
- Hash passwords using Argon2id or another maintained password hashing
  implementation.
- Use secure, HttpOnly, SameSite cookies for browser sessions where
  feasible.
- Protect state-changing requests against CSRF where cookie
  authentication is used.
- Apply rate limits to authentication, search and admin endpoints.
- Validate all inputs with Pydantic.
- Use SQLAlchemy parameterization; never concatenate untrusted SQL.
- Store secrets in environment variables or a secret manager.
- Restrict CORS to known frontend origins.
- Enforce object-level authorization for watchlists and progress.
- Use an explicit playback domain allowlist.
- Avoid logging passwords, tokens, cookies or sensitive personal data.
- Keep dependencies patched and scan for known vulnerabilities.
- Apply least-privilege database credentials.
- Provide a privacy policy and data deletion workflow before public
  account registration.
10.4 Accessibility and usability
- Semantic HTML and accessible names.
- Full keyboard navigation.
- Visible focus indicators.
- Sufficient color contrast.
- Captions or accessible alternatives for product-owned video.
- Respect reduced-motion preferences.
- Responsive layout from small mobile screens to desktop.
- Clear loading, empty, error and offline states.
11. Database Design
11.1 Main entities
The relational model should include:
- users
- media
- external_ids
- media_titles
- genres
- media_genres
- people
- credits
- seasons
- episodes
- media_images
- watchlists
- watchlist_items
- watch_progress
- streaming_providers
- streaming_availability
- ingestion_runs
- ingestion_records
- provider_snapshots
- field_provenance
- admin_audit_logs (P1)
11.2 Key data rules
- Use UUID as the internal primary key for media and users.
- external_ids must enforce uniqueness on (provider, external_id).
- A media record may have at most one ID per provider unless the
  provider model explicitly requires otherwise.
- Never merge records solely because their titles match.
- Preserve raw provider values when useful for debugging and
  reprocessing.
- Store dates as DATE when they represent calendar dates, not
  timestamps.
- Store timestamps as timezone-aware values.
- Use JSONB for provider-specific attributes, not as a replacement for
  core relational fields.
- Use transactions for media upsert and external ID mapping.
- Index common filters, joins and sort keys.
- Add a unique constraint for user progress at the correct
  granularity, such as (user_id, media_id, episode_id) with
  appropriate handling for title-level progress.
- Define deletion behavior deliberately; provider deletion must not
  accidentally cascade-delete a user's watchlist history.
11.3 Field provenance
For fields where providers may disagree, retain the source and
synchronization time. Define a field-level precedence policy, and do not
overwrite a non-empty trusted value with null or lower-confidence data.
12. Ingestion and Synchronization Design
12.1 Pipeline stages
1. Discovery: obtain provider records using documented endpoints
   and pagination.
2. Fetch details: request detailed metadata only where useful and
   within quota.
3. Validate: check payload shape and required fields.
4. Snapshot: optionally preserve raw payloads with retention
   limits.
5. Normalize: map provider response into a common internal DTO.
6. Resolve identity: match by external ID or verified
   cross-provider mapping.
7. Deduplicate: produce candidates for uncertain matches; do not
   auto-merge low-confidence matches.
8. Upsert: persist the media record and provider mapping
   transactionally.
9. Enrich: fetch credits, images, seasons and episodes as quota
   permits.
10. Index: update PostgreSQL search fields; later update
    Meilisearch.
11. Report: record run metrics, failures and cursor/page progress.
12.2 Idempotency
Running the same page twice must not create duplicate media or external
IDs. Use database unique constraints and upsert logic. Each ingestion
task should have a stable provider/page or provider/external-ID key.
12.3 Scheduling
Initial suggested schedule, adjustable to provider terms and quotas:
- Trending/popular feeds: daily.
- Upcoming releases: daily.
- Seasonal anime: daily.
- Catalogue page discovery: incremental and quota-aware.
- Existing detail refresh: every 7--30 days depending on provider
  change frequency.
- Availability refresh: according to the licensed provider's terms and
  freshness guarantees.
Do not claim that these feeds cover every item in existence. Provider
coverage, pagination, API access and licensing impose limits.
12.4 Failure handling
- Retry transient network errors and server errors.
- Do not repeatedly retry permanent validation or authorization
  failures.
- Respect provider rate-limit headers.
- Use dead-letter/error records after retry exhaustion.
- Continue processing other records when one record fails.
- Expose run-level and record-level error details to admins.
- Support resuming from a saved page/cursor where provider behavior
  permits.
13. API Contract
Base path: /api/v1
13.1 Public catalogue
  Method   Path                             Purpose
  GET      /media                         Browse unified catalogue
GET      /media/{id}                    Media details
GET      /movies                        Movie listing
GET      /tv                            TV listing
GET      /anime                         Anime listing
GET      /documentaries                 Documentary listing
GET      /short-films                   Short-film listing
GET      /trending                      Trending collection
GET      /popular                       Popular collection
GET      /upcoming                      Upcoming collection
GET      /top-rated                     Top-rated collection
GET      /search                        Search titles and alternate titles
GET      /search/suggestions            Autocomplete
GET      /media/{id}/credits            Credits
GET      /media/{id}/images             Artwork
GET      /media/{id}/recommendations    Related recommendations
GET      /media/{id}/seasons            Seasons
GET      /seasons/{id}/episodes         Episodes
GET      /media/{id}/availability       Licensed availability
GET      /media/{id}/playback-options   Approved playback choices
13.2 Account and personal library
  Method   Path                                  Purpose
  POST     /auth/register                      Register
POST     /auth/login                         Login
POST     /auth/refresh                       Refresh session
POST     /auth/logout                        Logout
GET      /users/me                           Current profile
PATCH    /users/me                           Update profile
GET      /users/me/watchlists                List watchlists
POST     /users/me/watchlists                Create watchlist
PATCH    /watchlists/{id}                    Rename/update list
DELETE   /watchlists/{id}                    Delete list
POST     /watchlists/{id}/items              Add title
DELETE   /watchlists/{id}/items/{media_id}   Remove title
GET      /users/me/progress                  Get progress
PUT      /users/me/progress                  Update progress
13.3 Admin
  Method   Path                            Purpose
  GET      /admin/ingestion/runs         List runs
GET      /admin/ingestion/runs/{id}    Run details
POST     /admin/ingestion/start        Start permitted job
POST     /admin/ingestion/retry/{id}   Retry failures
GET      /admin/providers              Provider health
GET      /admin/catalogue/stats        Catalogue statistics
GET      /admin/duplicates             Duplicate candidates
13.4 API behavior standards
- Use consistent response envelopes and error formats.
- Use page/limit or cursor pagination consistently.
- Enforce maximum page size.
- Validate sort fields against an allowlist.
- Return 404 for missing resources, 401 for unauthenticated
  requests, 403 for unauthorized requests, 422 for validation
  failures and suitable 429 responses for rate limiting.
- Never return internal stack traces to clients.
- Publish OpenAPI documentation through FastAPI.
- Version breaking API changes.
14. Frontend Information Architecture
14.1 Routes
- / --- Home
- /movies --- Movies
- /tv --- TV shows
- /anime --- Anime
- /documentaries --- Documentaries
- /short-films --- Short films
- /discover --- Advanced discovery
- /search --- Search results
- /title/[id] --- Media detail
- /watch/[id] --- Authorized playback or provider redirect
- /my-list --- User watchlists
- /profile --- Profile and preferences
- /login and /register --- Authentication
- /admin --- Protected admin dashboard
14.2 Shared components
- Navigation bar and mobile navigation.
- Search input and suggestion panel.
- Hero banner.
- Media card and poster.
- Horizontal media carousel.
- Responsive media grid.
- Filter drawer and sort control.
- Rating and release metadata.
- Genre chips.
- Cast/crew list.
- Season selector and episode list.
- Streaming availability card.
- Watchlist control.
- Pagination/load-more control.
- Loading skeletons, empty states and error boundaries.
14.3 Design direction
- Dark cinematic interface with restrained accent color.
- Strong poster imagery and readable typography.
- Avoid excessive animation and large layout shifts.
- Poster aspect ratio should be consistent.
- Use responsive image sizing and lazy loading.
- Do not hotlink images unless provider terms allow it.
- Respect reduced-motion settings.
- Ensure the interface remains useful if images or external services
  fail.
15. Recommended Technical Stack
  Layer                   Technology              Reason
  Frontend                Next.js, React,         SSR/SEO and component
TypeScript              ecosystem

  Styling                 Tailwind CSS            Fast consistent styling

  Backend                 Python FastAPI          Typed API and Python
ecosystem

  ORM                     SQLAlchemy 2.x          Relational persistence

  Migrations              Alembic                 Versioned schema
changes

  Validation              Pydantic                Request and provider
payload validation

  Database                PostgreSQL              Main source of truth

  Search MVP              PostgreSQL FTS +        Avoid extra service
pg_trgm                 initially

  Background work MVP     Python worker/CLI       Zero-cost local
processing

  Later jobs/cache        Redis + Celery/RQ       When concurrency and
scheduling require it

  Later search            Meilisearch             Dedicated typo-tolerant
search

  Authentication          Secure cookie sessions  Browser account
or JWT with refresh     security
rotation                

  Testing                 pytest, HTTPX,          Backend and frontend
Vitest/Playwright       verification

  Containers              Docker Compose          Reproducible local
environment
CI                      GitHub Actions          Automated tests and
checks
Use a modular monolith for the first release. Do not split the API,
ingestion and search into microservices until there is a measured
reason.
16. Repository Structure
cineverse/
├── frontend/
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── page.tsx
│   │   │   ├── movies/page.tsx
│   │   │   ├── tv/page.tsx
│   │   │   ├── anime/page.tsx
│   │   │   ├── documentaries/page.tsx
│   │   │   ├── short-films/page.tsx
│   │   │   ├── discover/page.tsx
│   │   │   └── search/page.tsx
│   │   ├── title/[id]/page.tsx
│   │   ├── watch/[id]/page.tsx
│   │   ├── my-list/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── admin/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   ├── media/
│   │   ├── search/
│   │   ├── player/
│   │   ├── profile/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   └── types/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── providers/
│   │   ├── ingestion/
│   │   ├── workers/
│   │   ├── database/
│   │   └── main.py
│   ├── migrations/
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── infrastructure/
│   ├── docker-compose.yml
│   ├── postgres/
│   └── scripts/
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   └── ingestion.md
├── .github/workflows/
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
17. Testing and Quality Assurance
17.1 Backend tests
- Provider adapter contract tests using mocked fixtures.
- Normalization tests for complete and partial provider payloads.
- Deduplication tests for exact IDs, cross-provider IDs and ambiguous
  titles.
- Database constraint and transaction tests.
- API endpoint tests for filters, pagination and error cases.
- Authentication and authorization tests.
- Watchlist ownership tests.
- Ingestion idempotency tests.
- Retry and rate-limit handling tests.
17.2 Frontend tests
- Component rendering and interaction tests.
- Search input debounce and result states.
- Filter and pagination behavior.
- Responsive navigation.
- Authentication form validation.
- Watchlist add/remove behavior.
- Loading, empty and error states.
- Keyboard navigation and accessibility checks.
17.3 End-to-end acceptance tests
1. Visitor can open the homepage and browse catalogue rows.
2. Visitor can search for a known movie and anime.
3. Search results open the correct internal detail record.
4. A registered user can create a watchlist and add a title.
5. A user cannot read or edit another user's private watchlist.
6. An admin can inspect an ingestion run.
7. Re-running an ingestion page does not create duplicate records.
8. Provider outage does not make locally stored catalogue details
   unavailable.
9. An unapproved embed domain is rejected.
10. The application works at mobile and desktop breakpoints.
18. Analytics and Success Metrics
Collect only the data needed to improve the product, with appropriate
consent and privacy controls.
Product metrics
- Daily and monthly active users.
- Search usage and search-to-detail conversion.
- Search queries returning no results.
- Detail-page engagement.
- Watchlist creation and title saves.
- Return-user rate.
- Availability-link clicks.
Catalogue metrics
- Total records by media type.
- Records with at least one external ID.
- Duplicate candidate count.
- Percentage of records with title, overview and poster.
- Provider synchronization success rate.
- Median metadata freshness.
- Failed and retried records.
- Episode coverage for episodic titles.
Initial measurable acceptance targets
- At least 95% of successfully fetched valid records are processed
  without an unhandled pipeline failure.
- Reprocessing the same provider record creates no duplicate external
  ID.
- Every imported record has an internal ID and provider provenance.
- Search supports title and alternate-title matching.
- Core browsing works when an external provider is offline.
- All user-specific data is protected by ownership checks.
These are engineering targets, not claims about total worldwide
catalogue coverage.
19. Deployment and Zero-Budget Operations
19.1 Local development
- Run PostgreSQL using Docker Compose.
- Run FastAPI locally or in Docker.
- Run Next.js locally.
- Run ingestion manually with bounded page limits.
- Use a local .env file excluded from Git.
- Keep database data in a named Docker volume.
19.2 Public MVP
Potential free-tier services may be used where their current terms and
quotas fit:
- GitHub for source control and CI.
- Vercel or another eligible host for the frontend.
- Neon or another eligible provider for PostgreSQL.
- Cloudflare Pages for suitable static assets or frontend hosting.
- A backend host only if its free tier supports the required runtime
  and background processing.
A laptop should not be treated as a reliable always-on production
server. Free-tier hosts may sleep, impose storage/compute limits or
disallow certain workloads. Keep ingestion manually runnable until a
dependable worker environment is available.
19.3 Backups
- Export PostgreSQL before schema changes.
- Test restoration, not just backup creation.
- Keep provider credentials out of backup files where possible.
- Define retention and deletion policies.
- Document how to recover from a failed migration.
20. Risks and Mitigations
  Risk                    Impact                  Mitigation
  Provider API changes    Ingestion breaks        Adapter isolation,
fixtures, monthly
review

  Rate limits             Slow or incomplete      Adaptive throttling,
imports                 checkpoints

  Provider licensing      Product usage becomes   Terms review,
changes                 non-compliant           attribution, provider
replacement

  Duplicate records       Poor user experience    External ID mapping and
conservative resolution

  Conflicting metadata    Incorrect details       Field provenance and
precedence

  Incomplete catalogue    Missing titles          Multiple permitted
coverage                                        providers; disclose
limits

  External outage         Stale or missing        Serve stored metadata
updates                 and retry later

  Free-tier changes       Deployment interruption Portable Docker setup
and exportable data

  Unauthorized playback   Legal/security risk     Licensed sources and
source                                          strict allowlist
Account compromise      User data exposure      Secure authentication,
rate limits, least
privilege
21. Milestone Plan
Suggested six-week solo development plan; estimates depend on available
time and provider access.
Week 1 --- Foundation
- Create repository and project conventions.
- Initialize Next.js and FastAPI.
- Configure PostgreSQL, SQLAlchemy and Alembic.
- Implement health checks and CI.
- Add core database entities.
Exit criteria: Local application starts reproducibly and migrations
run from an empty database.
Week 2 --- Provider integration
- Implement TMDB adapter.
- Implement AniList adapter.
- Add Jikan and TVmaze adapter scaffolding/enrichment where permitted.
- Build common DTOs and normalizers.
- Persist external ID mappings.
Exit criteria: Sample movie and anime records import and map
correctly.
Week 3 --- Ingestion engine
- Implement pagination and checkpoints.
- Implement idempotent upsert.
- Add deduplication candidate logic.
- Add snapshots, provenance and ingestion reports.
- Add retry and rate-limit handling.
Exit criteria: Re-running an import does not duplicate records;
failed records are visible and retryable.
Week 4 --- Discovery frontend
- Build navigation, home page and media cards.
- Build movie, TV, anime and documentary browsing.
- Build detail pages.
- Build search and filters.
- Add responsive and empty/error states.
Exit criteria: A visitor can browse and search locally imported
records.
Week 5 --- User features and availability
- Add registration and login.
- Add watchlists.
- Add viewing status and episode progress.
- Integrate a permitted availability source.
- Add authorized playback or provider deep links.
Exit criteria: User workflows are secure and playback never relies
on arbitrary sources.
Week 6 --- Hardening and release
- Complete automated tests.
- Review security and provider terms.
- Add monitoring and backups.
- Optimize slow queries.
- Deploy where free-tier terms permit.
- Publish README, API docs and limitations.
Exit criteria: A documented MVP is publicly testable and has a
recovery plan.
22. Definition of Done
A feature is complete only when:
- Requirements and acceptance criteria are met.
- Code is reviewed and formatted.
- Relevant automated tests pass.
- API and schema changes are documented.
- Errors and loading states are handled.
- Authorization is tested for protected data.
- Secrets are not committed.
- Provider terms and attribution are respected.
- No unauthorized media playback path is introduced.
- The change is usable on mobile and desktop where applicable.
23. Open Questions and Decisions
These should be resolved before the relevant implementation phase:
1. Confirm the final product name and domain.
2. Confirm whether the first public release is strictly non-commercial.
3. Review TMDB, AniList, Jikan and TVmaze terms for the intended
   storage, display and refresh behavior.
4. Choose whether anime should be a separate top-level type or a
   classification layered over TV/movie; current recommendation is a
   distinct discovery type while preserving provider type.
5. Decide whether account registration is required for MVP or can be
   deferred until watchlists are implemented.
6. Select a licensed streaming availability source for India and any
   later regions.
7. Define image handling according to each provider's permitted URL,
   caching and attribution rules.
8. Define content rating and adult-content filtering behavior.
9. Decide retention periods for raw provider snapshots and ingestion
   logs.
10. Confirm hosting choices after checking current free-tier quotas and
    background-worker support.
24. First Implementation Backlog
Recommended order:
1. Initialize monorepo, linting, formatting and CI.
2. Add Docker Compose PostgreSQL.
3. Configure SQLAlchemy and Alembic.
4. Implement media, external_ids, media_titles, genres and
   media_genres.
5. Implement provider interface and TMDB adapter.
6. Implement AniList adapter.
7. Implement normalizers and validation fixtures.
8. Implement transactional upsert and exact-ID deduplication.
9. Implement ingestion run tracking and checkpoints.
10. Implement /api/v1/media, /movies, /anime and /search.
11. Build frontend browsing and detail pages.
12. Add user accounts, watchlists and progress.
13. Add authorized availability integrations.
14. Add admin monitoring, backups and deployment.
Appendix A --- Product and Technical References
Use official documentation as the source of truth and re-check terms
before release:
- TMDB API: https://developer.themoviedb.org/docs
- TMDB API terms: https://www.themoviedb.org/api-terms-of-use
- AniList API: https://docs.anilist.co/
- Jikan API: https://docs.jikan.moe/
- TVmaze API: https://www.tvmaze.com/api
- Next.js: https://nextjs.org/docs
- FastAPI: https://fastapi.tiangolo.com/
- PostgreSQL: https://www.postgresql.org/docs/
- SQLAlchemy: https://docs.sqlalchemy.org/
- Alembic: https://alembic.sqlalchemy.org/
- Docker Compose: https://docs.docker.com/compose/
- Meilisearch: https://www.meilisearch.com/docs
Appendix B --- Product Boundary
Cineverse is a metadata discovery and lawful availability platform. It
does not become a streaming service merely by storing a movie's title,
external ID, poster reference or provider link. Actual playback requires
a separate, documented legal basis and technical integration with a
source authorized to serve that content.

End of document.