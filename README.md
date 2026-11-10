# Cineverse

Unified media discovery, catalogue aggregation, and streaming web platform for movies, TV series, anime, documentaries, and short films.

## Features

- **Provider-Independent Media Catalogue:** Normalized data model mapped to immutable internal UUIDs.
- **External Providers:** TMDB REST API, AniList GraphQL API, with support for TVmaze and Jikan.
- **High-Performance Search:** PostgreSQL trigram and full-text search across primary and alternate titles.
- **Personal Library:** Custom user watchlists and granular episode progress tracking.
- **Configurable Playback Engine:** Sandboxed player embed integration supporting custom providers (`vidbolt.xyz`, `embed.reelsdownload.online`).
- **Zero-Budget Local Development:** Fully runnable locally using Docker Compose, Python FastAPI, and Next.js.

## Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+ & npm

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

### 3. Launch Database
Start PostgreSQL using Docker Compose:
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

### 4. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
Backend will be available at `http://localhost:8000`. OpenAPI documentation at `http://localhost:8000/docs`.

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at `http://localhost:3000`.
