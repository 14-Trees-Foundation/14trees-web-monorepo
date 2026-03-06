-- Migration: Add name_key to groups
-- Date: 2025-12-17
-- Description: Add a "name_key" column to the groups table, backfill values from `name`, and add a unique index.

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS name_key VARCHAR(128);

COMMENT ON COLUMN groups.name_key IS 'URL-safe unique key for group dashboard (lowercase, letters/numbers/hyphen)';

-- Helper slugify function (conservative transliteration)
CREATE OR REPLACE FUNCTION public.slugify(input text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  s text := lower(coalesce(input, ''));
BEGIN
  -- basic transliteration for common accented chars
  s := translate(s, 'ÁÀÂÄÃÅáàâäãåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖÕóòôöõÚÙÛÜúùûüÑñÇç', 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCc');
  -- replace non-alphanumeric characters with hyphen
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  -- collapse multiple hyphens
  s := regexp_replace(s, '-+', '-', 'g');
  -- trim leading/trailing hyphens
  s := regexp_replace(s, '(^-|-$)', '', 'g');
  -- fallback
  IF s = '' THEN
    s := 'group';
  END IF;
  -- limit length to 64 for safety
  IF length(s) > 64 THEN
    s := left(s, 64);
    s := regexp_replace(s, '(^-|-$)', '', 'g');
  END IF;
  RETURN s;
END;
$$;

-- Backfill name_key for existing rows, ensuring uniqueness by appending suffixes when necessary
DO $$
DECLARE
  r RECORD;
  base text;
  candidate text;
  suffix int;
BEGIN
  FOR r IN SELECT id, name FROM groups WHERE name_key IS NULL LOOP
    base := slugify(coalesce(r.name, 'group-' || r.id::text));
    candidate := base;
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM groups WHERE name_key = candidate) LOOP
      candidate := left(base || '-' || suffix::text, 128);
      suffix := suffix + 1;
    END LOOP;
    UPDATE groups SET name_key = candidate WHERE id = r.id;
  END LOOP;
END;
$$;

-- Add a unique index on name_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_name_key_unique ON groups (name_key);
