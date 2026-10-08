-- Anime Clash PostgreSQL baseline from D1 migrations 0000..0010.

-- Apply only to an empty database. Historical IDs and millisecond timestamps remain unchanged.

CREATE TABLE "abilities" (
  "id" TEXT NOT NULL,
  "character_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "argument_evidence" (
  "id" TEXT NOT NULL,
  "battle" TEXT NOT NULL,
  "argument_user" TEXT NOT NULL,
  "contributor" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "context" TEXT NOT NULL DEFAULT '',
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "argument_evidence_links" (
  "battle" TEXT NOT NULL,
  "argument_user" TEXT NOT NULL,
  "evidence_id" TEXT NOT NULL,
  "linked_by" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("battle", "argument_user", "evidence_id")
);

CREATE TABLE "auth_identities" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_user_id" TEXT NOT NULL,
  "provider_email" TEXT,
  "credential_hash" TEXT,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "auth_oauth_states" (
  "state_hash" TEXT NOT NULL,
  "pkce_verifier_hash" TEXT NOT NULL,
  "return_to" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  "expires" BIGINT NOT NULL,
  "used" BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY ("state_hash")
);

CREATE TABLE "auth_rate_limits" (
  "key_hash" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "window_start" BIGINT NOT NULL,
  "count" BIGINT NOT NULL,
  "blocked_until" BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY ("key_hash")
);

CREATE TABLE "auth_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  "expires" BIGINT NOT NULL,
  "last_used" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "battles" (
  "id" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "challenge_votes" (
  "challenge" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "side" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("challenge", "user")
);

CREATE TABLE "character_versions" (
  "id" TEXT NOT NULL,
  "character_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "short_name" TEXT,
  "aliases" TEXT NOT NULL DEFAULT '[]',
  "description" TEXT NOT NULL,
  "era" TEXT,
  "arc" TEXT,
  "sort_order" BIGINT NOT NULL,
  "canonical" BIGINT NOT NULL DEFAULT 1,
  "source_endpoint" TEXT,
  "parent_version_id" TEXT,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "comments" (
  "id" TEXT NOT NULL,
  "battle" TEXT NOT NULL,
  "argument_user" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "daily_squad_challenge_costs" (
  "challenge_id" TEXT NOT NULL,
  "character_id" TEXT NOT NULL,
  "version_id" TEXT NOT NULL,
  "cost" BIGINT NOT NULL,
  PRIMARY KEY ("challenge_id", "version_id")
);

CREATE TABLE "daily_squad_challenges" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "target_character_id" TEXT,
  "target_version_id" TEXT,
  "budget" BIGINT NOT NULL,
  "min_members" BIGINT NOT NULL DEFAULT 1,
  "max_members" BIGINT NOT NULL,
  "rules_json" TEXT NOT NULL DEFAULT '{}',
  "starts_at" BIGINT NOT NULL,
  "ends_at" BIGINT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "email_verification_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  "expires" BIGINT NOT NULL,
  "used" BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY ("id")
);

CREATE TABLE "evidence_records" (
  "id" TEXT NOT NULL,
  "character_id" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "series" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "episode" BIGINT,
  "timestamp" TEXT,
  "chapter" BIGINT,
  "page" BIGINT,
  "submitted_by" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  "updated" BIGINT NOT NULL,
  "deleted" BIGINT NOT NULL DEFAULT 0,
  "deleted_at" BIGINT,
  "version_id" TEXT,
  "ability_id" TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT NOT NULL,
  "read" BIGINT NOT NULL DEFAULT 0,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "password_reset_tokens" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  "expires" BIGINT NOT NULL,
  "used" BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY ("id")
);

CREATE TABLE "posts" (
  "id" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "club" TEXT NOT NULL,
  "episode" BIGINT NOT NULL,
  "body" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  "edited" BIGINT NOT NULL DEFAULT 0,
  "deleted" BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY ("id")
);

CREATE TABLE "profiles" (
  "user" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "bio" TEXT NOT NULL DEFAULT '',
  "favorite_anime" TEXT NOT NULL DEFAULT '[]',
  "favorite_characters" TEXT NOT NULL DEFAULT '[]',
  "created" BIGINT NOT NULL,
  "updated" BIGINT NOT NULL,
  "avatar_url" TEXT,
  PRIMARY KEY ("user")
);

CREATE TABLE "progress" (
  "user" TEXT NOT NULL,
  "club" TEXT NOT NULL,
  "episode" BIGINT NOT NULL,
  PRIMARY KEY ("user", "club")
);

CREATE TABLE "reactions" (
  "subject_type" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "reaction" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("subject_type", "subject_id", "user")
);

CREATE TABLE "reports" (
  "id" TEXT NOT NULL,
  "reporter" TEXT NOT NULL,
  "subject_type" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "squad_challenges" (
  "id" TEXT NOT NULL,
  "challenger" TEXT NOT NULL,
  "challenger_squad" TEXT NOT NULL,
  "opponent_squad" TEXT NOT NULL,
  "rules" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "squad_submission_members" (
  "submission_id" TEXT NOT NULL,
  "position" BIGINT NOT NULL,
  "character_id" TEXT NOT NULL,
  "version_id" TEXT NOT NULL,
  "character_name_snapshot" TEXT NOT NULL,
  "version_name_snapshot" TEXT NOT NULL,
  "cost_snapshot" BIGINT NOT NULL,
  "roles_snapshot" TEXT,
  "traits_snapshot" TEXT,
  PRIMARY KEY ("submission_id", "position")
);

CREATE TABLE "squad_submission_votes" (
  "submission_id" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "verdict" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  "updated" BIGINT NOT NULL,
  PRIMARY KEY ("submission_id", "user")
);

CREATE TABLE "squad_submissions" (
  "id" TEXT NOT NULL,
  "challenge_id" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "strategy" TEXT NOT NULL,
  "total_cost" BIGINT NOT NULL,
  "locked_at" BIGINT,
  "removed" BIGINT NOT NULL DEFAULT 0,
  "created" BIGINT NOT NULL,
  "updated" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "squad_version_costs" (
  "version_id" TEXT NOT NULL,
  "character_id" TEXT NOT NULL,
  "cost" BIGINT NOT NULL,
  "updated" BIGINT NOT NULL,
  PRIMARY KEY ("version_id")
);

CREATE TABLE "squads" (
  "id" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "members" TEXT NOT NULL,
  "strategy" TEXT NOT NULL,
  "challenge" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "tournament_votes" (
  "week" TEXT NOT NULL,
  "match" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "pick" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("week", "match", "user")
);

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "email_normalized" TEXT,
  "email_verified" BIGINT NOT NULL DEFAULT 0,
  "profile_completed" BIGINT NOT NULL DEFAULT 0,
  "created" BIGINT NOT NULL,
  "updated" BIGINT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "version_abilities" (
  "version_id" TEXT NOT NULL,
  "ability_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'available',
  "notes" TEXT NOT NULL DEFAULT '',
  PRIMARY KEY ("version_id", "ability_id")
);

CREATE TABLE "version_combat_roles" (
  "version_id" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "notes" TEXT NOT NULL DEFAULT '',
  PRIMARY KEY ("version_id", "role"),
  FOREIGN KEY ("version_id") REFERENCES "character_versions" ("id") ON DELETE CASCADE,
  CHECK (role IN ('dps','tank','support','healer','controller','strategist','assassin','speedster','summoner','reality_manipulator','defense')),
  CHECK (priority IN ('primary','secondary'))
);

CREATE TABLE "version_strategic_traits" (
  "version_id" TEXT NOT NULL,
  "trait" TEXT NOT NULL,
  PRIMARY KEY ("version_id", "trait"),
  FOREIGN KEY ("version_id") REFERENCES "character_versions" ("id") ON DELETE CASCADE,
  CHECK (trait IN ('healing','barrier','crowd_control','mobility','teleportation','information','buff','debuff','sealing','summoning','illusion','stealth','long_range','close_range','area_damage','single_target','adaptation','prediction','anti_regeneration'))
);

CREATE TABLE "votes" (
  "battle" TEXT NOT NULL,
  "user" TEXT NOT NULL,
  "side" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "evidence" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  "difficulty" TEXT,
  "argument_id" BIGINT GENERATED BY DEFAULT AS IDENTITY UNIQUE,
  PRIMARY KEY ("battle", "user")
);

CREATE TABLE "watchlist" (
  "user" TEXT NOT NULL,
  "anime" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "created" BIGINT NOT NULL,
  PRIMARY KEY ("user", "anime")
);

CREATE INDEX "idx_abilities_character" ON "abilities" ("character_id");

CREATE INDEX "idx_argument_evidence_battle_user" ON "argument_evidence" ("battle","argument_user");

CREATE INDEX "idx_argument_evidence_created" ON "argument_evidence" ("created");

CREATE INDEX "idx_argument_evidence_links_battle_user" ON "argument_evidence_links" ("battle","argument_user");

CREATE INDEX "idx_argument_evidence_links_created" ON "argument_evidence_links" ("created");

CREATE INDEX "idx_argument_evidence_links_evidence" ON "argument_evidence_links" ("evidence_id");

CREATE UNIQUE INDEX "idx_auth_identity_provider_subject" ON "auth_identities" ("provider","provider_user_id");

CREATE INDEX "idx_auth_identity_user" ON "auth_identities" ("user_id");

CREATE INDEX "idx_auth_oauth_states_expires" ON "auth_oauth_states" ("expires");

CREATE INDEX "idx_auth_rate_limits_window" ON "auth_rate_limits" ("window_start");

CREATE UNIQUE INDEX "idx_auth_sessions_token_hash" ON "auth_sessions" ("token_hash");

CREATE INDEX "idx_auth_sessions_user_expires" ON "auth_sessions" ("user_id","expires");

CREATE INDEX "idx_challenges_created" ON "squad_challenges" ("created");

CREATE INDEX "idx_character_versions_character" ON "character_versions" ("character_id");

CREATE INDEX "idx_character_versions_character_order" ON "character_versions" ("character_id","sort_order");

CREATE INDEX "idx_character_versions_parent" ON "character_versions" ("parent_version_id");

CREATE INDEX "idx_comments_argument" ON "comments" ("battle","argument_user");

CREATE INDEX "idx_daily_squad_challenge_costs_challenge" ON "daily_squad_challenge_costs" ("challenge_id");

CREATE INDEX "idx_daily_squad_challenge_costs_character" ON "daily_squad_challenge_costs" ("challenge_id","character_id");

CREATE INDEX "idx_daily_squad_challenges_status_window" ON "daily_squad_challenges" ("status","starts_at","ends_at");

CREATE INDEX "idx_daily_squad_challenges_window" ON "daily_squad_challenges" ("starts_at","ends_at");

CREATE UNIQUE INDEX "idx_email_verification_token_hash" ON "email_verification_tokens" ("token_hash");

CREATE INDEX "idx_email_verification_user" ON "email_verification_tokens" ("user_id","expires");

CREATE INDEX "idx_evidence_records_ability" ON "evidence_records" ("ability_id");

CREATE INDEX "idx_evidence_records_active_character_created" ON "evidence_records" ("character_id","deleted","created");

CREATE INDEX "idx_evidence_records_character" ON "evidence_records" ("character_id");

CREATE INDEX "idx_evidence_records_character_category" ON "evidence_records" ("character_id","category");

CREATE INDEX "idx_evidence_records_created" ON "evidence_records" ("created");

CREATE INDEX "idx_evidence_records_source_type" ON "evidence_records" ("source_type");

CREATE INDEX "idx_evidence_records_version" ON "evidence_records" ("version_id");

CREATE INDEX "idx_evidence_records_version_category" ON "evidence_records" ("version_id","category");

CREATE INDEX "idx_notifications_user_created" ON "notifications" ("user","created");

CREATE UNIQUE INDEX "idx_password_reset_token_hash" ON "password_reset_tokens" ("token_hash");

CREATE INDEX "idx_password_reset_user" ON "password_reset_tokens" ("user_id","expires");

CREATE INDEX "idx_posts_club_episode" ON "posts" ("club","episode");

CREATE UNIQUE INDEX "idx_profiles_handle" ON "profiles" ("handle");

CREATE INDEX "idx_reports_status_created" ON "reports" ("status","created");

CREATE INDEX "idx_squad_submission_members_character" ON "squad_submission_members" ("character_id");

CREATE UNIQUE INDEX "idx_squad_submission_members_character_once" ON "squad_submission_members" ("submission_id","character_id");

CREATE INDEX "idx_squad_submission_members_submission" ON "squad_submission_members" ("submission_id");

CREATE UNIQUE INDEX "idx_squad_submission_members_version" ON "squad_submission_members" ("submission_id","version_id");

CREATE INDEX "idx_squad_submission_votes_submission" ON "squad_submission_votes" ("submission_id");

CREATE INDEX "idx_squad_submission_votes_user" ON "squad_submission_votes" ("user");

CREATE INDEX "idx_squad_submissions_challenge_created" ON "squad_submissions" ("challenge_id","created");

CREATE UNIQUE INDEX "idx_squad_submissions_challenge_owner" ON "squad_submissions" ("challenge_id","owner");

CREATE INDEX "idx_squad_submissions_owner_created" ON "squad_submissions" ("owner","created");

CREATE INDEX "idx_squad_version_costs_character" ON "squad_version_costs" ("character_id");

CREATE INDEX "idx_squad_version_costs_cost" ON "squad_version_costs" ("cost");

CREATE INDEX "idx_squads_owner" ON "squads" ("owner");

CREATE UNIQUE INDEX "idx_users_email_normalized" ON "users" ("email_normalized");

CREATE INDEX "idx_version_abilities_ability" ON "version_abilities" ("ability_id");

CREATE INDEX "idx_version_abilities_version" ON "version_abilities" ("version_id");

CREATE INDEX "idx_version_combat_roles_role" ON "version_combat_roles" ("role","version_id");

CREATE INDEX "idx_version_strategic_traits_trait" ON "version_strategic_traits" ("trait","version_id");
