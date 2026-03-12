-- Migration: Create unified activity_logs table
-- Date: 2026-03-12
-- Description: Adds unified activity logs for tree/plant_type/pond/pit entities

CREATE TABLE activity_logs (
  id             BIGSERIAL PRIMARY KEY,
  entity_type    TEXT NOT NULL,
  entity_id      INTEGER NOT NULL,
  action         TEXT NOT NULL,

  sapling_id     TEXT,
  plot_id        INTEGER,
  plant_type_id  INTEGER,
  planted_by     INTEGER,

  metadata       JSONB,
  actor          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON activity_logs (entity_type);
CREATE INDEX ON activity_logs (entity_id);
CREATE INDEX ON activity_logs (entity_type, entity_id);
CREATE INDEX ON activity_logs (plot_id);
CREATE INDEX ON activity_logs (planted_by);
CREATE INDEX ON activity_logs (created_at);
