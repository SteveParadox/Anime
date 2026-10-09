-- Additive challenge lifecycle. Published rows and cost snapshots remain in the
-- existing tables so historical submissions keep their original foreign keys.
CREATE TABLE character_franchises (
 character_id text PRIMARY KEY,
 franchise_id text NOT NULL
);
CREATE INDEX idx_character_franchises_franchise ON character_franchises(franchise_id,character_id);
CREATE TABLE version_challenge_alignment (
 version_id text PRIMARY KEY REFERENCES character_versions(id),
 alignment text NOT NULL CHECK (alignment IN ('hero','villain','antihero','antagonist','neutral','unknown')),
 notes text NOT NULL DEFAULT ''
);
CREATE INDEX idx_version_challenge_alignment_value ON version_challenge_alignment(alignment,version_id);

ALTER TABLE daily_squad_challenges ADD COLUMN source_type text NOT NULL DEFAULT 'rotation';
ALTER TABLE daily_squad_challenges ADD COLUMN definition_id text;
ALTER TABLE daily_squad_challenges ADD COLUMN objective_json text NOT NULL DEFAULT '{}';
ALTER TABLE daily_squad_challenges ADD COLUMN rules_version integer NOT NULL DEFAULT 1;
ALTER TABLE daily_squad_challenges ADD COLUMN scoring_version integer NOT NULL DEFAULT 1;
ALTER TABLE daily_squad_challenges ADD COLUMN balance_version text;
ALTER TABLE daily_squad_challenges ADD COLUMN tactical_analysis_version integer NOT NULL DEFAULT 1;
ALTER TABLE daily_squad_challenges ADD COLUMN published_at bigint;
-- Existing rotation rows already have complete cost snapshots. Mark their
-- original creation as publication so the guards protect historical costs.
UPDATE daily_squad_challenges SET published_at=created WHERE source_type='rotation' AND status IN ('active','closed');
ALTER TABLE daily_squad_challenge_costs ADD COLUMN roles_snapshot text;
ALTER TABLE daily_squad_challenge_costs ADD COLUMN traits_snapshot text;
CREATE UNIQUE INDEX idx_daily_challenge_definition ON daily_squad_challenges(definition_id) WHERE definition_id IS NOT NULL;
CREATE INDEX idx_daily_challenge_source_window ON daily_squad_challenges(source_type, starts_at, ends_at);

