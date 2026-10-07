CREATE TABLE `squad_version_costs` (
 `version_id` text PRIMARY KEY NOT NULL,
 `character_id` text NOT NULL,
 `cost` integer NOT NULL CHECK (`cost` >= 1 AND `cost` <= 1000),
 `updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_squad_version_costs_character` ON `squad_version_costs` (`character_id`);
--> statement-breakpoint
CREATE INDEX `idx_squad_version_costs_cost` ON `squad_version_costs` (`cost`);
--> statement-breakpoint
CREATE TABLE `daily_squad_challenges` (
 `id` text PRIMARY KEY NOT NULL,
 `type` text NOT NULL CHECK (`type` IN ('defeat_target','survive','defend','capture','open_build')),
 `title` text NOT NULL,
 `description` text NOT NULL,
 `target_character_id` text,
 `target_version_id` text,
 `budget` integer NOT NULL CHECK (`budget` > 0),
 `min_members` integer DEFAULT 1 NOT NULL CHECK (`min_members` >= 1),
 `max_members` integer NOT NULL CHECK (`max_members` >= `min_members` AND `max_members` <= 10),
 `rules_json` text DEFAULT '{}' NOT NULL,
 `starts_at` integer NOT NULL,
 `ends_at` integer NOT NULL CHECK (`ends_at` > `starts_at`),
 `status` text DEFAULT 'scheduled' NOT NULL CHECK (`status` IN ('scheduled','active','closed')),
 `created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_daily_squad_challenges_window` ON `daily_squad_challenges` (`starts_at`,`ends_at`);
--> statement-breakpoint
CREATE INDEX `idx_daily_squad_challenges_status_window` ON `daily_squad_challenges` (`status`,`starts_at`,`ends_at`);
--> statement-breakpoint
CREATE TABLE `daily_squad_challenge_costs` (
 `challenge_id` text NOT NULL,
 `character_id` text NOT NULL,
 `version_id` text NOT NULL,
 `cost` integer NOT NULL CHECK (`cost` >= 1 AND `cost` <= 1000),
 PRIMARY KEY(`challenge_id`,`version_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_daily_squad_challenge_costs_challenge` ON `daily_squad_challenge_costs` (`challenge_id`);
--> statement-breakpoint
CREATE INDEX `idx_daily_squad_challenge_costs_character` ON `daily_squad_challenge_costs` (`challenge_id`,`character_id`);
--> statement-breakpoint
CREATE TABLE `squad_submissions` (
 `id` text PRIMARY KEY NOT NULL,
 `challenge_id` text NOT NULL,
 `owner` text NOT NULL,
 `name` text NOT NULL,
 `strategy` text NOT NULL,
 `total_cost` integer NOT NULL CHECK (`total_cost` >= 0),
 `locked_at` integer,
 `removed` integer DEFAULT 0 NOT NULL CHECK (`removed` IN (0,1)),
 `created` integer NOT NULL,
 `updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_squad_submissions_challenge_owner` ON `squad_submissions` (`challenge_id`,`owner`);
--> statement-breakpoint
CREATE INDEX `idx_squad_submissions_challenge_created` ON `squad_submissions` (`challenge_id`,`created`);
--> statement-breakpoint
CREATE INDEX `idx_squad_submissions_owner_created` ON `squad_submissions` (`owner`,`created`);
--> statement-breakpoint
CREATE TABLE `squad_submission_members` (
 `submission_id` text NOT NULL,
 `position` integer NOT NULL CHECK (`position` >= 0),
 `character_id` text NOT NULL,
 `version_id` text NOT NULL,
 `character_name_snapshot` text NOT NULL,
 `version_name_snapshot` text NOT NULL,
 `cost_snapshot` integer NOT NULL CHECK (`cost_snapshot` >= 1),
 PRIMARY KEY(`submission_id`,`position`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_squad_submission_members_version` ON `squad_submission_members` (`submission_id`,`version_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_squad_submission_members_character_once` ON `squad_submission_members` (`submission_id`,`character_id`);
--> statement-breakpoint
CREATE INDEX `idx_squad_submission_members_submission` ON `squad_submission_members` (`submission_id`);
--> statement-breakpoint
CREATE INDEX `idx_squad_submission_members_character` ON `squad_submission_members` (`character_id`);
--> statement-breakpoint
CREATE TABLE `squad_submission_votes` (
 `submission_id` text NOT NULL,
 `user` text NOT NULL,
 `verdict` text NOT NULL CHECK (`verdict` IN ('yes','no')),
 `created` integer NOT NULL,
 `updated` integer NOT NULL,
 PRIMARY KEY(`submission_id`,`user`)
);
--> statement-breakpoint
CREATE INDEX `idx_squad_submission_votes_submission` ON `squad_submission_votes` (`submission_id`);
--> statement-breakpoint
CREATE INDEX `idx_squad_submission_votes_user` ON `squad_submission_votes` (`user`);
--> statement-breakpoint
CREATE TRIGGER `squad_submission_vote_guard_insert`
BEFORE INSERT ON `squad_submission_votes`
WHEN NOT EXISTS (
 SELECT 1 FROM `squad_submissions` s
 WHERE s.`id`=NEW.`submission_id`
   AND s.`removed`=0
   AND s.`owner`<>NEW.`user`
)
BEGIN
 SELECT RAISE(ABORT,'squad_submission_vote_forbidden');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_vote_guard_update`
BEFORE UPDATE ON `squad_submission_votes`
WHEN NOT EXISTS (
 SELECT 1 FROM `squad_submissions` s
 WHERE s.`id`=NEW.`submission_id`
   AND s.`removed`=0
   AND s.`owner`<>NEW.`user`
)
BEGIN
 SELECT RAISE(ABORT,'squad_submission_vote_forbidden');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_vote_lock_update`
BEFORE UPDATE OF `name`,`strategy`,`total_cost` ON `squad_submissions`
WHEN EXISTS (SELECT 1 FROM `squad_submission_votes` WHERE `submission_id`=OLD.`id`)
BEGIN
 SELECT RAISE(ABORT,'squad_submission_locked');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_vote_lock_member_insert`
BEFORE INSERT ON `squad_submission_members`
WHEN EXISTS (SELECT 1 FROM `squad_submission_votes` WHERE `submission_id`=NEW.`submission_id`)
BEGIN
 SELECT RAISE(ABORT,'squad_submission_locked');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_vote_lock_member_update`
BEFORE UPDATE ON `squad_submission_members`
WHEN EXISTS (SELECT 1 FROM `squad_submission_votes` WHERE `submission_id`=OLD.`submission_id`)
BEGIN
 SELECT RAISE(ABORT,'squad_submission_locked');
END;
--> statement-breakpoint
CREATE TRIGGER `squad_submission_vote_lock_member_delete`
BEFORE DELETE ON `squad_submission_members`
WHEN EXISTS (SELECT 1 FROM `squad_submission_votes` WHERE `submission_id`=OLD.`submission_id`)
BEGIN
 SELECT RAISE(ABORT,'squad_submission_locked');
END;
--> statement-breakpoint
INSERT INTO `squad_version_costs` (`version_id`,`character_id`,`cost`,`updated`) VALUES
 ('goku-saiyan-saga','goku',30,1791396000000),
 ('goku-namek-saga','goku',45,1791396000000),
 ('goku-super-saiyan','goku',58,1791396000000),
 ('goku-super-saiyan-2','goku',64,1791396000000),
 ('goku-super-saiyan-3','goku',72,1791396000000),
 ('goku-end-z','goku',76,1791396000000),
 ('goku-super-saiyan-god','goku',83,1791396000000),
 ('goku-super-saiyan-blue','goku',91,1791396000000),
 ('goku-ui-sign','goku',96,1791396000000),
 ('goku-mastered-ultra-instinct','goku',100,1791396000000),
 ('naruto-academy','naruto',8,1791396000000),
 ('naruto-chunin-exam','naruto',15,1791396000000),
 ('naruto-original-series-end','naruto',20,1791396000000),
 ('naruto-shippuden','naruto',25,1791396000000),
 ('naruto-sage-mode','naruto',34,1791396000000),
 ('naruto-kcm','naruto',49,1791396000000),
 ('naruto-six-paths','naruto',72,1791396000000),
 ('naruto-baryon-mode','naruto',94,1791396000000),
 ('ichigo-shikai','ichigo',28,1791396000000),
 ('ichigo-bankai','ichigo',52,1791396000000),
 ('ichigo-hollowfication','ichigo',68,1791396000000),
 ('ichigo-original-anime-end','ichigo',74,1791396000000),
 ('luffy-east-blue-end','luffy',18,1791396000000),
 ('luffy-base','luffy',25,1791396000000),
 ('luffy-gear-2','luffy',38,1791396000000),
 ('luffy-gear-4','luffy',67,1791396000000),
 ('luffy-gear-5','luffy',92,1791396000000),
 ('tanjiro-season-1','tanjiro',10,1791396000000),
 ('tanjiro-water-breathing','tanjiro',13,1791396000000),
 ('tanjiro-hinokami-kagura','tanjiro',20,1791396000000),
 ('levi-season-1','levi',12,1791396000000),
 ('levi-standard-odm','levi',15,1791396000000),
 ('levi-thunder-spears','levi',18,1791396000000),
 ('sakura-byakugo','sakura',22,1791396000000),
 ('shikamaru-standard','shikamaru',18,1791396000000),
 ('chopper-brain-point','chopper',10,1791396000000),
 ('chopper-guard-point','chopper',13,1791396000000),
 ('chopper-monster-point','chopper',25,1791396000000),
 ('mikasa-standard-odm','mikasa',12,1791396000000),
 ('mikasa-thunder-spears','mikasa',18,1791396000000),
 ('usopp-kabuto','usopp',8,1791396000000),
 ('usopp-pop-greens','usopp',12,1791396000000),
 ('rukia-shikai','rukia',26,1791396000000),
 ('rukia-bankai','rukia',58,1791396000000),
 ('deku-full-cowling','deku',38,1791396000000),
 ('deku-ofa-100','deku',68,1791396000000),
 ('yuji-cursed-energy','yuji',16,1791396000000),
 ('yuji-black-flash','yuji',24,1791396000000),
 ('denji-human','denji',8,1791396000000),
 ('denji-chainsaw-hybrid','denji',32,1791396000000),
 ('asta-black-form','asta',42,1791396000000),
 ('asta-devil-union','asta',68,1791396000000),
 ('senku-science-kingdom','senku',8,1791396000000),
 ('shinra-adolla-burst','shinra',44,1791396000000),
 ('shinra-rapid','shinra',63,1791396000000);
