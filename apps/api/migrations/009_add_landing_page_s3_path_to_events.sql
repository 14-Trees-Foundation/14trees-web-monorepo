-- Migration: Add info_card_s3_path to plant_types
-- Date: 2025-12-14
-- Description: Add column to store S3 path of event landing image

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS landing_image_s3_path TEXT;

COMMENT ON COLUMN events.landing_image_s3_path IS 'S3 URL for the event landing image';
