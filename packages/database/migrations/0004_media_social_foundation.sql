-- Canonical media, unified tracking, social graph, activity and progression foundation.
-- Existing watchlist rows are preserved and mapped when a known legacy anime key exists.
-- Legacy club progress is intentionally NOT converted into confirmed viewing history.

CREATE TABLE IF NOT EXISTS anime (
 id text PRIMARY KEY,
 legacy_key text UNIQUE,
 title_canonical text NOT NULL,
 title_english text,
 title_romaji text,
 title_native text,
 alternative_titles jsonb NOT NULL DEFAULT '[]'::jsonb,
 synopsis text,
 format text,
 release_status text,
 release_year integer,
 start_date text,
 end_date text,
 episode_count integer,
 duration_minutes integer,
 genres jsonb NOT NULL DEFAULT '[]'::jsonb,
 tags jsonb NOT NULL DEFAULT '[]'::jsonb,
 studios jsonb NOT NULL DEFAULT '[]'::jsonb,
 cover_image_url text,
 banner_image_url text,
 official_website text,
 data_source text NOT NULL DEFAULT 'local',
 last_synced_at bigint,
 metadata_complete bigint NOT NULL DEFAULT 0,
 metadata_locked bigint NOT NULL DEFAULT 0,
 search_text text NOT NULL DEFAULT '',
 created_at bigint NOT NULL,
 updated_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_anime_status_year ON anime(release_status,release_year);
CREATE INDEX IF NOT EXISTS idx_anime_title_lower ON anime((lower(title_canonical)));

CREATE TABLE IF NOT EXISTS anime_seasons (
 id text PRIMARY KEY,
 anime_id text NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
 season_number integer,
 season_label text,
 title text NOT NULL,
 release_year integer,
 start_date text,
 end_date text,
 episode_count integer,
 absolute_episode_start integer,
 absolute_episode_end integer,
 continuity text,
 sort_order integer NOT NULL DEFAULT 0,
 created_at bigint NOT NULL,
 updated_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_anime_seasons_anime_order ON anime_seasons(anime_id,sort_order,id);

CREATE TABLE IF NOT EXISTS anime_episodes (
 id text PRIMARY KEY,
 anime_id text NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
 season_id text REFERENCES anime_seasons(id) ON DELETE SET NULL,
 episode_number text NOT NULL,
 absolute_order integer,
 title text,
 air_date text,
 duration_minutes integer,
 synopsis text,
 episode_type text NOT NULL DEFAULT 'standard',
 canon_classification text,
 spoiler_level integer,
 data_source text NOT NULL DEFAULT 'local',
 last_synced_at bigint,
 created_at bigint NOT NULL,
 updated_at bigint NOT NULL,
 UNIQUE(anime_id,episode_number)
);
CREATE INDEX IF NOT EXISTS idx_anime_episodes_anime_order ON anime_episodes(anime_id,absolute_order,id);
CREATE INDEX IF NOT EXISTS idx_anime_episodes_season_order ON anime_episodes(season_id,absolute_order,id);

CREATE TABLE IF NOT EXISTS manga (
 id text PRIMARY KEY,
 legacy_key text UNIQUE,
 title_canonical text NOT NULL,
 title_english text,
 title_romaji text,
 title_native text,
 alternative_titles jsonb NOT NULL DEFAULT '[]'::jsonb,
 author text,
 illustrator text,
 publisher text,
 serialization_magazine text,
 publication_status text,
 start_date text,
 end_date text,
 total_chapters integer,
 total_volumes integer,
 genres jsonb NOT NULL DEFAULT '[]'::jsonb,
 synopsis text,
 cover_image_url text,
 continuity text,
 data_source text NOT NULL DEFAULT 'local',
 last_synced_at bigint,
 metadata_complete bigint NOT NULL DEFAULT 0,
 metadata_locked bigint NOT NULL DEFAULT 0,
 search_text text NOT NULL DEFAULT '',
 created_at bigint NOT NULL,
 updated_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_manga_status ON manga(publication_status);
CREATE INDEX IF NOT EXISTS idx_manga_title_lower ON manga((lower(title_canonical)));

CREATE TABLE IF NOT EXISTS manga_chapters (
 id text PRIMARY KEY,
 manga_id text NOT NULL REFERENCES manga(id) ON DELETE CASCADE,
 chapter_number text NOT NULL,
 volume_number text,
 title text,
 publication_date text,
 chapter_order integer,
 continuity text,
 spoiler_level integer,
 data_source text NOT NULL DEFAULT 'local',
 created_at bigint NOT NULL,
 updated_at bigint NOT NULL,
 UNIQUE(manga_id,chapter_number)
);
CREATE INDEX IF NOT EXISTS idx_manga_chapters_order ON manga_chapters(manga_id,chapter_order,id);

CREATE TABLE IF NOT EXISTS media_external_ids (
 media_type text NOT NULL CHECK(media_type IN ('anime','manga')),
 media_id text NOT NULL,
 provider text NOT NULL,
 external_id text NOT NULL,
 canonical_url text,
 verified_at bigint,
 created_at bigint NOT NULL,
 updated_at bigint NOT NULL,
 PRIMARY KEY(media_type,media_id,provider),
 UNIQUE(provider,media_type,external_id)
);
CREATE INDEX IF NOT EXISTS idx_media_external_lookup ON media_external_ids(provider,media_type,external_id);

CREATE TABLE IF NOT EXISTS media_relationships (
 id text PRIMARY KEY,
 from_media_type text NOT NULL CHECK(from_media_type IN ('anime','manga')),
 from_media_id text NOT NULL,
 to_media_type text NOT NULL CHECK(to_media_type IN ('anime','manga')),
 to_media_id text NOT NULL,
 relation_type text NOT NULL,
 source text NOT NULL DEFAULT 'local',
 created_at bigint NOT NULL,
 UNIQUE(from_media_type,from_media_id,to_media_type,to_media_id,relation_type)
);
CREATE INDEX IF NOT EXISTS idx_media_relationships_from ON media_relationships(from_media_type,from_media_id);

CREATE TABLE IF NOT EXISTS media_sync_runs (
 id text PRIMARY KEY,
 provider text NOT NULL,
 mode text NOT NULL,
 status text NOT NULL,
 requested_by text,
 query text,
 started_at bigint NOT NULL,
 finished_at bigint,
 imported_count integer NOT NULL DEFAULT 0,
 updated_count integer NOT NULL DEFAULT 0,
 skipped_count integer NOT NULL DEFAULT 0,
 error_count integer NOT NULL DEFAULT 0,
 cursor text,
 detail jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_media_sync_runs_provider_started ON media_sync_runs(provider,started_at DESC);

CREATE TABLE IF NOT EXISTS media_sync_errors (
 id text PRIMARY KEY,
 run_id text NOT NULL REFERENCES media_sync_runs(id) ON DELETE CASCADE,
 provider text NOT NULL,
 external_id text,
 code text,
 message text NOT NULL,
 retryable bigint NOT NULL DEFAULT 0,
 payload jsonb,
 created_at bigint NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_sync_errors_run ON media_sync_errors(run_id,created_at);

CREATE TABLE IF NOT EXISTS club_media_links (
 club_id text PRIMARY KEY,
 anime_id text NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
 created_at bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS user_media_tracking (
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 media_type text NOT NULL CHECK(media_type IN ('anime','manga')),
 media_id text NOT NULL,
 status text NOT NULL CHECK(status IN ('planned','watching','completed','paused','dropped','rewatching','reading','rereading')),
 current_item_id text,
 current_position text,
 completed_count integer NOT NULL DEFAULT 0,
 started_at bigint,
 completed_at bigint,
 updated_at bigint NOT NULL,
 cycle integer NOT NULL DEFAULT 1,
 spoiler_mode text NOT NULL DEFAULT 'progress',
 activity_visibility text NOT NULL DEFAULT 'private' CHECK(activity_visibility IN ('private','followers','public')),
 PRIMARY KEY(user_id,media_type,media_id)
);
CREATE INDEX IF NOT EXISTS idx_user_media_tracking_user_status ON user_media_tracking(user_id,status,updated_at DESC);

CREATE TABLE IF NOT EXISTS user_episode_completions (
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 episode_id text NOT NULL REFERENCES anime_episodes(id) ON DELETE CASCADE,
 viewing_cycle integer NOT NULL DEFAULT 1,
 completed_at bigint NOT NULL,
 completion_source text NOT NULL DEFAULT 'manual',
 correction_note text,
 PRIMARY KEY(user_id,episode_id,viewing_cycle)
);
CREATE INDEX IF NOT EXISTS idx_episode_completions_user_time ON user_episode_completions(user_id,completed_at DESC);

CREATE TABLE IF NOT EXISTS user_chapter_completions (
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 chapter_id text NOT NULL REFERENCES manga_chapters(id) ON DELETE CASCADE,
 reading_cycle integer NOT NULL DEFAULT 1,
 completed_at bigint NOT NULL,
 completion_source text NOT NULL DEFAULT 'manual',
 correction_note text,
 PRIMARY KEY(user_id,chapter_id,reading_cycle)
);
CREATE INDEX IF NOT EXISTS idx_chapter_completions_user_time ON user_chapter_completions(user_id,completed_at DESC);

CREATE TABLE IF NOT EXISTS user_media_history (
 id text PRIMARY KEY,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 media_type text NOT NULL CHECK(media_type IN ('anime','manga')),
 media_id text NOT NULL,
 event_type text NOT NULL,
 previous_value jsonb,
 new_value jsonb,
 source text NOT NULL DEFAULT 'manual',
 visibility text NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','followers','public')),
 created_at bigint NOT NULL,
 dedupe_key text,
 UNIQUE(user_id,dedupe_key)
);
CREATE INDEX IF NOT EXISTS idx_user_media_history_user_time ON user_media_history(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS user_follows (
 follower_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 followed_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at bigint NOT NULL,
 PRIMARY KEY(follower_user_id,followed_user_id),
 CHECK(follower_user_id<>followed_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed ON user_follows(followed_user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS user_blocks (
 blocker_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 blocked_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at bigint NOT NULL,
 PRIMARY KEY(blocker_user_id,blocked_user_id),
 CHECK(blocker_user_id<>blocked_user_id)
);

CREATE TABLE IF NOT EXISTS user_activity_preferences (
 user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 profile_visibility text NOT NULL DEFAULT 'public' CHECK(profile_visibility IN ('public','private')),
 publish_battles bigint NOT NULL DEFAULT 1,
 publish_squads bigint NOT NULL DEFAULT 1,
 publish_evidence bigint NOT NULL DEFAULT 1,
 publish_discussions bigint NOT NULL DEFAULT 1,
 publish_tracking bigint NOT NULL DEFAULT 0,
 updated_at bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS user_activity_events (
 id text PRIMARY KEY,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 event_type text NOT NULL,
 subject_type text NOT NULL,
 subject_id text NOT NULL,
 media_type text,
 media_id text,
 spoiler_position text,
 visibility text NOT NULL DEFAULT 'public' CHECK(visibility IN ('private','followers','public')),
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at bigint NOT NULL,
 dedupe_key text NOT NULL,
 UNIQUE(user_id,dedupe_key)
);
CREATE INDEX IF NOT EXISTS idx_user_activity_events_user_time ON user_activity_events(user_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_events_feed ON user_activity_events(visibility,created_at DESC);

CREATE TABLE IF NOT EXISTS profile_badges (
 id text PRIMARY KEY,
 name text NOT NULL,
 description text NOT NULL,
 category text NOT NULL,
 icon text NOT NULL,
 criteria_version integer NOT NULL DEFAULT 1,
 active bigint NOT NULL DEFAULT 1,
 created_at bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS user_badges (
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 badge_id text NOT NULL REFERENCES profile_badges(id) ON DELETE CASCADE,
 earned_at bigint NOT NULL,
 source_type text NOT NULL,
 source_id text NOT NULL,
 revoked_at bigint,
 revoke_reason text,
 PRIMARY KEY(user_id,badge_id)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_time ON user_badges(user_id,earned_at DESC);

CREATE TABLE IF NOT EXISTS reputation_events (
 id text PRIMARY KEY,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 event_type text NOT NULL,
 points integer NOT NULL,
 source_type text NOT NULL,
 source_id text NOT NULL,
 weight_version integer NOT NULL DEFAULT 1,
 created_at bigint NOT NULL,
 UNIQUE(user_id,event_type,source_type,source_id)
);
CREATE INDEX IF NOT EXISTS idx_reputation_events_user_time ON reputation_events(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS user_rank_history (
 id text PRIMARY KEY,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 rank_id text NOT NULL,
 points integer NOT NULL,
 rank_version integer NOT NULL DEFAULT 1,
 achieved_at bigint NOT NULL,
 UNIQUE(user_id,rank_id,rank_version)
);
CREATE INDEX IF NOT EXISTS idx_user_rank_history_user_time ON user_rank_history(user_id,achieved_at DESC);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS activity_public bigint NOT NULL DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS watch_activity_public bigint NOT NULL DEFAULT 0;

INSERT INTO profile_badges(id,name,description,category,icon,criteria_version,active,created_at) VALUES
 ('first-battle','First Battle Created','Created a first public Battle Arena matchup.','community','swords',1,1,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('first-squad','First Squad Published','Published a first saved or challenge squad.','community','users',1,1,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('first-evidence','First Evidence Contribution','Added a first active evidence record.','evidence','book-open',1,1,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('daily-challenger','Daily Challenge Participant','Submitted a squad to a Daily Challenge.','competitive','trophy',1,1,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('first-anime-complete','First Anime Completed','Marked a first anime as completed.','tracking','check-circle',1,1,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('ten-anime-complete','Ten Anime Completed','Completed ten anime entries.','tracking','library',1,1,EXTRACT(EPOCH FROM NOW())::bigint*1000)
ON CONFLICT(id) DO NOTHING;

INSERT INTO anime(id,legacy_key,title_canonical,title_english,genres,data_source,metadata_complete,search_text,created_at,updated_at) VALUES
 ('anime-jjk','jjk','Jujutsu Kaisen','Jujutsu Kaisen','["action","supernatural"]'::jsonb,'local',0,'jujutsu kaisen jjk',EXTRACT(EPOCH FROM NOW())::bigint*1000,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('anime-demon-slayer','demon','Demon Slayer: Kimetsu no Yaiba','Demon Slayer: Kimetsu no Yaiba','["action","supernatural"]'::jsonb,'local',0,'demon slayer kimetsu no yaiba',EXTRACT(EPOCH FROM NOW())::bigint*1000,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('anime-aot','aot','Attack on Titan','Attack on Titan','["action","drama"]'::jsonb,'local',0,'attack on titan shingeki no kyojin',EXTRACT(EPOCH FROM NOW())::bigint*1000,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('anime-dandadan','dandadan','Dandadan','Dandadan','["supernatural","comedy"]'::jsonb,'local',0,'dandadan',EXTRACT(EPOCH FROM NOW())::bigint*1000,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('anime-kaiju8','kaiju8','Kaiju No. 8','Kaiju No. 8','["action","science fiction"]'::jsonb,'local',0,'kaiju no 8',EXTRACT(EPOCH FROM NOW())::bigint*1000,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('anime-frieren','frieren','Frieren: Beyond Journey''s End','Frieren: Beyond Journey''s End','["fantasy","adventure"]'::jsonb,'local',0,'frieren beyond journeys end',EXTRACT(EPOCH FROM NOW())::bigint*1000,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('anime-wind-breaker','windbreaker','Wind Breaker','Wind Breaker','["action","school"]'::jsonb,'local',0,'wind breaker',EXTRACT(EPOCH FROM NOW())::bigint*1000,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('anime-solo-leveling','sololeveling','Solo Leveling','Solo Leveling','["action","fantasy"]'::jsonb,'local',0,'solo leveling',EXTRACT(EPOCH FROM NOW())::bigint*1000,EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('anime-apothecary','apothecary','The Apothecary Diaries','The Apothecary Diaries','["mystery","drama"]'::jsonb,'local',0,'the apothecary diaries',EXTRACT(EPOCH FROM NOW())::bigint*1000,EXTRACT(EPOCH FROM NOW())::bigint*1000)
ON CONFLICT(id) DO NOTHING;

INSERT INTO club_media_links(club_id,anime_id,created_at) VALUES
 ('jjk','anime-jjk',EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('demon','anime-demon-slayer',EXTRACT(EPOCH FROM NOW())::bigint*1000),
 ('aot','anime-aot',EXTRACT(EPOCH FROM NOW())::bigint*1000)
ON CONFLICT(club_id) DO NOTHING;

INSERT INTO user_media_tracking(user_id,media_type,media_id,status,updated_at,activity_visibility)
SELECT w."user",'anime',a.id,
 CASE w.status WHEN 'planned' THEN 'planned' WHEN 'watching' THEN 'watching' WHEN 'completed' THEN 'completed' ELSE 'planned' END,
 w.created,'private'
FROM watchlist w JOIN anime a ON a.legacy_key=w.anime
ON CONFLICT(user_id,media_type,media_id) DO NOTHING;
