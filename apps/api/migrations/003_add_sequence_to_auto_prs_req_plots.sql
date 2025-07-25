-- Migration: Add sequence column to auto_prs_req_plots table
-- Date: 2024-12-19
-- Description: Adds a sequence column to enable custom ordering of plots in auto-processing configuration

-- Add sequence column to auto_prs_req_plots table
ALTER TABLE auto_prs_req_plots ADD COLUMN sequence INTEGER;

-- Add comment to explain the purpose of the sequence column
COMMENT ON COLUMN auto_prs_req_plots.sequence IS 'Custom ordering sequence for plots in auto-processing. Lower numbers appear first.';

-- Create index for better performance when ordering by sequence
CREATE INDEX idx_auto_prs_req_plots_sequence ON auto_prs_req_plots(sequence);

-- Create composite index for type and sequence ordering
CREATE INDEX idx_auto_prs_req_plots_type_sequence ON auto_prs_req_plots(type, sequence);