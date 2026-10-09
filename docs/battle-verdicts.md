# Battle Arena verdict and analytics rollout (draft PR #19)

This work is a **community voting analytics system**, not evidence that a fictional character canonically wins a matchup. Only finalized eligible results are counted in fighter records.

## Deployment order

1. Back up the Railway PostgreSQL database and review currently open community polls.
2. Run `pnpm db:migrate` to apply `0003_battle_verdicts.sql` before deploying API and worker.
3. Deploy Fastify backend and Next.js frontend together, then start the existing Railway worker.
4. Confirm `/api/battle-analytics?mode=leaderboard` and the `/battle-stats` frontend page.
5. Check the worker's `Battle verdict scheduler tick` logs and any skipped legacy matchups.
6. Run `pnpm test`, `pnpm typecheck`, `pnpm test:integration`, `pnpm build` and `pnpm lint` before requesting merge.

**Compatibility warning:** Existing persisted community battles older than seven days will close under this policy. The worker will only finalize valid version-scoped battles; historical or invalid legacy records must not be assigned invented versions. Historic votes updated after the new deadline may be excluded because the existing votes table stores the latest update timestamp, not every historical ballot revision. Communicate the closing policy to users before enabling the worker in a public deployment.

## Policy v1

- Vote window: seven days after the persisted battle's creation timestamp.
- Minimum eligible ballots for an official verdict: ten.
- Each user contributes at most one active ballot per battle (existing unique key).
- A winner requires more eligible ballots than the other fighter and draw option; a top-rank tie, or a plurality for draw, produces a community draw.
- Below the participation threshold, finalization produces a no-contest; it does not contribute to character W/L/D.
- Character win rate = wins / (wins + losses + draws), multiplied by 100.
- Win-rate leaderboard minimum: three eligible finalized matchups.
- Voided results are excluded and retain an audit trail.
- Starter exhibitions are not persisted in `battles`, so they remain discussion-only and do not generate official win/loss records.
- Challenge squad tournaments and their points are separate from Battle Arena results; no implicit winner conversion is allowed.
- Upsets are **not** calculated without a frozen, genuine pre-outcome expectation.

The policy has a version number; modifying its meaning should require an explicit version bump and audited recomputation, not silent mutation of existing snapshots.

## New endpoints

`GET /api/battle-analytics` with:
- `mode=battle&battleId=...` for voting window and finalized result;
- `mode=record&characterId=...` for wins, losses, draws, versions and recent finalized matchups;
- `mode=most-debated&characterId=...` for real discussion activity;
- `mode=matchup&characterId=...&opponentId=...` for head-to-head results;
- `mode=leaderboard` and `mode=highlights` for rankings and close/landslide/controversial matches;
- `mode=rematches&battleId=...`, `mode=similar&battleId=...` for replay and related matches;
- `mode=collections` (optional `collectionId`) for public or owned collections.

`POST /api/battle-analytics`: `finalize` (admin), `void` (admin with reason), `rematch` (contributor), `create_collection`, `set_collection_visibility`, `add_to_collection`, `remove_from_collection`, `delete_collection` (owner or admin).

The frontend contains `/battle-stats` and Battle Arena/character dialog panels. It does **not** yet expose all collection management options.

## Remaining features before this can be called a complete Features 76–95 release

| Feature | Status in this draft |
| --- | --- |
| 76–80: existing battle creation, versions, rules, difficulty, evidence | Existing, regression verification pending |
| 81–83: fighter W/L/D and version records | API/UI added, runtime verification pending |
| 84: most-debated opponents | Simple SQL-derived activity, anti-spam refinements pending |
| 85: matchup history | Grouped API, dedicated comparison UI/filters pending |
| 86: win-rate leaderboard | API/UI added; confidence-weighted ranking pending |
| 87: controversy | Vote-split approximation only; dispute/evidence weighting pending |
| 88–89: closest battles and landslides | API/UI added, runtime verification pending |
| 90: pre-outcome upset tracking | Not implemented |
| 91: tags and categories | Not implemented |
| 92: collections | Backend partial; edit/reorder and full UI pending |
| 93: tournament-to-battle integration | Not implemented (existing squad scoring intentionally independent) |
| 94: rematches | API and button added, extended editing/history pending |
| 95: similar matchups | Deterministic retrieval and UI added; richer signals pending |

No database migration or endpoint has been verified against a running Railway deployment as part of this draft. The GitHub Actions job launched but failed before producing any validation steps or test output, so CI must be rerun after the runner issue is resolved. **Do not merge this PR without green build, migration, integration, regression and security checks.**
