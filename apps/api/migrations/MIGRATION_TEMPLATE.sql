-- Migration: [Brief description of what this migration does]
-- Date: [YYYY-MM-DD]
-- Description: [Detailed description of the changes and why they're needed]

-- Example: Add new column to users table
-- ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Example: Create new table
-- CREATE TABLE user_preferences (
--     id SERIAL PRIMARY KEY,
--     user_id INTEGER NOT NULL REFERENCES users(id),
--     preference_key VARCHAR(100) NOT NULL,
--     preference_value TEXT,
--     created_at TIMESTAMP DEFAULT NOW(),
--     updated_at TIMESTAMP DEFAULT NOW()
-- );

-- Example: Add index
-- CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Example: Add comments
-- COMMENT ON TABLE user_preferences IS 'Stores user-specific preference settings';
-- COMMENT ON COLUMN user_preferences.preference_key IS 'The setting key (e.g., theme, language)';

-- NOTE: Keep migrations atomic and focused on one logical change
-- NOTE: Always consider rollback scenarios when writing migrations
-- NOTE: Test migrations on a copy of production data before applying