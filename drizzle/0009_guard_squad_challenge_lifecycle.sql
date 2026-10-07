CREATE TRIGGER `squad_submission_active_insert`
BEFORE INSERT ON `squad_submissions`
WHEN NOT EXISTS (
 SELECT 1 FROM `daily_squad_challenges` c
 WHERE c.`id`=NEW.`challenge_id`
   AND c.`status`<>'closed'
   AND c.`starts_at`<=CAST(strftime('%s','now') AS INTEGER)*1000
   AND c.`ends_at`>CAST(strftime('%s','now') AS INTEGER)*1000
)
BEGIN
 SELECT RAISE(ABORT,'squad_challenge_inactive');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_active_update`
BEFORE UPDATE OF `name`,`strategy`,`total_cost` ON `squad_submissions`
WHEN NOT EXISTS (
 SELECT 1 FROM `daily_squad_challenges` c
 WHERE c.`id`=OLD.`challenge_id`
   AND c.`status`<>'closed'
   AND c.`starts_at`<=CAST(strftime('%s','now') AS INTEGER)*1000
   AND c.`ends_at`>CAST(strftime('%s','now') AS INTEGER)*1000
)
BEGIN
 SELECT RAISE(ABORT,'squad_challenge_inactive');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_member_active_insert`
BEFORE INSERT ON `squad_submission_members`
WHEN NOT EXISTS (
 SELECT 1 FROM `squad_submissions` s
 JOIN `daily_squad_challenges` c ON c.`id`=s.`challenge_id`
 WHERE s.`id`=NEW.`submission_id`
   AND c.`status`<>'closed'
   AND c.`starts_at`<=CAST(strftime('%s','now') AS INTEGER)*1000
   AND c.`ends_at`>CAST(strftime('%s','now') AS INTEGER)*1000
)
BEGIN
 SELECT RAISE(ABORT,'squad_challenge_inactive');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_member_active_update`
BEFORE UPDATE ON `squad_submission_members`
WHEN NOT EXISTS (
 SELECT 1 FROM `squad_submissions` s
 JOIN `daily_squad_challenges` c ON c.`id`=s.`challenge_id`
 WHERE s.`id`=OLD.`submission_id`
   AND c.`status`<>'closed'
   AND c.`starts_at`<=CAST(strftime('%s','now') AS INTEGER)*1000
   AND c.`ends_at`>CAST(strftime('%s','now') AS INTEGER)*1000
)
BEGIN
 SELECT RAISE(ABORT,'squad_challenge_inactive');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_member_active_delete`
BEFORE DELETE ON `squad_submission_members`
WHEN NOT EXISTS (
 SELECT 1 FROM `squad_submissions` s
 JOIN `daily_squad_challenges` c ON c.`id`=s.`challenge_id`
 WHERE s.`id`=OLD.`submission_id`
   AND c.`status`<>'closed'
   AND c.`starts_at`<=CAST(strftime('%s','now') AS INTEGER)*1000
   AND c.`ends_at`>CAST(strftime('%s','now') AS INTEGER)*1000
)
BEGIN
 SELECT RAISE(ABORT,'squad_challenge_inactive');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_vote_active_insert`
BEFORE INSERT ON `squad_submission_votes`
WHEN NOT EXISTS (
 SELECT 1 FROM `squad_submissions` s
 JOIN `daily_squad_challenges` c ON c.`id`=s.`challenge_id`
 WHERE s.`id`=NEW.`submission_id`
   AND c.`status`<>'closed'
   AND c.`starts_at`<=CAST(strftime('%s','now') AS INTEGER)*1000
   AND c.`ends_at`>CAST(strftime('%s','now') AS INTEGER)*1000
)
BEGIN
 SELECT RAISE(ABORT,'squad_challenge_inactive');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_vote_active_update`
BEFORE UPDATE ON `squad_submission_votes`
WHEN NOT EXISTS (
 SELECT 1 FROM `squad_submissions` s
 JOIN `daily_squad_challenges` c ON c.`id`=s.`challenge_id`
 WHERE s.`id`=NEW.`submission_id`
   AND c.`status`<>'closed'
   AND c.`starts_at`<=CAST(strftime('%s','now') AS INTEGER)*1000
   AND c.`ends_at`>CAST(strftime('%s','now') AS INTEGER)*1000
)
BEGIN
 SELECT RAISE(ABORT,'squad_challenge_inactive');
END;
