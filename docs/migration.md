# D1 to PostgreSQL migration

The source of truth for the source schema is the ordered SQLite migration set in `drizzle/`. `docs/migration/d1-schema-derivation.sql` records the derived final schema. The PostgreSQL schema is a separate Drizzle translation; do not execute SQLite migrations against PostgreSQL. Keep production D1 intact through validation and rollback.

## Rehearsal and source export

Use a disposable Railway staging PostgreSQL database and a current, read-only copy of D1. Cloudflare's [D1 export command](https://developers.cloudflare.com/d1/wrangler-commands/) is `npx wrangler d1 export DATABASE_NAME --remote --output=export.sql`. This is an operational export step only; Wrangler is not part of either deployed app. Verify the database name and account before running. Retain the SQL export and a second backup in protected storage. Restore the SQL dump into a local SQLite file, for example `sqlite3 source.sqlite < export.sql`; confirm it has all 11 migrations and 35 tables. Do not use a local development D1 snapshot as a substitute for production.

```sh
python3 scripts/database/export-d1.py source.sqlite export
```

This read-only tool checks `PRAGMA foreign_key_check`, writes `export.jsonl` plus `export.manifest.json`, records all table counts and SHA-256, and carries `votes.rowid` as `argument_id`. Protect the export: it includes email addresses, authentication hashes, and sessions. Do not commit it.

Set `DATABASE_URL` to an empty, freshly provisioned PostgreSQL database. Run:

```sh
pnpm db:migrate --through=0000_baseline.sql
node scripts/database/import-d1.mjs export.jsonl export.manifest.json
pnpm db:seed
pnpm db:migrate
```

The importer verifies the checksum, table inventory, zero starting rows, and counts in one transaction. It checks selected account ownership relationships, sets the historical vote identity sequence, and rolls back on error. A failed import requires inspecting the error and restoring a clean target database; the script deliberately refuses to append to a partially populated database. The catalog seed uses conflict-safe inserts so historical catalog records retain their IDs. Guard migration `0001` follows the historical import because legacy snapshots and closed challenges may differ from current submission rules.

The printed JSON is the first migration report: retain the counts, checksum, PostgreSQL migration log, and reconciliation output with your deployment record. Compare every table count, with particular attention to users, identities, profiles, battles, votes, evidence, squads, daily challenges, submissions, submission votes, posts, and notifications. Query ownership and reference joins for all production records, sample historical battle/argument links and squad snapshots, and verify old credentials through the new login. The fixture rehearsal is `pnpm test:import:local`.

## Cutover

1. Rehearse on staging with an actual sanitized D1 export; test login, evidence, clubs, moderation, OAuth and email on staging.
2. Back up D1 and verify a backup can restore. Record source counts and hash. Freeze old application writes and invalidate/quiet scheduled writes.
3. Export D1 again after the freeze; run the import into a fresh production PostgreSQL target, reconcile counts and references, and test historical IDs and password hashes.
4. Deploy the compatible API and frontend with production environment variables. Check readiness, same-origin cookies, OAuth callback, write flows, and logs. Monitor errors before reopening writes.
5. Keep old D1 and its backups untouched. If reconciliation fails, use the [rollback guide](rollback.md) before accepting writes on PostgreSQL.

The tooling cannot manufacture or access live Cloudflare exports or Railway credentials. A zero-downtime dual-write bridge is not implemented; freeze writes until the final export and verification complete.
