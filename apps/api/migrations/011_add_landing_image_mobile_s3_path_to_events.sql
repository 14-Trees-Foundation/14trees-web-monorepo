
-- Migration: Add landing_image_mobile_s3_path to events
-- Date: 2025-12-18
-- Description: Add column to store S3 path of event landing image specifically for mobile

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS landing_image_mobile_s3_path TEXT;

COMMENT ON COLUMN events.landing_image_mobile_s3_path IS 'S3 URL for the event mobile landing image';