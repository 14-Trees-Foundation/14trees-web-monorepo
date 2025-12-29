-- Migration: Add info_card_s3_path to plant_types
-- Date: 2025-12-03
-- Description: Add column to store S3 path for plant type info card images

ALTER TABLE plant_types
  ADD COLUMN IF NOT EXISTS info_card_s3_path TEXT;

COMMENT ON COLUMN plant_types.info_card_s3_path IS 'S3 URL for the plant type info card image';

-- Rollback (if needed):
-- ALTER TABLE plant_types DROP COLUMN IF EXISTS info_card_s3_path;