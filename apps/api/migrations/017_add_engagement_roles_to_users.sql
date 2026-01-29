-- Migration: Add engagement_roles column to users table
-- This column stores calculated user engagement types (sponsor, gifter, recipient, visitor, etc.)

-- Add engagement_roles column as JSONB
ALTER TABLE users
ADD COLUMN IF NOT EXISTS engagement_roles JSONB DEFAULT NULL;

-- Add index for performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_engagement_roles ON users USING GIN (engagement_roles);

-- Add comment for documentation
COMMENT ON COLUMN users.engagement_roles IS 'Stores user engagement types: is_sponsor, is_gifter, is_gift_recipient, is_donation_recipient, is_visitor, etc.';
