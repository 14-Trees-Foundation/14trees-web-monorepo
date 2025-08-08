-- Migration: Add default_tree_view_mode column to events table
-- Date: 2025-01-28
-- Description: Adds a new column to store the default tree view mode preference for each event.
--              This allows event organizers to set whether the event dashboard should show
--              tree illustrations or profile images by default.

-- Create ENUM type for tree view modes
DO $$ BEGIN
    CREATE TYPE tree_view_mode AS ENUM ('illustrations', 'profile');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add the new column to events table
ALTER TABLE events 
ADD COLUMN default_tree_view_mode tree_view_mode DEFAULT 'profile';

-- Add comment to explain the column purpose
COMMENT ON COLUMN events.default_tree_view_mode IS 'Default view mode for trees in event dashboard: illustrations or profile images';

-- NOTE: Default value is 'profile' to maintain current behavior where profile images are shown by default