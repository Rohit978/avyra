# Phase 1: Foundation & Environment Setup - Research

**Phase:** 01-foundation-environment-setup
**Researched:** 2026-11-11
**Confidence:** HIGH

## Overview

Phase 1 establishes the monorepo foundation for Cineverse:
1. Docker Compose running PostgreSQL 15+ with health checks.
2. Root directory structure with `.env.example`, `.gitignore`, and `README.md`.
3. Python FastAPI backend skeleton with Pydantic v2 settings, CORS, and `/health` route.
4. Async SQLAlchemy 2.0 engine + Alembic async migration environment.
5. Next.js 15+ frontend workspace skeleton with TypeScript and Tailwind CSS.

## Standard Configurations & Best Practices

### 1. Docker Compose PostgreSQL 15
```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: cineverse-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-cineverse}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-cineverse}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 2. Async SQLAlchemy 2.0 & Alembic
- In SQLAlchemy 2.0 async mode, `asyncpg` is the recommended driver.
- The connection string format is `postgresql+asyncpg://user:pass@host:port/db`.
- Alembic requires `alembic init -t async alembic` or modifying `env.py` to use `connectable = async_engine_from_config(...)` with `async with connectable.connect() as connection: await connection.run_sync(do_run_migrations)`.

### 3. FastAPI `/health` Check
- Test database connectivity via `await session.execute(text("SELECT 1"))`.
- Return structured JSON with status, database connectivity status, and version.

### 4. Next.js 15 Frontend
- Minimal, clean package structure with `package.json`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, and `src/app/layout.tsx`.
- Dark cinematic baseline styles in `src/app/globals.css`.

---
*Research for Phase 01 completed.*

