# Anime Clash

Anime Clash is an anime community with evidence-backed battles, version-aware daily squad challenges, episode-safe clubs, profiles, tournaments, and watchlists.

## Applications

- `apps/web`: native Next.js 16/React frontend. Browsers call same-origin `/api/*`; the server proxy forwards requests to the configured API origin.
- `apps/api`: Fastify/Node.js backend. It owns authentication, authorization, game rules, and writes.
- `packages/domain`: existing character, battle, evidence, squad, and authentication rules.
- `packages/contracts`: types shared by the web app and API.
- `packages/database`: PostgreSQL Drizzle schema, migrations, and catalog seed.
- `drizzle/`: retained historical D1/SQLite migrations for source audit and export preparation. These SQL files are never applied to PostgreSQL.

## Local setup

Use Node.js 22.19 or newer, pnpm 11.25, Python 3, and Docker with Compose. Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.example` to `apps/web/.env`. The local API requires `DATABASE_URL` and `APP_BASE_URL`; web requires `API_UPSTREAM_ORIGIN`.

```sh
pnpm install --frozen-lockfile
docker compose up -d postgres
pnpm db:migrate --through=0000_baseline.sql
pnpm db:seed
pnpm db:migrate
pnpm dev
```

Open <http://localhost:3000>. API readiness is <http://localhost:4000/health/ready>. `pnpm dev:web` and `pnpm dev:api` start either app independently. For production, run `pnpm build`, then `pnpm --filter @anime/api start` and `pnpm --filter @anime/web start` in separate processes.

`pnpm db:generate` produces a Drizzle candidate SQL migration. Review and move it to `packages/database/migrations/` before `pnpm db:migrate`; never regenerate or rerun the baseline over existing data. The migrations are controlled, transactional, and tracked in `app_migrations`.

## Validation

```sh
pnpm test:syntax
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration:local
pnpm test:import:local
pnpm build
pnpm test:e2e
```

`pnpm test:integration` runs source export/schema checks and a real PostgreSQL API test if `TEST_DATABASE_URL` points at a freshly migrated and seeded disposable database. The `:local` variant starts an ephemeral PostgreSQL-compatible PGlite socket and performs those setup steps automatically. The import rehearsal makes a fixture D1 database and verifies preserved IDs, ownership, nullable squad snapshots, and password hashes. Never point integration tests at production data.

Deployment and cutover instructions: [architecture](docs/architecture.md), [authentication](docs/authentication.md), [migration](docs/migration.md), [deployment](docs/deployment.md), and [rollback](docs/rollback.md).
