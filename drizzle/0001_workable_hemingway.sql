CREATE TABLE `challenge_votes` (
	`challenge` text NOT NULL,
	`user` text NOT NULL,
	`side` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`challenge`, `user`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`battle` text NOT NULL,
	`argument_user` text NOT NULL,
	`user` text NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_comments_argument` ON `comments` (`battle`,`argument_user`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`link` text NOT NULL,
	`read` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user_created` ON `notifications` (`user`,`created`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`display_name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`favorite_anime` text DEFAULT '[]' NOT NULL,
	`favorite_characters` text DEFAULT '[]' NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_handle` ON `profiles` (`handle`);--> statement-breakpoint
CREATE TABLE `reactions` (
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`user` text NOT NULL,
	`reaction` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`subject_type`, `subject_id`, `user`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reports_status_created` ON `reports` (`status`,`created`);--> statement-breakpoint
CREATE TABLE `squad_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`challenger` text NOT NULL,
	`challenger_squad` text NOT NULL,
	`opponent_squad` text NOT NULL,
	`rules` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_challenges_created` ON `squad_challenges` (`created`);--> statement-breakpoint
CREATE TABLE `tournament_votes` (
	`week` text NOT NULL,
	`match` text NOT NULL,
	`user` text NOT NULL,
	`pick` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`week`, `match`, `user`)
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`user` text NOT NULL,
	`anime` text NOT NULL,
	`status` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`user`, `anime`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `edited` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `deleted` integer DEFAULT 0 NOT NULL;