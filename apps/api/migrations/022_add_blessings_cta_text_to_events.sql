-- Migration: Add blessings_cta_text column to events table
-- Date: 2026-02-25
-- Description: Adds a configurable text field for the "Add Blessings" CTA button on the event dashboard.
--              When null, the dashboard uses the default text ("Bless the bride and groom!").

ALTER TABLE events ADD COLUMN blessings_cta_text TEXT DEFAULT NULL;
COMMENT ON COLUMN events.blessings_cta_text IS 'Custom label for the blessings CTA button. Null = use default text.';
