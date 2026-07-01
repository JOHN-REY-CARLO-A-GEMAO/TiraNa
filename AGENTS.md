# TiraNa Monorepo — Agent Instructions

## Repository structure

Three independent sub-projects under `CODE/`, each with its own `docker-compose.yml`, frontend, and backend. No root build orchestration or shared config.

```
CODE/
  Admin-TiraNa/     FastAPI (Python) + React (Vite) + PostgreSQL
  Client-TiraNa/    Express.js (Node) + React (Vite) + CockroachDB
  Host-TiraNa/      Flask (Python) + React (Vite) + Oracle DB
PLAN/               Planning docs (Client flow, Host plan)
```

## Per-project commands

Run everything from the project's own directory. Each frontend dev server is Vite with `npm run dev`; each backend has its own start command.

| Project | Backend start | Frontend start | All at once |
|---|---|---|---|
| Admin-TiraNa | `docker-compose up` (auto runs `alembic upgrade head`) | `npm run dev` (port 3000, serves from 5175) | `docker-compose up` |
| Client-TiraNa | `docker-compose up` (or `npm run dev`) | `npm run dev` | `docker-compose up` |
| Host-TiraNa | `docker-compose up` (DB healthcheck wait ~90s) | `npm run dev` + `npm run lint` (ESLint) | `docker-compose up` |

## Port map

| Service | Admin | Client | Host |
|---|---|---|---|
| Frontend dev | 3000 / 5175 | 5173 | 5174 |
| Backend | 5002 | 5000 | 5001 |
| Database | 5432 (PostgreSQL) | 26257 (CockroachDB) | 1521 (Oracle) |

## Docker networking

- **Host-TiraNa** creates `tirana-network` (bridge).
- **Admin-TiraNa** joins `tirana-network` as an *external* network to proxy requests to Host and Client backends.
- **Client-TiraNa** is standalone (no external network).

## Key architecture notes

- **Admin is an aggregator/proxy**: it calls Host (`HOST_API_BASE_URL`) and Client (`CLIENT_API_BASE_URL`) backends via `httpx`. Many admin routes (dashboard stats, bookings, payments, listings, verifications, withdrawals) proxy or aggregate data from these two services.
- **Default admin seed**: `admin` / `admin123` (created in `main.py` on startup).
- **Alembic migrations** (Admin backend): auto-apply on container start (`alembic upgrade head` before `uvicorn`). Migration `d5e6f7a8b9c0` drops old host/client tables — do not revert.
- **Auth flow**: username/password → OTP email → JWT access token. Rate-limited (5 failures = 15-min lockout).
- **Three databases**: PostgreSQL (Admin), CockroachDB (Client), Oracle (Host). Each has its own schema and migrations.
- **UI language**: Filipino (Tagalog) throughout.

## Testing

| Project | Status | Run command |
|---|---|---|
| Admin backend | pytest (2 test files, SQLite in-memory) | `pytest` from `CODE/Admin-TiraNa/backend/` |
| Admin frontend | 1 Vitest test file, but no `test` script in `package.json` — needs `vitest` config setup first | N/A |
| Client-TiraNa | No tests | N/A |
| Host-TiraNa | No tests | N/A |

## Gotchas

- Backend `.env` files contain development-only credentials (Gmail app password, PayMongo test keys, internal API keys). Do not commit.
- Admin frontend `VITE_API_URL` must point to a reachable backend (localhost in dev, container name in Docker).
- Host-TiraNa uses **in-memory token blocklist** (not Redis/DB) — revoked tokens are lost on restart.
- Client-TiraNa's `api/config.js` dynamically chooses `localhost` vs `host.docker.internal` based on hostname for Docker compatibility.
- Admin `cookies.txt` is an empty placeholder file used for test request cookies.
- `PLAN/` docs describe intended features — some may not be fully implemented (e.g., Room Comparison, Rebook, Availability Notification).
