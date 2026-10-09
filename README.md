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

Use Node.js 22.19 or newer, pnpm 11.25, Python 3, and Docker with Compose. Environment files are **per application**: the API loads `apps/api/.env`, the Next.js app loads `apps/web/.env`, and database scripts load `apps/api/.env`. A repository-root `.env` does not replace those files.

On Windows Command Prompt, run from the repository root:

```cmd
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env
```

Edit both copied files before startup. The local API requires `DATABASE_URL` and `APP_BASE_URL`, and the web proxy requires `API_UPSTREAM_ORIGIN`. The checked-in API example uses the Docker Compose PostgreSQL credentials and `127.0.0.1:5432`. Do not commit your real `.env` files.

```sh
pnpm install --frozen-lockfile
docker compose up -d postgres
pnpm db:migrate --through=0000_baseline.sql
pnpm db:seed
pnpm db:migrate
pnpm dev
```

**PostgreSQL connectivity on Windows:** `docker compose ps` should show a published mapping such as `127.0.0.1:5432->5432/tcp`, not only `5432/tcp`. If the mapping is missing, check the `ports:` block in `docker-compose.yml` and run `docker compose up -d --force-recreate postgres`. Recreating without `-v` preserves the named database volume. If you are using an existing hosted PostgreSQL database, set its actual connection URL in `apps/api/.env` instead.

**Optional integrations:** Google OAuth needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a registered `GOOGLE_REDIRECT_URI`. Sending email needs `RESEND_API_KEY` and `EMAIL_FROM`. For local testing without an email provider, `AUTH_DEV_EMAIL_LOG=true` writes verification/reset links to server logs; do not enable it in production or shared logs. `ANIME_CLASH_ADMIN_USER_ID` is only for an intentionally selected admin account.

**Production:** On Railway, configure the API's `DATABASE_URL`, HTTPS `APP_BASE_URL`, `NODE_ENV=production`, and a strong `API_PROXY_SHARED_SECRET` (32+ characters). On Vercel, set server-only `API_UPSTREAM_ORIGIN` to the HTTPS Railway API origin and the **same** `API_PROXY_SHARED_SECRET`. The shared secret must never have a `NEXT_PUBLIC_` prefix. See [deployment](docs/deployment.md) for deployment details.

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
