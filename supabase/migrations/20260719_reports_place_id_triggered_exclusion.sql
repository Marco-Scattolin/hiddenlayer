-- Add place_id to reports (one report per business, identified by Google Place ID)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS place_id text;

-- Unique constraint: one report per place_id (NULLs are excluded from uniqueness in Postgres)
ALTER TABLE reports ADD CONSTRAINT reports_place_id_unique UNIQUE (place_id);

-- Add triggered_exclusion flag
ALTER TABLE reports ADD COLUMN IF NOT EXISTS triggered_exclusion boolean;
