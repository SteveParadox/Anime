# Daily Squad Challenges

Anime Clash keeps three related concepts deliberately separate:

1. **Saved squads** are reusable personal teams in the original five-character, 20-point format.
2. **Squad battles** compare two saved squads through the existing `squad_challenges` / `challenge_votes` system.
3. **Daily squad challenges** are version-aware, budget-constrained historical submissions judged YES/NO by the community.

The daily system does not mutate or reinterpret old saved squads.

## Data model

```text
daily_squad_challenges
  -> daily_squad_challenge_costs
  -> squad_submissions
       -> squad_submission_members
       -> squad_submission_votes
```

`squad_version_costs` contains baseline balancing costs for canonical character versions. When a daily challenge is created, those values are copied into `daily_squad_challenge_costs`. This makes each challenge's pricing a historical snapshot and also leaves room for challenge-specific overrides.

A submission stores its own character-name, version-name, and cost snapshots. Rebalancing a version later must not rewrite an old entry.

## Challenge lifecycle

Daily challenge IDs use UTC dates:

```text
daily-YYYY-MM-DD
```

The API creates the current day's row at most once and uses UTC midnight boundaries. Repeated page loads reuse the same record. Concurrent first requests use idempotent inserts.

Effective lifecycle is:

- `scheduled` before `starts_at`
- `active` between `starts_at` and `ends_at`
- `closed` after `ends_at` or when explicitly closed

Only active challenges accept submissions and votes.

The initial release uses curated server-side templates over characters and versions that already exist in the canonical catalog. It does not invent free-text targets. The current templates use exact Goku, Naruto, and Luffy versions. Adding a Madara challenge first requires adding Madara and the intended Madara version to the canonical character/version catalog.

## Submission rules

The server, not the browser, is authoritative.

For every submission it validates:

- authenticated, verified, completed application account
- challenge exists and is active
- member count is inside `min_members..max_members`
- every character exists
- every version exists and belongs to the submitted character
- every version is available in that challenge
- each character appears at most once, even through different versions
- all costs are resolved from `daily_squad_challenge_costs`
- calculated total does not exceed the challenge budget
- squad name is 3-60 characters
- strategy is 10-1500 characters
- one submission per user per challenge

Client-supplied costs are not accepted by the submission schema.

A user may update their submission while the challenge is active and before the first community vote. The first vote locks the entry. Database triggers also block member or submission mutation once votes exist, closing the race window between application checks and writes.

## Voting

Daily challenge votes are separate from saved-squad battle votes.

- verdicts are `yes` or `no`
- one logical vote per user per submission
- voting again updates the existing vote
- self-voting is rejected
- closed challenges reject votes
- first vote locks the submission
- live percentages are hidden from non-owners until they vote
- closed challenge results are public

Top sorting uses a transparent net-YES score (YES votes minus NO votes) once an entry has at least five votes. The aggregate ordering runs in SQL, so an older high-performing entry is not lost merely because the feed first loaded newer rows. Entries below the minimum are not awarded a visible Top rank.

## Character versions and abilities

Daily challenge members use:

```text
characterId
versionId
```

The builder shows the exact selected version and a compact preview of abilities already defined in the existing character-version system. Evidence is not duplicated. A later discussion/evidence phase should link the existing reusable evidence records to squad submissions rather than creating a second feat database.

## Saved squad compatibility

The existing `squads`, `squad_challenges`, and `challenge_votes` tables remain unchanged. Legacy saved squads continue to display their original character-only members and old cost model.

Daily submissions are independent snapshots. Future "build from saved squad" support should require the user to resolve any legacy character-only member to a canonical version before submission. Guessing version IDs for historical squads is explicitly avoided.

## Moderation

Existing reports support `subjectType=squad_submission`. Moderators can soft-remove the reported submission. The challenge and other submissions remain intact.

## Profile integration

Profile history exposes recent challenge entries, entry cost, challenge budget, and vote count. Live YES/NO percentages are not leaked through profile APIs while the normal challenge UI is hiding them.

## Performance

Challenge feeds aggregate vote counts in SQL and then fetch all displayed members in one batched query. They do not execute a vote query and member query for every card.

## Security

Mutation endpoints use:

- application-owned internal user IDs
- `getCurrentUser` / `canContribute`
- same-origin checks
- byte-limited JSON parsing
- strict Zod schemas
- parameterized D1 statements
- ownership checks
- server-time lifecycle checks
- server-authoritative price lookup

Public responses include profile handle, display name, and avatar where appropriate. They do not expose email addresses, Google subjects, hosted-platform IDs, or raw internal authentication identities.

## Initial administration

The first release keeps the daily schedule curated in server code and baseline costs in `squad_version_costs`. Challenge-specific values are copied into `daily_squad_challenge_costs`, so an administrator can override a scheduled/current challenge without changing the global baseline.

A dedicated admin challenge editor is intentionally deferred. Normal users cannot create daily challenges.

## Validation

Run:

```bash
pnpm test:squads
pnpm test:auth
pnpm test:domain
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Deployment smoke testing should additionally verify one complete browser flow: load the active challenge, submit a legal exact-version squad, open the share link as another user, cast YES/NO, verify the entry becomes locked, and confirm the original user's profile lists the historical entry.
