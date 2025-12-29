-- Migration: Add view tracking columns to events table
-- Date: 2024-12-24
-- Description: Adds total_views and unique_views columns to track event dashboard engagement

ALTER TABLE events ADD COLUMN total_views INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN unique_views INTEGER DEFAULT 0;

COMMENT ON COLUMN events.total_views IS 'Total number of times the event dashboard has been viewed';
COMMENT ON COLUMN events.unique_views IS 'Number of unique devices that have viewed the event dashboard';
