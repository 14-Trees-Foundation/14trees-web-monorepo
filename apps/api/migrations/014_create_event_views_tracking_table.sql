-- Migration: Create event_views table for tracking unique visitors
-- Date: 2024-12-24
-- Description: Creates a table to track individual event views and identify unique devices

CREATE TABLE IF NOT EXISTS event_views (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_views_event_id ON event_views(event_id);
CREATE INDEX idx_event_views_device_fingerprint ON event_views(device_fingerprint);
CREATE UNIQUE INDEX idx_event_views_event_device ON event_views(event_id, device_fingerprint);

COMMENT ON TABLE event_views IS 'Tracks individual views of event dashboards for analytics';
COMMENT ON COLUMN event_views.device_fingerprint IS 'Hash of IP + User-Agent to identify unique devices';
COMMENT ON COLUMN event_views.viewed_at IS 'Timestamp of when the event was first viewed by this device';
