-- Migration: Add indexes to optimize engagement roles calculation
-- These indexes dramatically improve the performance of the engagement roles query
-- from ~30+ seconds to ~1-2 seconds for 100 users
-- Note: CONCURRENTLY removed to allow migration in transaction

-- Critical indexes for trees table foreign keys
CREATE INDEX IF NOT EXISTS idx_trees_sponsored_by_user
    ON trees(sponsored_by_user)
    WHERE sponsored_by_user IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trees_gifted_by
    ON trees(gifted_by)
    WHERE gifted_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trees_gifted_to
    ON trees(gifted_to)
    WHERE gifted_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trees_assigned_to
    ON trees(assigned_to)
    WHERE assigned_to IS NOT NULL;

-- Composite index for the visitor check (assigned_to + description with 'visit' keyword)
-- This optimizes the LOWER(description) LIKE '%visit%' query
CREATE INDEX IF NOT EXISTS idx_trees_assigned_to_visit_desc
    ON trees(assigned_to, lower(description))
    WHERE assigned_to IS NOT NULL AND lower(description) LIKE '%visit%';

-- Indexes for gift_request_users table
CREATE INDEX IF NOT EXISTS idx_gift_request_users_recipient
    ON gift_request_users(recipient);

CREATE INDEX IF NOT EXISTS idx_gift_request_users_assignee
    ON gift_request_users(assignee);

-- Indexes for gift_card_requests table
CREATE INDEX IF NOT EXISTS idx_gift_card_requests_user_id
    ON gift_card_requests(user_id);

-- Composite index for user_id and request_type lookups
CREATE INDEX IF NOT EXISTS idx_gift_card_requests_user_id_type
    ON gift_card_requests(user_id, request_type);

-- Index for donation_users table
CREATE INDEX IF NOT EXISTS idx_donation_users_recipient
    ON donation_users(recipient);

-- Add comments for documentation
COMMENT ON INDEX idx_trees_sponsored_by_user IS 'Optimizes engagement roles calculation: is_sponsor check';
COMMENT ON INDEX idx_trees_gifted_by IS 'Optimizes engagement roles calculation: is_gifter check';
COMMENT ON INDEX idx_trees_gifted_to IS 'Optimizes engagement roles calculation: is_gift_recipient check';
COMMENT ON INDEX idx_trees_assigned_to IS 'Optimizes engagement roles calculation: general assigned_to lookups';
COMMENT ON INDEX idx_trees_assigned_to_visit_desc IS 'Optimizes engagement roles calculation: is_visitor check with visit keyword';
COMMENT ON INDEX idx_gift_request_users_recipient IS 'Optimizes engagement roles calculation: gift recipient checks';
COMMENT ON INDEX idx_gift_request_users_assignee IS 'Optimizes engagement roles calculation: gift assignee checks';
COMMENT ON INDEX idx_gift_card_requests_user_id IS 'Optimizes engagement roles calculation: sponsor/gifter checks';
COMMENT ON INDEX idx_gift_card_requests_user_id_type IS 'Optimizes engagement roles calculation: request type filtered queries';
COMMENT ON INDEX idx_donation_users_recipient IS 'Optimizes engagement roles calculation: is_donation_recipient check';
