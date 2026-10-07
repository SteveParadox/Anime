# Anime Clash

Anime Clash is a public anime community for evidence-backed character matchups, weekly tournaments, squad strategy challenges, and episode-safe club discussions.

## Features

- Public browsing with email/password, Google, or hosted ChatGPT/platform sign-in for owned contributions.
- Public fan profiles with favourite anime and characters, battle activity, squads, and club progress.
- Searchable curated character records with stable version IDs, version-scoped abilities, story/source boundaries, aliases, and database-backed feat libraries.
- Weekly UTC tournament brackets with advancing entrants and a live leaderboard.
- Version-locked Battle Arena matchups with immutable display snapshots, plus arguments, replies, reactions, reports, legacy source references, and reusable version-scoped Anime/Manga evidence.
- Five-character, 20-point squad building and squad-versus-squad community votes.
- Episode-filtered clubs with edit/delete, reporting, rules, spoiler-tag corrections, and an owner moderation queue.
- Notifications for replies, squad challenges, tournament rounds, and newly unlocked club discussions.
- Taste matching, seasonal recommendations, and personal watchlist states.

## Runtime and trust boundaries

Vinext / React runs on Cloudflare Workers. D1 stores provider-independent user accounts, auth identities, hashed server-side sessions, profiles, battles, votes, replies, squads, challenges, viewing progress, discussions, reports, notifications, watchlists, and tournament votes. Email/password, Google OIDC, and hosted ChatGPT/platform identities resolve through one central auth layer to stable internal user IDs. Configure moderation with `ANIME_CLASH_ADMIN_USER_ID`; the legacy `ANIME_CLASH_ADMIN_ID` remains a temporary ChatGPT-provider fallback.

Club post bodies are filtered server-side against the signed-in viewer's saved episode. Correct author episode tags remain necessary. Arena, tournament, character, squad, and discovery pages can contain spoilers.

The character directory is curated. A Character is identity; CharacterVersion is the authoritative combat profile. Legacy `forms` are derived compatibility labels and are not accepted as Battle Arena authority. Abilities are reusable records explicitly linked to versions, and reusable feat/evidence records are scoped to a version. Citation records store metadata only (episode/timestamp or chapter/page), never copies of anime clips, manga scans, or pages.

## Character version architecture

Combat relationships follow:

```text
Character → CharacterVersion → Ability / Feat → Evidence
```

Battle payloads store stable `fighterAVersionId` / `fighterBVersionId` values plus immutable character/version display snapshots so historical debates remain readable after catalog wording changes. Existing string-version battles are normalized as legacy records and are not rewritten.

The curated TypeScript catalog is mirrored by append-only D1 seed data in `character_versions`, `abilities`, and `version_abilities`. New evidence uses `version_id` and optional `ability_id`; pre-version evidence remains readable with a null version.

Profiles, favourite characters, squads, tournament seeds, discovery, and recommendations remain character-level for backward compatibility. Squads are intentionally not version-aware in this migration; that is a future combat-consistency enhancement rather than a destructive saved-data rewrite.

## Authentication

Authentication architecture, security policy, migration behavior, Google/Resend configuration, and deployment variables are documented in [`docs/authentication.md`](docs/authentication.md). Existing community ownership is migrated to stable internal user IDs by append-only migration `0005_auth_accounts.sql`.

## Development

Use the Sites configure, install, build, and managed preview helpers. Database schema is in `db/schema.ts`; append-only migrations are in `drizzle/`. Apply pending migrations to preview D1 before testing persistent behavior. Sites applies production migrations during publication.

## Validation

- Run `pnpm test:domain` for evidence and character-version domain tests.
- Run `pnpm test:auth` for auth crypto and legacy ownership-migration tests.
- Run TypeScript, lint, and the production build before release.
- Expanded desktop views were inspected in managed browser preview.
- Character search, weekly bracket calculation, public squad challenge state, and club rules were checked through the rendered interface.
- Fresh SQLite migrations and key ownership/query constraints are checked before release.
- Authenticated production write flows require a real signed-in account and should be smoke-tested after deployment.
- WebMCP navigation is feature-detected; browsers without `modelContext` ignore it safely.

## Artwork

Ichigo artwork: https://bleach-anime.com/assets/img/character/chara_01.png
Source: https://bleach-anime.com/character/

Copyright belongs to the respective rights holders; no redistribution license was identified. No official affiliation is claimed.
