CREATE TABLE "abilities" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "argument_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"battle" text NOT NULL,
	"argument_user" text NOT NULL,
	"contributor" text NOT NULL,
	"reference" text NOT NULL,
	"context" text DEFAULT '' NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "argument_evidence_links" (
	"battle" text NOT NULL,
	"argument_user" text NOT NULL,
	"evidence_id" text NOT NULL,
	"linked_by" text NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "argument_evidence_links_battle_argument_user_evidence_id_pk" PRIMARY KEY("battle","argument_user","evidence_id")
);
--> statement-breakpoint
CREATE TABLE "auth_identities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_user_id" text NOT NULL,
	"provider_email" text,
	"credential_hash" text,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_oauth_states" (
	"state_hash" text PRIMARY KEY NOT NULL,
	"pkce_verifier_hash" text NOT NULL,
	"return_to" text NOT NULL,
	"created" bigint NOT NULL,
	"expires" bigint NOT NULL,
	"used" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_rate_limits" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"window_start" bigint NOT NULL,
	"count" bigint NOT NULL,
	"blocked_until" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"created" bigint NOT NULL,
	"expires" bigint NOT NULL,
	"last_used" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"payload" text NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_votes" (
	"challenge" text NOT NULL,
	"user" text NOT NULL,
	"side" text NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "challenge_votes_challenge_user_pk" PRIMARY KEY("challenge","user")
);
--> statement-breakpoint
CREATE TABLE "character_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"aliases" text DEFAULT '[]' NOT NULL,
	"description" text NOT NULL,
	"era" text,
	"arc" text,
	"sort_order" bigint NOT NULL,
	"canonical" bigint DEFAULT 1 NOT NULL,
	"source_endpoint" text,
	"parent_version_id" text,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"battle" text NOT NULL,
	"argument_user" text NOT NULL,
	"user" text NOT NULL,
	"body" text NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_squad_challenge_costs" (
	"challenge_id" text NOT NULL,
	"character_id" text NOT NULL,
	"version_id" text NOT NULL,
	"cost" bigint NOT NULL,
	CONSTRAINT "daily_squad_challenge_costs_challenge_id_version_id_pk" PRIMARY KEY("challenge_id","version_id")
);
--> statement-breakpoint
CREATE TABLE "daily_squad_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_character_id" text,
	"target_version_id" text,
	"budget" bigint NOT NULL,
	"min_members" bigint DEFAULT 1 NOT NULL,
	"max_members" bigint NOT NULL,
	"rules_json" text DEFAULT '{}' NOT NULL,
	"starts_at" bigint NOT NULL,
	"ends_at" bigint NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"created" bigint NOT NULL,
	"expires" bigint NOT NULL,
	"used" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_records" (
	"id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"source_type" text NOT NULL,
	"series" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"episode" bigint,
	"timestamp" text,
	"chapter" bigint,
	"page" bigint,
	"version_id" text,
	"ability_id" text,
	"submitted_by" text NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL,
	"deleted" bigint DEFAULT 0 NOT NULL,
	"deleted_at" bigint
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"kind" text NOT NULL,
	"message" text NOT NULL,
	"link" text NOT NULL,
	"read" bigint DEFAULT 0 NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"created" bigint NOT NULL,
	"expires" bigint NOT NULL,
	"used" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"user" text NOT NULL,
	"club" text NOT NULL,
	"episode" bigint NOT NULL,
	"body" text NOT NULL,
	"edited" bigint DEFAULT 0 NOT NULL,
	"deleted" bigint DEFAULT 0 NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user" text PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"bio" text DEFAULT '' NOT NULL,
	"favorite_anime" text DEFAULT '[]' NOT NULL,
	"favorite_characters" text DEFAULT '[]' NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"user" text NOT NULL,
	"club" text NOT NULL,
	"episode" bigint NOT NULL,
	CONSTRAINT "progress_user_club_pk" PRIMARY KEY("user","club")
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"user" text NOT NULL,
	"reaction" text NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "reactions_subject_type_subject_id_user_pk" PRIMARY KEY("subject_type","subject_id","user")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squad_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"challenger" text NOT NULL,
	"challenger_squad" text NOT NULL,
	"opponent_squad" text NOT NULL,
	"rules" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squad_submission_members" (
	"submission_id" text NOT NULL,
	"position" bigint NOT NULL,
	"character_id" text NOT NULL,
	"version_id" text NOT NULL,
	"character_name_snapshot" text NOT NULL,
	"version_name_snapshot" text NOT NULL,
	"cost_snapshot" bigint NOT NULL,
	"roles_snapshot" text,
	"traits_snapshot" text,
	CONSTRAINT "squad_submission_members_submission_id_position_pk" PRIMARY KEY("submission_id","position")
);
--> statement-breakpoint
CREATE TABLE "squad_submission_votes" (
	"submission_id" text NOT NULL,
	"user" text NOT NULL,
	"verdict" text NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL,
	CONSTRAINT "squad_submission_votes_submission_id_user_pk" PRIMARY KEY("submission_id","user")
);
--> statement-breakpoint
CREATE TABLE "squad_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"challenge_id" text NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"strategy" text NOT NULL,
	"total_cost" bigint NOT NULL,
	"locked_at" bigint,
	"removed" bigint DEFAULT 0 NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squad_version_costs" (
	"version_id" text PRIMARY KEY NOT NULL,
	"character_id" text NOT NULL,
	"cost" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "squads" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"members" text NOT NULL,
	"strategy" text NOT NULL,
	"challenge" text NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_votes" (
	"week" text NOT NULL,
	"match" text NOT NULL,
	"user" text NOT NULL,
	"pick" text NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "tournament_votes_week_match_user_pk" PRIMARY KEY("week","match","user")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"email_normalized" text,
	"email_verified" bigint DEFAULT 0 NOT NULL,
	"profile_completed" bigint DEFAULT 0 NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "version_abilities" (
	"version_id" text NOT NULL,
	"ability_id" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	CONSTRAINT "version_abilities_version_id_ability_id_pk" PRIMARY KEY("version_id","ability_id")
);
--> statement-breakpoint
CREATE TABLE "version_combat_roles" (
	"version_id" text NOT NULL,
	"role" text NOT NULL,
	"priority" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	CONSTRAINT "version_combat_roles_version_id_role_pk" PRIMARY KEY("version_id","role"),
	CONSTRAINT "version_combat_roles_role_valid" CHECK ("version_combat_roles"."role" IN ('dps','tank','support','healer','controller','strategist','assassin','speedster','summoner','reality_manipulator','defense')),
	CONSTRAINT "version_combat_roles_priority_valid" CHECK ("version_combat_roles"."priority" IN ('primary','secondary'))
);
--> statement-breakpoint
CREATE TABLE "version_strategic_traits" (
	"version_id" text NOT NULL,
	"trait" text NOT NULL,
	CONSTRAINT "version_strategic_traits_version_id_trait_pk" PRIMARY KEY("version_id","trait"),
	CONSTRAINT "version_strategic_traits_trait_valid" CHECK ("version_strategic_traits"."trait" IN ('healing','barrier','crowd_control','mobility','teleportation','information','buff','debuff','sealing','summoning','illusion','stealth','long_range','close_range','area_damage','single_target','adaptation','prediction','anti_regeneration'))
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"argument_id" bigint GENERATED BY DEFAULT AS IDENTITY (sequence name "votes_argument_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"battle" text NOT NULL,
	"user" text NOT NULL,
	"side" text NOT NULL,
	"difficulty" text,
	"reason" text NOT NULL,
	"evidence" text NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "votes_battle_user_pk" PRIMARY KEY("battle","user")
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"user" text NOT NULL,
	"anime" text NOT NULL,
	"status" text NOT NULL,
	"created" bigint NOT NULL,
	CONSTRAINT "watchlist_user_anime_pk" PRIMARY KEY("user","anime")
);
--> statement-breakpoint
ALTER TABLE "version_combat_roles" ADD CONSTRAINT "version_combat_roles_version_id_character_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."character_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_strategic_traits" ADD CONSTRAINT "version_strategic_traits_version_id_character_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."character_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_abilities_character" ON "abilities" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "idx_argument_evidence_battle_user" ON "argument_evidence" USING btree ("battle","argument_user");--> statement-breakpoint
CREATE INDEX "idx_argument_evidence_created" ON "argument_evidence" USING btree ("created");--> statement-breakpoint
CREATE INDEX "idx_argument_evidence_links_battle_user" ON "argument_evidence_links" USING btree ("battle","argument_user");--> statement-breakpoint
CREATE INDEX "idx_argument_evidence_links_evidence" ON "argument_evidence_links" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "idx_argument_evidence_links_created" ON "argument_evidence_links" USING btree ("created");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_auth_identity_provider_subject" ON "auth_identities" USING btree ("provider","provider_user_id");--> statement-breakpoint
CREATE INDEX "idx_auth_identity_user" ON "auth_identities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_auth_oauth_states_expires" ON "auth_oauth_states" USING btree ("expires");--> statement-breakpoint
CREATE INDEX "idx_auth_rate_limits_window" ON "auth_rate_limits" USING btree ("window_start");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_auth_sessions_token_hash" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_auth_sessions_user_expires" ON "auth_sessions" USING btree ("user_id","expires");--> statement-breakpoint
CREATE INDEX "idx_character_versions_character" ON "character_versions" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "idx_character_versions_character_order" ON "character_versions" USING btree ("character_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_character_versions_parent" ON "character_versions" USING btree ("parent_version_id");--> statement-breakpoint
CREATE INDEX "idx_comments_argument" ON "comments" USING btree ("battle","argument_user");--> statement-breakpoint
CREATE INDEX "idx_daily_squad_challenge_costs_challenge" ON "daily_squad_challenge_costs" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "idx_daily_squad_challenge_costs_character" ON "daily_squad_challenge_costs" USING btree ("challenge_id","character_id");--> statement-breakpoint
CREATE INDEX "idx_daily_squad_challenges_window" ON "daily_squad_challenges" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "idx_daily_squad_challenges_status_window" ON "daily_squad_challenges" USING btree ("status","starts_at","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_email_verification_token_hash" ON "email_verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_email_verification_user" ON "email_verification_tokens" USING btree ("user_id","expires");--> statement-breakpoint
CREATE INDEX "idx_evidence_records_character" ON "evidence_records" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_records_character_category" ON "evidence_records" USING btree ("character_id","category");--> statement-breakpoint
CREATE INDEX "idx_evidence_records_source_type" ON "evidence_records" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_evidence_records_version" ON "evidence_records" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_records_version_category" ON "evidence_records" USING btree ("version_id","category");--> statement-breakpoint
CREATE INDEX "idx_evidence_records_ability" ON "evidence_records" USING btree ("ability_id");--> statement-breakpoint
CREATE INDEX "idx_evidence_records_created" ON "evidence_records" USING btree ("created");--> statement-breakpoint
CREATE INDEX "idx_evidence_records_active_character_created" ON "evidence_records" USING btree ("character_id","deleted","created");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_created" ON "notifications" USING btree ("user","created");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_password_reset_token_hash" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_password_reset_user" ON "password_reset_tokens" USING btree ("user_id","expires");--> statement-breakpoint
CREATE INDEX "idx_posts_club_episode" ON "posts" USING btree ("club","episode");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_profiles_handle" ON "profiles" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "idx_reports_status_created" ON "reports" USING btree ("status","created");--> statement-breakpoint
CREATE INDEX "idx_challenges_created" ON "squad_challenges" USING btree ("created");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_squad_submission_members_version" ON "squad_submission_members" USING btree ("submission_id","version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_squad_submission_members_character_once" ON "squad_submission_members" USING btree ("submission_id","character_id");--> statement-breakpoint
CREATE INDEX "idx_squad_submission_members_submission" ON "squad_submission_members" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_squad_submission_members_character" ON "squad_submission_members" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "idx_squad_submission_votes_submission" ON "squad_submission_votes" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "idx_squad_submission_votes_user" ON "squad_submission_votes" USING btree ("user");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_squad_submissions_challenge_owner" ON "squad_submissions" USING btree ("challenge_id","owner");--> statement-breakpoint
CREATE INDEX "idx_squad_submissions_challenge_created" ON "squad_submissions" USING btree ("challenge_id","created");--> statement-breakpoint
CREATE INDEX "idx_squad_submissions_owner_created" ON "squad_submissions" USING btree ("owner","created");--> statement-breakpoint
CREATE INDEX "idx_squad_version_costs_character" ON "squad_version_costs" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "idx_squad_version_costs_cost" ON "squad_version_costs" USING btree ("cost");--> statement-breakpoint
CREATE INDEX "idx_squads_owner" ON "squads" USING btree ("owner");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email_normalized" ON "users" USING btree ("email_normalized");--> statement-breakpoint
CREATE INDEX "idx_version_abilities_version" ON "version_abilities" USING btree ("version_id");--> statement-breakpoint
CREATE INDEX "idx_version_abilities_ability" ON "version_abilities" USING btree ("ability_id");--> statement-breakpoint
CREATE INDEX "idx_version_combat_roles_role" ON "version_combat_roles" USING btree ("role","version_id");--> statement-breakpoint
CREATE INDEX "idx_version_strategic_traits_trait" ON "version_strategic_traits" USING btree ("trait","version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_votes_argument_id" ON "votes" USING btree ("argument_id");