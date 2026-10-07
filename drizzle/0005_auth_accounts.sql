CREATE TABLE `users` (
 `id` text PRIMARY KEY NOT NULL,
 `email` text,
 `email_normalized` text,
 `email_verified` integer DEFAULT 0 NOT NULL,
 `profile_completed` integer DEFAULT 0 NOT NULL,
 `created` integer NOT NULL,
 `updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email_normalized` ON `users` (`email_normalized`) WHERE `email_normalized` IS NOT NULL;
--> statement-breakpoint
CREATE TABLE `auth_identities` (
 `id` text PRIMARY KEY NOT NULL,
 `user_id` text NOT NULL,
 `provider` text NOT NULL,
 `provider_user_id` text NOT NULL,
 `provider_email` text,
 `credential_hash` text,
 `created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_identity_provider_subject` ON `auth_identities` (`provider`,`provider_user_id`);
--> statement-breakpoint
CREATE INDEX `idx_auth_identity_user` ON `auth_identities` (`user_id`);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
 `id` text PRIMARY KEY NOT NULL,
 `user_id` text NOT NULL,
 `token_hash` text NOT NULL,
 `created` integer NOT NULL,
 `expires` integer NOT NULL,
 `last_used` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_sessions_token_hash` ON `auth_sessions` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_user_expires` ON `auth_sessions` (`user_id`,`expires`);
--> statement-breakpoint
CREATE TABLE `email_verification_tokens` (
 `id` text PRIMARY KEY NOT NULL,
 `user_id` text NOT NULL,
 `token_hash` text NOT NULL,
 `created` integer NOT NULL,
 `expires` integer NOT NULL,
 `used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_email_verification_token_hash` ON `email_verification_tokens` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `idx_email_verification_user` ON `email_verification_tokens` (`user_id`,`expires`);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
 `id` text PRIMARY KEY NOT NULL,
 `user_id` text NOT NULL,
 `token_hash` text NOT NULL,
 `created` integer NOT NULL,
 `expires` integer NOT NULL,
 `used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_password_reset_token_hash` ON `password_reset_tokens` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `idx_password_reset_user` ON `password_reset_tokens` (`user_id`,`expires`);
--> statement-breakpoint
CREATE TABLE `auth_oauth_states` (
 `state_hash` text PRIMARY KEY NOT NULL,
 `pkce_verifier_hash` text NOT NULL,
 `return_to` text NOT NULL,
 `created` integer NOT NULL,
 `expires` integer NOT NULL,
 `used` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_oauth_states_expires` ON `auth_oauth_states` (`expires`);
--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
 `key_hash` text PRIMARY KEY NOT NULL,
 `scope` text NOT NULL,
 `window_start` integer NOT NULL,
 `count` integer NOT NULL,
 `blocked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_rate_limits_window` ON `auth_rate_limits` (`window_start`);
--> statement-breakpoint
ALTER TABLE `profiles` ADD `avatar_url` text;
--> statement-breakpoint
CREATE TABLE `_auth_legacy_user_map` (
 `legacy_user_id` text PRIMARY KEY NOT NULL,
 `user_id` text UNIQUE NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `_auth_legacy_user_map` (`legacy_user_id`,`user_id`)
SELECT legacy_user_id,'usr_' || lower(hex(randomblob(16))) FROM (
 SELECT user AS legacy_user_id FROM profiles
 UNION SELECT owner FROM battles
 UNION SELECT user FROM votes
 UNION SELECT argument_user FROM argument_evidence
 UNION SELECT contributor FROM argument_evidence
 UNION SELECT user FROM progress
 UNION SELECT user FROM posts
 UNION SELECT owner FROM squads
 UNION SELECT argument_user FROM comments
 UNION SELECT user FROM comments
 UNION SELECT user FROM reactions
 UNION SELECT challenger FROM squad_challenges
 UNION SELECT user FROM challenge_votes
 UNION SELECT user FROM notifications
 UNION SELECT reporter FROM reports
 UNION SELECT user FROM watchlist
 UNION SELECT user FROM tournament_votes
 UNION SELECT submitted_by FROM evidence_records
 UNION SELECT argument_user FROM argument_evidence_links
 UNION SELECT linked_by FROM argument_evidence_links
) WHERE legacy_user_id IS NOT NULL AND legacy_user_id <> '';
--> statement-breakpoint
INSERT INTO `users` (`id`,`email`,`email_normalized`,`email_verified`,`profile_completed`,`created`,`updated`)
SELECT m.user_id,NULL,NULL,1,CASE WHEN p.user IS NULL THEN 0 ELSE 1 END,
 COALESCE(p.created,1791378000000),COALESCE(p.updated,p.created,1791378000000)
FROM _auth_legacy_user_map m LEFT JOIN profiles p ON p.user=m.legacy_user_id;
--> statement-breakpoint
INSERT INTO `auth_identities` (`id`,`user_id`,`provider`,`provider_user_id`,`provider_email`,`credential_hash`,`created`)
SELECT lower(hex(randomblob(16))),user_id,'chatgpt',legacy_user_id,NULL,NULL,1791378000000 FROM _auth_legacy_user_map;
--> statement-breakpoint
UPDATE profiles SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=profiles.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
INSERT INTO profiles (user,handle,display_name,avatar_url,bio,favorite_anime,favorite_characters,created,updated)
SELECT u.id,'animefan_' || substr(replace(u.id,'usr_',''),1,15),'Anime Fan',NULL,'','[]','[]',u.created,u.updated
FROM users u LEFT JOIN profiles p ON p.user=u.id
WHERE p.user IS NULL;
--> statement-breakpoint
UPDATE battles SET owner=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=battles.owner) WHERE owner IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE votes SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=votes.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE argument_evidence SET argument_user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=argument_evidence.argument_user) WHERE argument_user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE argument_evidence SET contributor=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=argument_evidence.contributor) WHERE contributor IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE progress SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=progress.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE posts SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=posts.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE squads SET owner=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=squads.owner) WHERE owner IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE comments SET argument_user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=comments.argument_user) WHERE argument_user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE comments SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=comments.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE reactions SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=reactions.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE squad_challenges SET challenger=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=squad_challenges.challenger) WHERE challenger IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE challenge_votes SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=challenge_votes.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE notifications SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=notifications.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE reports SET reporter=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=reports.reporter) WHERE reporter IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE watchlist SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=watchlist.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE tournament_votes SET user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=tournament_votes.user) WHERE user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE evidence_records SET submitted_by=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=evidence_records.submitted_by) WHERE submitted_by IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE argument_evidence_links SET argument_user=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=argument_evidence_links.argument_user) WHERE argument_user IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
UPDATE argument_evidence_links SET linked_by=(SELECT user_id FROM _auth_legacy_user_map WHERE legacy_user_id=argument_evidence_links.linked_by) WHERE linked_by IN (SELECT legacy_user_id FROM _auth_legacy_user_map);
--> statement-breakpoint
DROP TABLE `_auth_legacy_user_map`;
