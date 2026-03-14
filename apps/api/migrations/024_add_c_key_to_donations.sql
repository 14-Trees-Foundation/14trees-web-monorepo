-- Migration: Add c_key to donations
-- Date: 2026-03-09
-- Description: Add campaign key (c_key) column to donations table to persist referral/campaign identifier

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS c_key TEXT;

COMMENT ON COLUMN donations.c_key IS 'Campaign key / referral campaign identifier (optional)';

-- Rollback (if needed):
-- ALTER TABLE donations DROP COLUMN IF EXISTS c_key;
