# Anime Clash

Anime Clash is a public anime community for evidence-backed character matchups, weekly tournaments, squad strategy challenges, and episode-safe club discussions.

## Features

- Public browsing with ChatGPT sign-in for owned contributions.
- Public fan profiles with favourite anime and characters, battle activity, squads, and club progress.
- Searchable curated character records with forms, abilities, story endpoints, official source links, and database-backed feat libraries.
- Weekly UTC tournament brackets with advancing entrants and a live leaderboard.
- Battle arguments, replies, reactions, disputes, reports, legacy source references, and reusable structured Anime/Manga evidence.
- Five-character, 20-point squad building and squad-versus-squad community votes.
- Episode-filtered clubs with edit/delete, reporting, rules, spoiler-tag corrections, and an owner moderation queue.
- Notifications for replies, squad challenges, tournament rounds, and newly unlocked club discussions.
- Taste matching, seasonal recommendations, and personal watchlist states.

## Runtime and trust boundaries

Vinext / React runs on Cloudflare Workers. D1 stores profiles, battles, votes, replies, squads, challenges, viewing progress, discussions, reports, notifications, watchlists, and tournament votes. Platform-provided ChatGPT identity is checked server-side for every write. `ANIME_CLASH_ADMIN_ID` identifies the site owner for moderation actions and is configured as a hosted runtime value.

Club post bodies are filtered server-side against the signed-in viewer's saved episode. Correct author episode tags remain necessary. Arena, tournament, character, squad, and discovery pages can contain spoilers.

The character directory is curated. Short summaries are community reference notes; each record links to an official franchise source. Reusable feat records store citation metadata only (episode/timestamp or chapter/page), never copies of anime clips, manga scans, or pages.

## Development

Use the Sites configure, install, build, and managed preview helpers. Database schema is in `db/schema.ts`; append-only generated migrations are in `drizzle/`. Apply pending migrations to preview D1 before testing persistent behavior. Sites applies production migrations during publication.

## Validation

- Run `pnpm test:evidence` for evidence-domain timestamp/formatting tests.
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
