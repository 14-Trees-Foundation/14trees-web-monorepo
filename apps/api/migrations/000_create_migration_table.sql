-- Migration: Create migration tracking table
-- Date: 2024-12-19
-- Description: Set up migration tracking system for database schema changes

-- Create migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT NOW(),
    checksum VARCHAR(64),
    execution_time_ms INTEGER,
    rollback_sql TEXT
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_migration_name ON migrations(migration_name);
CREATE INDEX IF NOT EXISTS idx_applied_at ON migrations(applied_at);

-- Add comments for documentation
COMMENT ON TABLE migrations IS 'Tracks database migrations that have been applied';
COMMENT ON COLUMN migrations.migration_name IS 'Name of the migration file without extension';
COMMENT ON COLUMN migrations.applied_at IS 'When the migration was applied';
COMMENT ON COLUMN migrations.checksum IS 'MD5 checksum of migration file to detect changes';
COMMENT ON COLUMN migrations.execution_time_ms IS 'How long the migration took to run in milliseconds';
COMMENT ON COLUMN migrations.rollback_sql IS 'SQL commands to rollback this migration';