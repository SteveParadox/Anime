CREATE TABLE `evidence_records` (
	`id` text PRIMARY KEY NOT NULL,
	`character_id` text NOT NULL,
	`source_type` text NOT NULL,
	`series` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`episode` integer,
	`timestamp` text,
	`chapter` integer,
	`page` integer,
	`submitted_by` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_evidence_records_character` ON `evidence_records` (`character_id`);
--> statement-breakpoint
CREATE INDEX `idx_evidence_records_character_category` ON `evidence_records` (`character_id`,`category`);
--> statement-breakpoint
CREATE INDEX `idx_evidence_records_source_type` ON `evidence_records` (`source_type`);
--> statement-breakpoint
CREATE INDEX `idx_evidence_records_created` ON `evidence_records` (`created`);
--> statement-breakpoint
CREATE INDEX `idx_evidence_records_active_character_created` ON `evidence_records` (`character_id`,`deleted`,`created`);
--> statement-breakpoint
CREATE TABLE `argument_evidence_links` (
	`battle` text NOT NULL,
	`argument_user` text NOT NULL,
	`evidence_id` text NOT NULL,
	`linked_by` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`battle`, `argument_user`, `evidence_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_argument_evidence_links_battle_user` ON `argument_evidence_links` (`battle`,`argument_user`);
--> statement-breakpoint
CREATE INDEX `idx_argument_evidence_links_evidence` ON `argument_evidence_links` (`evidence_id`);
--> statement-breakpoint
CREATE INDEX `idx_argument_evidence_links_created` ON `argument_evidence_links` (`created`);
