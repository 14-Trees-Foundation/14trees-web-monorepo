-- Migration: Add performance indexes for gift card queries
-- Date: 2026-01-29
-- Description: Add indexes to optimize getGiftCardRequests query performance
-- This addresses the ~2 minute query time when fetching all gift card requests

-- Gift Card Requests table indexes
CREATE INDEX IF NOT EXISTS idx_gift_card_requests_user_id
    ON gift_card_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_gift_card_requests_group_id
    ON gift_card_requests(group_id);

CREATE INDEX IF NOT EXISTS idx_gift_card_requests_created_by
    ON gift_card_requests(created_by);

CREATE INDEX IF NOT EXISTS idx_gift_card_requests_processed_by
    ON gift_card_requests(processed_by);

CREATE INDEX IF NOT EXISTS idx_gift_card_requests_payment_id
    ON gift_card_requests(payment_id);

-- Composite index for common filter patterns (created_at DESC is common for ordering)
CREATE INDEX IF NOT EXISTS idx_gift_card_requests_created_at_id
    ON gift_card_requests(created_at DESC, id DESC);

-- Gift Cards table indexes (critical for LEFT JOIN performance)
CREATE INDEX IF NOT EXISTS idx_gift_cards_request_id
    ON gift_cards(gift_card_request_id);

CREATE INDEX IF NOT EXISTS idx_gift_cards_tree_id
    ON gift_cards(tree_id);

CREATE INDEX IF NOT EXISTS idx_gift_cards_gift_request_user_id
    ON gift_cards(gift_request_user_id);

-- Composite index for common aggregate queries (checking if tree_id is not null)
CREATE INDEX IF NOT EXISTS idx_gift_cards_request_tree
    ON gift_cards(gift_card_request_id, tree_id);

-- Gift Request Users table indexes
CREATE INDEX IF NOT EXISTS idx_gift_request_users_gift_request_id
    ON gift_request_users(gift_request_id);

CREATE INDEX IF NOT EXISTS idx_gift_request_users_recipient
    ON gift_request_users(recipient);

CREATE INDEX IF NOT EXISTS idx_gift_request_users_assignee
    ON gift_request_users(assignee);

-- Composite index for mail_sent flags used in aggregates
CREATE INDEX IF NOT EXISTS idx_gift_request_users_mail_status
    ON gift_request_users(gift_request_id, mail_sent, mail_sent_assignee);

-- Trees table index for assigned_to (used in aggregate)
CREATE INDEX IF NOT EXISTS idx_trees_assigned_to
    ON trees(assigned_to);

-- Add comments for documentation
COMMENT ON INDEX idx_gift_card_requests_user_id IS 'Optimizes JOIN with users table';
COMMENT ON INDEX idx_gift_card_requests_group_id IS 'Optimizes JOIN with groups table';
COMMENT ON INDEX idx_gift_card_requests_payment_id IS 'Optimizes payment lookups and N+1 query prevention';
COMMENT ON INDEX idx_gift_cards_request_id IS 'Critical for gift_cards LEFT JOIN performance';
COMMENT ON INDEX idx_gift_cards_request_tree IS 'Optimizes aggregate query for booked count';
COMMENT ON INDEX idx_gift_request_users_mail_status IS 'Optimizes mail count aggregates';
