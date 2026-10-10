-- Additive extension of existing challenge-submission community voting.
-- Difficulty always applies to the predicted winner: YES = squad, NO = boss.
ALTER TABLE squad_submission_votes ADD COLUMN explanation text NOT NULL DEFAULT '';
ALTER TABLE squad_submission_votes ADD COLUMN difficulty text;
ALTER TABLE squad_submission_votes ADD CONSTRAINT squad_submission_vote_explanation_length CHECK (char_length(explanation) <= 1500);
ALTER TABLE squad_submission_votes ADD CONSTRAINT squad_submission_vote_difficulty_valid CHECK (difficulty IS NULL OR difficulty IN ('NO_DIFF','LOW_DIFF','MID_DIFF','HIGH_DIFF','EXTREME_DIFF'));
CREATE INDEX idx_squad_submission_votes_verdict_difficulty ON squad_submission_votes(submission_id,verdict,difficulty);
