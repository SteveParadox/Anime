-- Preserve the database guards in D1 migrations 0006 and 0009. The row lock
-- on the parent submission serializes voting and edits across API instances.
CREATE OR REPLACE FUNCTION guard_squad_submission() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  candidate_id text;
  owner_id text;
  is_removed bigint;
  has_votes boolean;
  is_active boolean;
BEGIN
  IF TG_TABLE_NAME = 'squad_submissions' THEN
    candidate_id := COALESCE(NEW.id, OLD.id);
    IF TG_OP = 'UPDATE' AND (NEW.name, NEW.strategy, NEW.total_cost)
        IS DISTINCT FROM (OLD.name, OLD.strategy, OLD.total_cost) THEN
      IF EXISTS (SELECT 1 FROM squad_submission_votes WHERE submission_id = OLD.id) THEN
        RAISE EXCEPTION 'squad_submission_locked';
      END IF;
    END IF;
  ELSE
    candidate_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.submission_id ELSE NEW.submission_id END;
    SELECT owner, removed INTO owner_id, is_removed FROM squad_submissions WHERE id = candidate_id FOR UPDATE;
    IF TG_TABLE_NAME = 'squad_submission_members' AND
       EXISTS (SELECT 1 FROM squad_submission_votes WHERE submission_id = candidate_id) THEN
      RAISE EXCEPTION 'squad_submission_locked';
    END IF;
    IF TG_TABLE_NAME = 'squad_submission_votes' THEN
      IF owner_id IS NULL OR is_removed <> 0 OR owner_id = NEW."user" THEN
        RAISE EXCEPTION 'squad_submission_vote_forbidden';
      END IF;
    END IF;
  END IF;

  SELECT c.status <> 'closed'
     AND c.starts_at <= (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint
     AND c.ends_at > (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint
    INTO is_active
    FROM squad_submissions s JOIN daily_squad_challenges c ON c.id = s.challenge_id
   WHERE s.id = candidate_id;
  IF TG_TABLE_NAME = 'squad_submissions' AND TG_OP = 'INSERT' THEN
    SELECT c.status <> 'closed'
       AND c.starts_at <= (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint
       AND c.ends_at > (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint
      INTO is_active FROM daily_squad_challenges c WHERE c.id = NEW.challenge_id;
  END IF;
  IF is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'squad_challenge_inactive';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER guard_squad_submission_insert BEFORE INSERT ON squad_submissions
  FOR EACH ROW EXECUTE FUNCTION guard_squad_submission();
CREATE TRIGGER guard_squad_submission_update BEFORE UPDATE OF name, strategy, total_cost ON squad_submissions
  FOR EACH ROW EXECUTE FUNCTION guard_squad_submission();
CREATE TRIGGER guard_squad_member_write BEFORE INSERT OR UPDATE OR DELETE ON squad_submission_members
  FOR EACH ROW EXECUTE FUNCTION guard_squad_submission();
CREATE TRIGGER guard_squad_vote_write BEFORE INSERT OR UPDATE ON squad_submission_votes
  FOR EACH ROW EXECUTE FUNCTION guard_squad_submission();
