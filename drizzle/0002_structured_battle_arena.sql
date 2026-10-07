ALTER TABLE `votes` ADD `difficulty` text;
--> statement-breakpoint
CREATE TABLE `argument_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`battle` text NOT NULL,
	`argument_user` text NOT NULL,
	`contributor` text NOT NULL,
	`reference` text NOT NULL,
	`context` text DEFAULT '' NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_argument_evidence_battle_user` ON `argument_evidence` (`battle`,`argument_user`);
--> statement-breakpoint
CREATE INDEX `idx_argument_evidence_created` ON `argument_evidence` (`created`);
