-- Migration: Update event_views table to use visitor_id instead of device_fingerprint
-- Date: 2024-12-26
-- Description: Rename device_fingerprint column to visitor_id to support UUID-based visitor tracking

-- Rename the column from device_fingerprint to visitor_id
ALTER TABLE event_views RENAME COLUMN device_fingerprint TO visitor_id;

-- Update unique constraint to use new column name
DROP INDEX IF EXISTS idx_event_views_event_device;
CREATE UNIQUE INDEX idx_event_views_event_visitor ON event_views(event_id, visitor_id);

-- Update regular index to use new column name
DROP INDEX IF EXISTS idx_event_views_device_fingerprint;
CREATE INDEX idx_event_views_visitor_id ON event_views(visitor_id);

-- Update column comment
COMMENT ON COLUMN event_views.visitor_id IS 'UUID v4 visitor identifier stored in browser localStorage';
