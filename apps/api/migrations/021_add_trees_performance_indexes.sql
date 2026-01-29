-- Migration: Add performance indexes for trees queries
-- Date: 2026-01-29
-- Description: Add indexes to optimize getTrees query performance
-- This addresses the 39+ second query time when fetching all trees (~311K records)

-- Trees table indexes for JOIN optimization
-- Note: Some columns may already have indexes from @ForeignKey decorators
-- Using IF NOT EXISTS to safely add missing ones

CREATE INDEX IF NOT EXISTS idx_trees_plant_type_id
    ON trees(plant_type_id);

CREATE INDEX IF NOT EXISTS idx_trees_plot_id
    ON trees(plot_id);

CREATE INDEX IF NOT EXISTS idx_trees_mapped_to_user
    ON trees(mapped_to_user);

CREATE INDEX IF NOT EXISTS idx_trees_mapped_to_group
    ON trees(mapped_to_group);

CREATE INDEX IF NOT EXISTS idx_trees_sponsored_by_user
    ON trees(sponsored_by_user);

CREATE INDEX IF NOT EXISTS idx_trees_sponsored_by_group
    ON trees(sponsored_by_group);

CREATE INDEX IF NOT EXISTS idx_trees_assigned_to
    ON trees(assigned_to);

CREATE INDEX IF NOT EXISTS idx_trees_gifted_by
    ON trees(gifted_by);

CREATE INDEX IF NOT EXISTS idx_trees_gifted_to
    ON trees(gifted_to);

CREATE INDEX IF NOT EXISTS idx_trees_event_id
    ON trees(event_id);

CREATE INDEX IF NOT EXISTS idx_trees_visit_id
    ON trees(visit_id);

-- CRITICAL: donation_id is NOT a ForeignKey in the model, so it likely has no index
CREATE INDEX IF NOT EXISTS idx_trees_donation_id
    ON trees(donation_id);

-- Index for sapling_id ordering (used in default ORDER BY)
-- Already has UNIQUE constraint, but explicit index helps with sorting
CREATE INDEX IF NOT EXISTS idx_trees_sapling_id_sorted
    ON trees(sapling_id);

-- Composite index for common filter patterns
CREATE INDEX IF NOT EXISTS idx_trees_deleted_at_sapling_id
    ON trees(deleted_at, sapling_id)
    WHERE deleted_at IS NULL;

-- Index for tree_status filtering (common in queries)
CREATE INDEX IF NOT EXISTS idx_trees_status
    ON trees(tree_status);

-- Plots table: ensure site_id has index (used in JOIN to sites)
CREATE INDEX IF NOT EXISTS idx_plots_site_id
    ON plots(site_id);

-- Gift cards table: ensure tree_id has index (critical for gift_cards JOIN)
-- This was already added in migration 020, but including for completeness
CREATE INDEX IF NOT EXISTS idx_gift_cards_tree_id
    ON gift_cards(tree_id);

-- Add comments for documentation
COMMENT ON INDEX idx_trees_donation_id IS 'Critical: donation_id has no ForeignKey decorator, needs explicit index';
COMMENT ON INDEX idx_trees_deleted_at_sapling_id IS 'Optimizes queries filtering out deleted trees';
COMMENT ON INDEX idx_trees_status IS 'Optimizes tree_status/tree_health filtering';
COMMENT ON INDEX idx_plots_site_id IS 'Optimizes plots->sites JOIN in getTrees query';