CREATE TABLE challenge_definitions (
 id text PRIMARY KEY,
 creator_user_id text NOT NULL REFERENCES users(id),
 source_type text NOT NULL CHECK (source_type IN ('admin','community','generated')),
 status text NOT NULL CHECK (status IN ('draft','pending_review','approved','voting','selected','scheduled','active','completed','archived','rejected','cancelled','withdrawn')),
 title text NOT NULL,
 description text NOT NULL,
 difficulty text NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
 type text NOT NULL CHECK (type IN ('defeat_target','survive','defend','rescue','capture','open_build')),
 target_character_id text,
 target_version_id text,
 budget integer NOT NULL CHECK (budget BETWEEN 1 AND 1000),
 min_members integer NOT NULL CHECK (min_members BETWEEN 1 AND 5),
 max_members integer NOT NULL CHECK (max_members BETWEEN 1 AND 5 AND max_members >= min_members),
 rules_json text NOT NULL,
 objective_json text NOT NULL,
 rules_version integer NOT NULL DEFAULT 1,
 starts_at bigint,
 ends_at bigint,
 voting_ends_at bigint,
 published_challenge_id text UNIQUE REFERENCES daily_squad_challenges(id),
 created_at bigint NOT NULL,
 updated_at bigint NOT NULL,
 CHECK ((starts_at IS NULL AND ends_at IS NULL) OR (starts_at IS NOT NULL AND ends_at > starts_at))
);
CREATE INDEX idx_challenge_definitions_status_window ON challenge_definitions(status,starts_at,ends_at);
CREATE INDEX idx_challenge_definitions_creator ON challenge_definitions(creator_user_id,created_at DESC);
CREATE INDEX idx_challenge_definitions_vote_close ON challenge_definitions(status,voting_ends_at);
ALTER TABLE daily_squad_challenges ADD CONSTRAINT fk_daily_challenge_definition FOREIGN KEY (definition_id) REFERENCES challenge_definitions(id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE challenge_proposal_votes (
 definition_id text NOT NULL REFERENCES challenge_definitions(id),
 user_id text NOT NULL REFERENCES users(id),
 created_at bigint NOT NULL,
 PRIMARY KEY(definition_id,user_id)
);
CREATE INDEX idx_challenge_proposal_votes_user ON challenge_proposal_votes(user_id);

CREATE TABLE challenge_publication_attempts (
 id text PRIMARY KEY,
 definition_id text NOT NULL REFERENCES challenge_definitions(id),
 attempted_at bigint NOT NULL,
 outcome text NOT NULL CHECK (outcome IN ('published','skipped','failed')),
 detail text NOT NULL
);
CREATE INDEX idx_challenge_publication_attempts_recent ON challenge_publication_attempts(attempted_at DESC);

CREATE TABLE challenge_lifecycle_audit (
 id text PRIMARY KEY,
 definition_id text NOT NULL REFERENCES challenge_definitions(id),
 actor_user_id text REFERENCES users(id),
 from_status text NOT NULL,
 to_status text NOT NULL,
 note text NOT NULL,
 created_at bigint NOT NULL
);
CREATE INDEX idx_challenge_lifecycle_audit_definition ON challenge_lifecycle_audit(definition_id,created_at);

CREATE TABLE challenge_tournaments (
 id text PRIMARY KEY,
 title text NOT NULL,
 description text NOT NULL,
 status text NOT NULL CHECK (status IN ('draft','scheduled','active','completed','cancelled')),
 starts_at bigint NOT NULL,
 ends_at bigint NOT NULL CHECK (ends_at > starts_at),
 scoring_version integer NOT NULL DEFAULT 1,
 created_by text NOT NULL REFERENCES users(id),
 created_at bigint NOT NULL
);
CREATE INDEX idx_challenge_tournaments_window ON challenge_tournaments(status,starts_at,ends_at);

CREATE TABLE challenge_tournament_rounds (
 id text PRIMARY KEY,
 tournament_id text NOT NULL REFERENCES challenge_tournaments(id),
 definition_id text NOT NULL REFERENCES challenge_definitions(id),
 challenge_id text REFERENCES daily_squad_challenges(id),
 round_number integer NOT NULL CHECK (round_number > 0),
 starts_at bigint NOT NULL,
 ends_at bigint NOT NULL CHECK (ends_at > starts_at),
 UNIQUE(tournament_id,round_number),
 UNIQUE(tournament_id,definition_id)
);
CREATE INDEX idx_tournament_rounds_window ON challenge_tournament_rounds(starts_at,ends_at);

CREATE TABLE challenge_tournament_participants (
 tournament_id text NOT NULL REFERENCES challenge_tournaments(id),
 user_id text NOT NULL REFERENCES users(id),
 joined_at bigint NOT NULL,
 PRIMARY KEY(tournament_id,user_id)
);

CREATE TABLE challenge_tournament_results (
 round_id text NOT NULL REFERENCES challenge_tournament_rounds(id),
 user_id text NOT NULL REFERENCES users(id),
 submission_id text NOT NULL UNIQUE REFERENCES squad_submissions(id),
 score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
 scoring_version integer NOT NULL,
 breakdown_json text NOT NULL,
 rules_snapshot text NOT NULL,
 squad_snapshot text NOT NULL,
 submitted_at bigint NOT NULL,
 PRIMARY KEY(round_id,user_id)
);
CREATE INDEX idx_tournament_results_round_score ON challenge_tournament_results(round_id,score DESC,submitted_at,submission_id);

-- Scored squads and published challenge definitions are immutable. The
-- existing submission trigger still handles vote locks and deadlines.
CREATE FUNCTION guard_advanced_challenge_immutability() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE published bigint;
BEGIN
 IF TG_TABLE_NAME='daily_squad_challenges' THEN
 IF OLD.status='closed' AND NEW.status<>'closed' THEN RAISE EXCEPTION 'closed_challenge_immutable'; END IF;
 IF (OLD.status IN ('active','closed') OR OLD.published_at IS NOT NULL) AND
   (NEW.type,NEW.title,NEW.description,NEW.target_character_id,NEW.target_version_id,NEW.budget,NEW.min_members,NEW.max_members,NEW.rules_json,NEW.objective_json,NEW.starts_at,NEW.ends_at,NEW.rules_version,NEW.scoring_version,NEW.balance_version,NEW.tactical_analysis_version)
   IS DISTINCT FROM
   (OLD.type,OLD.title,OLD.description,OLD.target_character_id,OLD.target_version_id,OLD.budget,OLD.min_members,OLD.max_members,OLD.rules_json,OLD.objective_json,OLD.starts_at,OLD.ends_at,OLD.rules_version,OLD.scoring_version,OLD.balance_version,OLD.tactical_analysis_version) THEN
  RAISE EXCEPTION 'published_challenge_immutable';
 END IF;
 END IF;
 IF TG_TABLE_NAME='challenge_definitions' THEN
 IF OLD.published_challenge_id IS NOT NULL AND
   (NEW.title,NEW.description,NEW.difficulty,NEW.type,NEW.target_character_id,NEW.target_version_id,NEW.budget,NEW.min_members,NEW.max_members,NEW.rules_json,NEW.objective_json,NEW.starts_at,NEW.ends_at,NEW.rules_version)
   IS DISTINCT FROM
   (OLD.title,OLD.description,OLD.difficulty,OLD.type,OLD.target_character_id,OLD.target_version_id,OLD.budget,OLD.min_members,OLD.max_members,OLD.rules_json,OLD.objective_json,OLD.starts_at,OLD.ends_at,OLD.rules_version) THEN
  RAISE EXCEPTION 'published_definition_immutable';
 END IF;
 END IF;
 IF TG_TABLE_NAME='daily_squad_challenge_costs' THEN
  IF TG_OP='DELETE' THEN SELECT published_at INTO published FROM daily_squad_challenges WHERE id=OLD.challenge_id;
  ELSE SELECT published_at INTO published FROM daily_squad_challenges WHERE id=NEW.challenge_id; END IF;
  IF published IS NOT NULL THEN RAISE EXCEPTION 'published_challenge_cost_immutable'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 END IF;
 IF TG_TABLE_NAME='squad_submissions' THEN
 IF EXISTS(SELECT 1 FROM challenge_tournament_results WHERE submission_id=OLD.id) AND
   (NEW.name,NEW.strategy,NEW.total_cost,NEW.removed) IS DISTINCT FROM (OLD.name,OLD.strategy,OLD.total_cost,OLD.removed) THEN
  RAISE EXCEPTION 'tournament_submission_immutable';
 END IF;
 END IF;
 IF TG_TABLE_NAME='squad_submission_members' THEN
  IF TG_OP='DELETE' THEN
   IF EXISTS(SELECT 1 FROM challenge_tournament_results WHERE submission_id=OLD.submission_id) THEN RAISE EXCEPTION 'tournament_submission_immutable'; END IF;
   RETURN OLD;
  END IF;
  IF EXISTS(SELECT 1 FROM challenge_tournament_results WHERE submission_id=NEW.submission_id) THEN RAISE EXCEPTION 'tournament_submission_immutable'; END IF;
 END IF;
 IF TG_TABLE_NAME='challenge_tournament_results' THEN
  RAISE EXCEPTION 'tournament_result_immutable';
 END IF;
 IF TG_TABLE_NAME='challenge_tournament_rounds' THEN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'tournament_round_immutable'; END IF;
  IF (NEW.tournament_id,NEW.definition_id,NEW.round_number,NEW.starts_at,NEW.ends_at)
    IS DISTINCT FROM (OLD.tournament_id,OLD.definition_id,OLD.round_number,OLD.starts_at,OLD.ends_at)
    OR (OLD.challenge_id IS NOT NULL AND NEW.challenge_id IS DISTINCT FROM OLD.challenge_id) THEN
   RAISE EXCEPTION 'tournament_round_immutable';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER guard_published_challenge BEFORE UPDATE ON daily_squad_challenges FOR EACH ROW EXECUTE FUNCTION guard_advanced_challenge_immutability();
CREATE TRIGGER guard_scored_submission BEFORE UPDATE ON squad_submissions FOR EACH ROW EXECUTE FUNCTION guard_advanced_challenge_immutability();
CREATE TRIGGER guard_scored_members BEFORE INSERT OR UPDATE OR DELETE ON squad_submission_members FOR EACH ROW EXECUTE FUNCTION guard_advanced_challenge_immutability();
CREATE TRIGGER guard_challenge_definition BEFORE UPDATE ON challenge_definitions FOR EACH ROW EXECUTE FUNCTION guard_advanced_challenge_immutability();
CREATE TRIGGER guard_challenge_costs BEFORE INSERT OR UPDATE OR DELETE ON daily_squad_challenge_costs FOR EACH ROW EXECUTE FUNCTION guard_advanced_challenge_immutability();
CREATE TRIGGER guard_tournament_result BEFORE UPDATE OR DELETE ON challenge_tournament_results FOR EACH ROW EXECUTE FUNCTION guard_advanced_challenge_immutability();
CREATE TRIGGER guard_tournament_round BEFORE UPDATE OR DELETE ON challenge_tournament_rounds FOR EACH ROW EXECUTE FUNCTION guard_advanced_challenge_immutability();

-- Curated identity and continuity data. Unknown alignment is deliberately ineligible for strict events.
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('goku','dragon-ball');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('ichigo','bleach');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('naruto','naruto');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('luffy','one-piece');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('tanjiro','demon-slayer');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('levi','attack-on-titan');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('sakura','naruto');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('shikamaru','naruto');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('chopper','one-piece');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('mikasa','attack-on-titan');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('usopp','one-piece');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('rukia','bleach');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('deku','my-hero-academia');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('yuji','jujutsu-kaisen');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('denji','chainsaw-man');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('asta','black-clover');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('senku','dr-stone');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('shinra','fire-force');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('madara','naruto');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('gojo','jujutsu-kaisen');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('itachi','naruto');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('aizen','bleach');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('saitama','one-punch-man');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('megumi','jujutsu-kaisen');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('vegeta','dragon-ball');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('sasuke','naruto');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('kakashi','naruto');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('zoro','one-piece');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('sanji','one-piece');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('sukuna','jujutsu-kaisen');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('yuta','jujutsu-kaisen');
INSERT INTO character_franchises(character_id,franchise_id) VALUES ('nezuko','demon-slayer');
