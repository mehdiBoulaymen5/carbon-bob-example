-- Migration: Add owners column to publications table
-- Date: 2026-04-06
-- Description: Adds owners TEXT[] column to support multiple publication owners

-- Add the owners column with default empty array
ALTER TABLE publications 
ADD COLUMN IF NOT EXISTS owners TEXT[] NOT NULL DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN publications.owners IS 'Array of publication owners/maintainers';

-- Note: No index needed initially as this field is primarily for display
-- If filtering by owners becomes a requirement, add GIN index:
-- CREATE INDEX idx_publications_owners ON publications USING GIN(owners);

-- Made with Bob
