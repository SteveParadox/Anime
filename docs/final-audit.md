# Migration implementation audit (branch work, not a release approval)

## Implemented

Native Next.js web app and same-origin API proxy; Fastify server with all 19 original API paths; PostgreSQL Drizzle schema for 35 historical tables and squad guard migration; fixture D1 export/import with checksum, counts, account/reference checks and stable vote `rowid`; retained opaque session/password/OAuth logic; local PostgreSQL Compose, environment examples, Railway/Vercel instructions, CI workflow, and regression tests. The original UI and `/?view=...`, `/?battle=...` links remain in place. Cloudflare Worker/Vinext boot files and runtime dependencies were removed; historical D1 SQL remains in `drizzle/` for audit and export preparation.

Verified fixes: report targets must exist; an author cannot retag a club post beyond saved progress; API startup checks the database connection before listening; mutation paths do not retry in the browser client. Regression assertions cover the first two and the same-origin session proxy.

## Executed validation

| Result | Command | Observation |
| --- | --- | --- |
| PASS | `pnpm test:syntax` | Source syntax regression test passed. |
| PASS | `pnpm test` | 17 root tests and 2 API test files passed; the API PostgreSQL test skips without `TEST_DATABASE_URL` in this command. |
| PASS | `pnpm typecheck` | Fastify and Next.js TypeScript checks passed. |
| PASS | `pnpm test:integration:local` | Ephemeral PostgreSQL-compatible PGlite socket: baseline/seed/guards plus registration, verification, login, catalog, evidence, battle argument/comment/reaction, submission/vote lock, club spoiler, report, session revocation, and 20 concurrent session creations capped at 12 passed. |
| PASS | `pnpm test:import:local` | All 35 source tables exported/imported, counts and references checked, historical argument ID 789/reaction, nullable squad snapshots and password hash verified. |
| PASS | `pnpm build` | Fastify production bundle and native Next.js production build passed. |
| PASS | `pnpm test:e2e` | Built Next.js and Fastify started against disposable data; HTTP smoke verified web-proxied cookie, authenticated read, origin rejection, logout and revocation. This is an HTTP system test, not browser automation. |
| FAIL | `pnpm lint` | API: 101 errors and 12 warnings, mostly inherited explicit `any` usage; web-only lint separately reported 79 errors and 9 warnings in moved UI. CI remains red. |
| BLOCKED | Docker Compose PostgreSQL 17 and GitHub Actions run | Docker daemon unavailable in this workspace; no PR/push was made, so hosted workflow was not executed. PGlite uses PostgreSQL query protocol for local rehearsals but does not replace a PostgreSQL 17 release check. |
| NOT RUN | Real Google OAuth, Resend delivery, browser automation, Railway/Vercel staging, production D1 export/cutover | Requires accounts, credentials, production data, domains and release authorization. No live data was modified. |
| NOT RUN | Dependency audit | Package registry access was unavailable to the local sandbox. |

## Blocking risks before a pull request or cutover

1. Fix the existing ESLint failures without weakening rules or TypeScript strictness, then run the full CI workflow on GitHub. CI is defined but unverified on a hosted runner.
2. Existing accounts with **only** a historical hosted-platform identity have no independent verified login method. Their IDs/content remain preserved, but the new public API intentionally rejects spoofable hosted-auth headers. A verified account-claim or trusted upstream identity handoff must be designed and tested before promising uninterrupted access to those users. Do not map accounts by unverified email or raw provider headers.
3. Review and reconcile the actual production D1 export. Fixture counts and references cannot prove production compatibility. A real PostgreSQL 17 staging database, complete OAuth/email checks, and browser-level flows remain necessary.
4. The moved `community` and `evidence` handlers still carry broad legacy logic and explicit `any` types. Their Fastify routing and data boundary work in rehearsals, but the requested granular route/service/repository split and exhaustive concurrency/security coverage remain incomplete. More tests are needed for Google linking, password resets, moderation transactions, tournament voting, and database races.
5. No production/staging deployment, final write freeze, backup restore, or rollback drill has occurred. Do not merge or activate this branch yet.

## Security review performed

Parameterized SQL at the adapter boundary, Zod validation on auth/squad/evidence routes, Origin/CORS checks, fixed upstream and redirect allowlist, stripped identity/forwarded headers, hashed opaque sessions, Google PKCE/state/nonce verification, squad self-vote and lock database guards, and club spoiler visibility were inspected. The tests above exercise representative cases. Remaining route-level `any` and untested moderation/account-link races prevent a complete security sign-off. Logs and API error bodies should be reviewed again using production-like staging data before deployment.
