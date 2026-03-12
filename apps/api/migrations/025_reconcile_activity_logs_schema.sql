-- Migration: Reconcile activity_logs schema (no entity_id)
-- Date: 2026-03-12
-- Description: Forward-only, idempotent reconciliation for environments with different intermediate activity_logs states

CREATE TABLE IF NOT EXISTS activity_logs (
  id             BIGSERIAL PRIMARY KEY,
  entity_type    TEXT NOT NULL,
  action         TEXT NOT NULL,
  actor          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  plot_id        INTEGER,
  sapling_id     TEXT,
  plant_type_id  INTEGER,
  planted_by     INTEGER,
  metadata       JSONB
);

ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS actor TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS plot_id INTEGER;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS sapling_id TEXT;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS plant_type_id INTEGER;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS planted_by INTEGER;
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE activity_logs
  ALTER COLUMN entity_type SET NOT NULL,
  ALTER COLUMN action SET NOT NULL;

DROP INDEX IF EXISTS activity_logs_entity_id_idx;
DROP INDEX IF EXISTS activity_logs_entity_type_entity_id_idx;

ALTER TABLE activity_logs
DROP COLUMN IF EXISTS entity_id;

CREATE INDEX IF NOT EXISTS activity_logs_entity_type_idx ON activity_logs (entity_type);
CREATE INDEX IF NOT EXISTS activity_logs_plot_id_idx ON activity_logs (plot_id);
CREATE INDEX IF NOT EXISTS activity_logs_planted_by_idx ON activity_logs (planted_by);
CREATE INDEX IF NOT EXISTS activity_logs_created_at_idx ON activity_logs (created_at);
