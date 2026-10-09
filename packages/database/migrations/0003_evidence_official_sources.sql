-- Preserve legacy evidence IDs and links. Source metadata stays empty for historical anime/manga entries.
-- Apply through scripts/database/migrate.mjs (not the historical D1 drizzle folder).
ALTER TABLE evidence_records ADD COLUMN source_title text;
ALTER TABLE evidence_records ADD COLUMN source_location text;
ALTER TABLE evidence_records ADD COLUMN source_url text;
ALTER TABLE evidence_records ADD COLUMN source_details text NOT NULL DEFAULT '{}';
ALTER TABLE evidence_records ADD COLUMN continuity_status text NOT NULL DEFAULT 'unknown';
ALTER TABLE evidence_records ADD COLUMN source_language text;
ALTER TABLE evidence_records ADD COLUMN translation_provenance text;
ALTER TABLE evidence_records ADD CONSTRAINT evidence_continuity_status_check
 CHECK (continuity_status IN ('main','anime','alternate','spin_off','game','unknown'));
ALTER TABLE evidence_records ADD CONSTRAINT evidence_source_type_check
 CHECK (source_type IN ('anime','manga','databook','official_guidebook','creator_interview','official_website','light_novel','game'));
CREATE INDEX IF NOT EXISTS idx_evidence_source_lookup
 ON evidence_records(source_type,lower(source_title),lower(source_location))
 WHERE deleted=0 AND source_title IS NOT NULL;
