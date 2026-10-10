# Evidence Library implementation audit: Features 96–115

Repository inspected: `SteveParadox/Anime`, current Next.js 16 / Fastify / PostgreSQL monorepo.

## Audited state

| No. | Feature | State on main before this branch | Work on this branch |
| --- | --- | --- | --- |
| 96 | Anime evidence | Existing | Kept existing contract |
| 97 | Manga evidence | Existing | Kept existing contract |
| 98 | Episode timestamp | Existing | Kept existing parsing |
| 99 | Manga chapter/page | Existing | Kept chapter required, page optional |
| 100 | Databook | Missing | Submission/edit/list source metadata added |
| 101 | Official guidebook | Missing | Submission/edit/list source metadata added |
| 102 | Creator interview | Missing | Statement-kind classification and source metadata added |
| 103 | Official website | Missing | HTTP(S), credential exclusion, URL-domain matching added |
| 104 | Light novel | Missing | Novel metadata and continuity relation added |
| 105 | Game canon | Missing | Game metadata, gameplay/crossover classification added |
| 106 | Verification status | Missing | NOT IMPLEMENTED |
| 107 | Trusted contributors | Missing | NOT IMPLEMENTED |
| 108 | Evidence upvotes | Missing | NOT IMPLEMENTED |
| 109 | Evidence disputes | Missing | NOT IMPLEMENTED |
| 110 | Duplicate evidence detection | Partial | Extended existing bounded same-location suggestions to additional source types, with edition/continuity differentiation for exact duplicates |
| 111 | Revision history | Missing | NOT IMPLEMENTED |
| 112 | Quality rating | Missing | NOT IMPLEMENTED |
| 113 | Moderation workflow | Partial | Existing report and soft-delete paths retained, full queue NOT IMPLEMENTED |
| 114 | Evidence attached to squad discussion | Missing | NOT IMPLEMENTED |
| 115 | Full character feat library | Partial | Existing version-scoped records/filters retained, no complete research page |

This table is a **code inspection and implementation record**. Runtime behavior is not certified until CI and database/browser tests pass.

## Files relevant to the evidence lifecycle

- `packages/domain/src/evidence.ts`: source-type constants, display model and locations
- `apps/api/src/lib/evidence-input.ts`: strict Zod source validation
- `apps/api/src/routes/evidence/route.ts`: authenticated mutations, filtered discovery, duplicate suggestions and battle links
- `apps/web/app/page.tsx`: evidence picker and source-specific create/edit forms
- `packages/database/src/schema.ts`: Drizzle table declaration
- `packages/database/migrations/0003_evidence_official_sources.sql`: **active PostgreSQL** migration
- `tests/evidence.test.mjs`: source enum and display regression
- `tests/evidence-source-migration.test.mjs`: historical data survival
- `apps/api/tests/evidence-input.test.mjs`: type-specific validation and domain spoofing regression

## Migration precautions

1. Apply migration **0003** through `pnpm db:migrate` after existing baseline / safeguard migrations.
2. This is append-only. No historical evidence IDs, battle arguments, or links are intentionally rewritten.
3. All added metadata columns are nullable or have defaults; old Anime/Manga rows remain valid.
4. `source_details` uses JSONB; it is type-validated at the API layer.
5. Deploy the migrated database before deploying the API route that selects the new columns.
6. The historical `drizzle/` directory is **not** the migration runner for the current PostgreSQL stack.

## Security and semantics

The source type records what a contributor claims the source to be. Neither an official-type label, a URL-domain match, nor a text citation verifies publisher authenticity, canon status, translation accuracy, or the claim's truth. The UI explicitly warns that additional source submissions are unverified.

Publication dates reject impossible calendar dates; remote URLs are not fetched server-side. Inputs use strict source-specific validation and parameterized SQL. The existing contributor-authentication and ownership checks remain active.

## Remaining implementation dependency order

1. Implement immutable evidence revisions with revision-scoped verification decisions and migrations.
2. Implement role-based reviewer permissions, source authenticity and claim-support decisions separately from moderation.
3. Implement moderation queues, disputes, appeals, and auditable actions.
4. Add source-level duplicate candidate review and safe merging with retained citations and contributor credit.
5. Add upvotes with unique user/evidence constraints and abuse prevention.
6. Add trusted contributor roles with auditable authorization; never promote from upvotes alone.
7. Add deterministic and explanation-bearing quality scores.
8. Extend evidence associations into squad discussions while retaining revision snapshots and visibility rules.
9. Build a paginated character research library including continuity, source, verification and revision filters.
10. Complete authenticated end-to-end, database, security, performance and historical compatibility tests.

## Verification not yet available

This branch has tests committed, but **committing a test is not executing it**. The initial PR #20 CI job reported failure without step execution or downloadable logs, so neither the new tests nor the complete build have been independently verified. No production migration or live database counting was performed.

**Merge gate:** Keep PR #20 in draft until a working CI runner executes `pnpm test`, `pnpm typecheck`, `pnpm test:integration`, `pnpm build`, `pnpm lint`, and authenticated evidence smoke tests.
