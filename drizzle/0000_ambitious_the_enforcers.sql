CREATE TABLE `battles` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`payload` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text NOT NULL,
	`club` text NOT NULL,
	`episode` integer NOT NULL,
	`body` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_posts_club_episode` ON `posts` (`club`,`episode`);--> statement-breakpoint
CREATE TABLE `progress` (
	`user` text NOT NULL,
	`club` text NOT NULL,
	`episode` integer NOT NULL,
	PRIMARY KEY(`user`, `club`)
);
--> statement-breakpoint
CREATE TABLE `squads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`members` text NOT NULL,
	`strategy` text NOT NULL,
	`challenge` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_squads_owner` ON `squads` (`owner`);--> statement-breakpoint
CREATE TABLE `votes` (
	`battle` text NOT NULL,
	`user` text NOT NULL,
	`side` text NOT NULL,
	`reason` text NOT NULL,
	`evidence` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`battle`, `user`)
);
