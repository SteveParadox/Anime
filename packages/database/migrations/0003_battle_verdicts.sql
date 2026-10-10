-- Official outcomes are distinct from open community polls and squad tournaments.
-- Timestamps are milliseconds since epoch to match existing battle/vote storage.
CREATE TABLE battle_results (
 battle_id text PRIMARY KEY REFERENCES battles(id) ON DELETE RESTRICT,
 fighter_a_id text NOT NULL,
 fighter_a_version_id text NOT NULL,
 fighter_b_id text NOT NULL,
 fighter_b_version_id text NOT NULL,
 conditions_json text NOT NULL,
 outcome text NOT NULL CHECK (outcome IN ('a','b','draw','no_contest')),
 status text NOT NULL DEFAULT 'FINALIZED' CHECK (status IN ('FINALIZED','NO_CONTEST','VOIDED')),
 source_type text NOT NULL DEFAULT 'COMMUNITY_VERDICT' CHECK (source_type IN ('COMMUNITY_VERDICT')),
 votes_a integer NOT NULL CHECK (votes_a >= 0),
 votes_b integer NOT NULL CHECK (votes_b >= 0),
 votes_draw integer NOT NULL CHECK (votes_draw >= 0),
 difficulty_json text NOT NULL,
 scoring_version integer NOT NULL,
 finalized_at bigint NOT NULL,
 finalized_by text NOT NULL,
 voided_at bigint,
 void_reason text,
 CHECK ((outcome = 'no_contest') = (status = 'NO_CONTEST') OR status = 'VOIDED'),
 CHECK ((status = 'VOIDED') = (voided_at IS NOT NULL))
);
CREATE INDEX idx_battle_results_fighter_a ON battle_results (fighter_a_id,status,finalized_at DESC);
CREATE INDEX idx_battle_results_fighter_b ON battle_results (fighter_b_id,status,finalized_at DESC);
CREATE INDEX idx_battle_results_version_a ON battle_results (fighter_a_version_id,status);
CREATE INDEX idx_battle_results_version_b ON battle_results (fighter_b_version_id,status);
CREATE INDEX idx_battle_results_decided ON battle_results (finalized_at DESC) WHERE status='FINALIZED';
CREATE INDEX idx_votes_battle_created ON votes (battle,created);

CREATE TABLE battle_result_audit (
 id text PRIMARY KEY,
 battle_id text NOT NULL REFERENCES battle_results(battle_id) ON DELETE RESTRICT,
 action text NOT NULL CHECK (action IN ('FINALIZE','VOID')),
 actor_user_id text NOT NULL,
 reason text NOT NULL,
 snapshot_json text NOT NULL,
 created_at bigint NOT NULL
);
CREATE INDEX idx_battle_result_audit_battle ON battle_result_audit(battle_id,created_at);

CREATE TABLE battle_rematches (
 original_battle_id text NOT NULL REFERENCES battles(id) ON DELETE RESTRICT,
 rematch_battle_id text PRIMARY KEY REFERENCES battles(id) ON DELETE RESTRICT,
 created_by text NOT NULL,
 created_at bigint NOT NULL,
 CHECK (original_battle_id <> rematch_battle_id)
);
CREATE INDEX idx_battle_rematches_parent ON battle_rematches (original_battle_id);

CREATE TABLE battle_collections (
 id text PRIMARY KEY,
 owner_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
 description text NOT NULL DEFAULT '',
 visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private')),
 created_at bigint NOT NULL,
 updated_at bigint NOT NULL
);
CREATE INDEX idx_battle_collections_public ON battle_collections (updated_at DESC) WHERE visibility='public';
CREATE INDEX idx_battle_collections_owner ON battle_collections(owner_user_id,updated_at DESC);

CREATE TABLE battle_collection_items (
 collection_id text NOT NULL REFERENCES battle_collections(id) ON DELETE CASCADE,
 battle_id text NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
 position integer NOT NULL CHECK (position >= 0),
 added_at bigint NOT NULL,
 PRIMARY KEY (collection_id,battle_id)
);
CREATE INDEX idx_battle_collection_items_position ON battle_collection_items(collection_id,position,battle_id);


-- Ineligible historical battles must not indefinitely occupy the worker's
-- bounded finalization batch. Record intentional exclusions for auditability.
CREATE TABLE battle_finalization_skips (
 battle_id text PRIMARY KEY REFERENCES battles(id) ON DELETE CASCADE,
 reason text NOT NULL,
 recorded_at bigint NOT NULL
);
