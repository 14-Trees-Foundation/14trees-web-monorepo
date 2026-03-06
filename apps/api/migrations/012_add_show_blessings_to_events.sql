-- Migration: Add show_blessings column to events table
-- Date: 2024-12-24
-- Description: Adds a boolean column to control whether the blessings section is shown on the event dashboard

-- Add show_blessings column to events table
ALTER TABLE events ADD COLUMN show_blessings BOOLEAN DEFAULT TRUE;

-- Add comment to explain the column
COMMENT ON COLUMN events.show_blessings IS 'Controls whether the blessings (add blessings) section is displayed on the event dashboard';
