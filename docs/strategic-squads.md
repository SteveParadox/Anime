# Strategic Squad Roles

This augments the existing Daily Challenges and Character Version catalog. It does not replace the legacy `squads` table, Battle Arena, or the existing YES/NO voting system.

## Data contracts

- `version_combat_roles`: canonical character version ID + stable combat role, primary/secondary priority, and optional notes. One mapping per version/role; database role allowlist prevents unsupported identifiers.
- `version_strategic_traits`: optional curated tactical traits indicating *how* roles are performed.
- Both link to `character_versions`; character-level `catalog.role` is a legacy display label, not role evidence.
- `squad_submission_members.roles_snapshot` and `traits_snapshot` store compact tactical metadata at submission time. Null means pre-upgrade legacy and must remain null until explicitly resubmitted.
- Existing names, costs, account ownership, and vote locks remain authoritative. Historical votes and squad-vs-squad entries remain untouched.
- `rules_json.roleRequirements` is optional. Examples:
  - `[{"type":"role","role":"healer","min":1}]`
  - `[{"type":"any_of","roles":["tank","defense"],"min":1},{"type":"role","role":"dps","max":2}]`
- Max/min requirements count **distinct fighters**, not the number of role tags. Malformed requirements fail closed when the challenge is loaded. Ordinary challenges have no role restrictions.

## Curation

Migration `0010` seeds 30 existing version IDs only, with 71 curated role assignments and 69 tactical traits. Additional assignments should be reviewed against version abilities and feats and added via a **new append-only** migration. There is no public mutation endpoint. A support character's healing trait is not inferred from free-text ability names.

Uncurated versions show no roles; legacy character-only saved squads are **not** upgraded to a guessed version. The five-character example involving Yoruichi, Orihime, and Kenpachi cannot be seeded because those characters and versions do not exist in this repository's current canonical roster.

## Validation and interpretation

The browser submits only `{characterId,versionId}`; the server reloads authoritative versions, prices, roles, and traits and snapshots the result. Forged roles are rejected by the strict input schema. The builder shows role filters, coverage, concentrations, and deterministic *cross-fighter* synergy examples; it never predicts combat outcomes, modifies costs, or grants hidden rewards. The community verdict remains YES/NO.

## Deployment

Run the usual sequential Drizzle D1 migration workflow to apply `0010` before shipping the updated APIs. Do **not** deploy the new server code first: it queries tables that do not exist pre-migration. For manual verification, run:

```sh
pnpm test:squads
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

No existing migration has been modified. The new tables have role-first indexes for browsing and version-primary keys for batched version lookups.

## Limitations and next steps

Curate remaining catalog versions and add explicit admin-only role editing if the product needs it. No subjective anti-synergy or fake power score is generated. Existing generic comment threads belong to Battle Arena arguments and do not natively reference Daily Challenge submissions; this change does not introduce a duplicate comment system. Evidence remains available in the existing character/feat APIs for manual citation in strategy text. Future profile analytics can aggregate recorded submission role snapshots, but no invented archetype scores are exposed.
