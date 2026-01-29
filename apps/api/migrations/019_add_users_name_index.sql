-- Migration: Add index on users.name for search optimization
-- This index dramatically improves the performance of the search API
-- which uses ILIKE queries on the name field

-- Create index on lowercase name for case-insensitive search
CREATE INDEX IF NOT EXISTS idx_users_name_lower
    ON users(LOWER(name));

-- Add comment for documentation
COMMENT ON INDEX idx_users_name_lower IS 'Optimizes search API: case-insensitive ILIKE queries on users.name';
