-- Migration: Create donation analytics materialized views
-- Date: 2026-03-26
-- Description: Creates materialized views for donation analytics and donor leaderboard.

-- View 1: Unified donation summary (donations + gift_card_requests)
CREATE MATERIALIZED VIEW "14trees".mv_donation_summary AS

-- Donations
SELECT
    'donation'::text                                    AS source_type,
    d.id                                                AS source_id,
    d.user_id,
    d.group_id,
    d.user_id                                           AS donor_id,
    COALESCE(d.amount_donated, 0)                       AS amount,
    COALESCE(d.amount_received, 0)                      AS amount_received,
    d.trees_count,
    COALESCE(d.donation_date, d.created_at)             AS donation_date,
    d.donation_method,
    d.status,
    u.name                                              AS donor_name,
    g.name                                              AS group_name,
    g.type                                              AS group_type,
    EXTRACT(YEAR FROM COALESCE(d.donation_date, d.created_at))::int  AS year,
    EXTRACT(MONTH FROM COALESCE(d.donation_date, d.created_at))::int AS month
FROM "14trees".donations d
LEFT JOIN "14trees".users u ON u.id = d.user_id
LEFT JOIN "14trees".groups g ON g.id = d.group_id
WHERE d.status != 'PendingPayment'
  AND d.sponsorship_type != 'Unverified'
  AND (d.tags IS NULL OR NOT (d.tags::text ILIKE '%InternalTest%' OR d.tags::text ILIKE '%TestTransaction%'))

UNION ALL

-- Gift card requests (monetary donations only, not card gifting)
SELECT
    'gift_card'::text                                   AS source_type,
    gcr.id                                              AS source_id,
    gcr.user_id                                      AS user_id,
    gcr.group_id,
    gcr.user_id                                      AS donor_id,
    COALESCE(gcr.amount_received, 0)                    AS amount,
    COALESCE(gcr.amount_received, 0)                    AS amount_received,
    COUNT(DISTINCT gc.tree_id)::int                     AS trees_count,
    gcr.created_at                                      AS donation_date,
    NULL::text                                          AS donation_method,
    gcr.status,
    u.name                                              AS donor_name,
    g.name                                              AS group_name,
    g.type                                              AS group_type,
    EXTRACT(YEAR FROM gcr.created_at)::int              AS year,
    EXTRACT(MONTH FROM gcr.created_at)::int             AS month
FROM "14trees".gift_card_requests gcr
LEFT JOIN "14trees".users u ON u.id = gcr.user_id
LEFT JOIN "14trees".groups g ON g.id = gcr.group_id
LEFT JOIN "14trees".gift_cards gc ON gc.gift_card_request_id = gcr.id
WHERE gcr.amount_received > 0
  AND (gcr.tags IS NULL OR NOT (gcr.tags::text ILIKE '%InternalTest%' OR gcr.tags::text ILIKE '%TestTransaction%'))
GROUP BY gcr.id, gcr.user_id, gcr.group_id, gcr.amount_received, gcr.created_at, gcr.status, u.name, g.name, g.type;

CREATE UNIQUE INDEX uix_mv_donation_summary_type_id
    ON "14trees".mv_donation_summary (source_type, source_id);

CREATE INDEX ix_mv_donation_summary_year
    ON "14trees".mv_donation_summary (year);

CREATE INDEX ix_mv_donation_summary_user
    ON "14trees".mv_donation_summary (user_id);


-- View 2: Donor leaderboard (personal + corporate aggregations)
CREATE MATERIALIZED VIEW "14trees".mv_donor_leaderboard AS

-- Personal donors (grouped by user_id)
SELECT
    ds.user_id,
    MAX(ds.donor_name)                                  AS donor_name,
    NULL::int                                           AS group_id,
    NULL::text                                          AS group_name,
    NULL::text                                          AS group_type,
    'personal'::text                                    AS donor_type,
    COUNT(*)::int                                       AS total_donations,
    SUM(ds.amount_received)::numeric                    AS total_amount,
    COALESCE(SUM(ds.trees_count), 0)::int               AS total_trees,
    AVG(ds.amount_received)::numeric                    AS avg_donation,
    MIN(ds.donation_date)                               AS first_donation_at,
    MAX(ds.donation_date)                               AS last_donation_at,
    ARRAY(SELECT DISTINCT EXTRACT(YEAR FROM d2.donation_date)::int
          FROM "14trees".mv_donation_summary d2
          WHERE d2.user_id = ds.user_id
          ORDER BY 1)                                   AS years_active,
    ARRAY_AGG(DISTINCT ds.donation_method) FILTER (WHERE ds.donation_method IS NOT NULL) AS payment_methods
FROM "14trees".mv_donation_summary ds
WHERE ds.group_id IS NULL
GROUP BY ds.user_id

UNION ALL

-- Corporate donors (grouped by group_id)
SELECT
    NULL::int                                           AS user_id,
    NULL::text                                          AS donor_name,
    ds.group_id,
    MAX(ds.group_name)                                  AS group_name,
    MAX(ds.group_type)                                  AS group_type,
    'corporate'::text                                   AS donor_type,
    COUNT(*)::int                                       AS total_donations,
    SUM(ds.amount_received)::numeric                    AS total_amount,
    COALESCE(SUM(ds.trees_count), 0)::int               AS total_trees,
    AVG(ds.amount_received)::numeric                    AS avg_donation,
    MIN(ds.donation_date)                               AS first_donation_at,
    MAX(ds.donation_date)                               AS last_donation_at,
    ARRAY(SELECT DISTINCT EXTRACT(YEAR FROM d2.donation_date)::int
          FROM "14trees".mv_donation_summary d2
          WHERE d2.group_id = ds.group_id
          ORDER BY 1)                                   AS years_active,
    ARRAY_AGG(DISTINCT ds.donation_method) FILTER (WHERE ds.donation_method IS NOT NULL) AS payment_methods
FROM "14trees".mv_donation_summary ds
WHERE ds.group_id IS NOT NULL
GROUP BY ds.group_id;

CREATE UNIQUE INDEX uix_mv_donor_leaderboard_personal
    ON "14trees".mv_donor_leaderboard (user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX uix_mv_donor_leaderboard_corporate
    ON "14trees".mv_donor_leaderboard (group_id)
    WHERE group_id IS NOT NULL;
