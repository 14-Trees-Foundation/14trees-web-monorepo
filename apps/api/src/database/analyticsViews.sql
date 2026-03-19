CREATE MATERIALIZED VIEW "__SCHEMA__".mv_gift_card_request_summary AS
SELECT
    gcr.id							AS request_id,
    gcr.request_id					AS request_ref,
    COALESCE(
        CASE gcr.event_type
            WHEN '1' THEN 'Birthday'
            WHEN '2' THEN 'Memorial'
            WHEN '3' THEN 'General gift'
            WHEN '4' THEN 'Wedding'
            WHEN '5' THEN 'Anniversary'
            WHEN '6' THEN 'Festival Celebration'
            WHEN '7' THEN 'Retirement'
            ELSE 'Unassigned'
        END,
        'Unassigned'
    )								AS occasion,
    gcr.no_of_cards,
    gcr.status,
    gcr.created_at,
    DATE_TRUNC('month', gcr.created_at)	AS month_bucket,
    EXTRACT(YEAR FROM gcr.created_at)::int	AS year,
    EXTRACT(MONTH FROM gcr.created_at)::int	AS month,
    gcr.created_by					AS requester_user_id,
    u.name							AS requester_name,
    COALESCE(g.id, -1)				AS group_id,
    g.name							AS group_name,
    g.type							AS group_type,
    CASE
        WHEN g.type IN ('corporate', 'ngo', 'alumni')
        THEN 'Corporate'
        ELSE 'Personal'
    END								AS request_type,
    CASE
        WHEN gcr.tags::text ILIKE '%WebSite%'
            AND gcr.tags::text NOT ILIKE '%InternalTest%'
            AND gcr.tags::text NOT ILIKE '%TestTransaction%'
        THEN 'Website'
        WHEN gcr.tags::text ILIKE '%InternalTest%'
            OR gcr.tags::text ILIKE '%TestTransaction%'
        THEN 'Test'
        ELSE 'Manual'
    END								AS request_source,
    gcr.no_of_cards					AS total_cards_issued,
    CASE WHEN gcr.status = 'completed'
        THEN 1 ELSE 0
    END								AS fulfilled_cards,
    CASE WHEN gcr.status != 'completed'
        THEN 1 ELSE 0
    END								AS pending_cards,
    COUNT(DISTINCT gc.tree_id)		AS total_trees,
    COALESCE(gcr.amount_received, 0)	AS amount_received,
    gcr.tags
FROM "__SCHEMA__".gift_card_requests gcr
LEFT JOIN "__SCHEMA__".users u
    ON u.id = gcr.created_by
LEFT JOIN "__SCHEMA__".groups g
    ON g.id = gcr.group_id
LEFT JOIN "__SCHEMA__".gift_cards gc
    ON gc.gift_card_request_id = gcr.id
WHERE
    gcr.request_type = 'Gift Cards'
    AND (
        gcr.tags IS NULL
        OR (
            gcr.tags::text NOT ILIKE '%InternalTest%'
            AND gcr.tags::text NOT ILIKE '%TestTransaction%'
        )
    )
GROUP BY
    gcr.id, gcr.request_id, gcr.event_type,
    gcr.no_of_cards, gcr.status, gcr.created_at,
    gcr.created_by, u.name, g.id, g.name, g.type,
    gcr.tags, gcr.amount_received;

CREATE UNIQUE INDEX idx_mv_gcrs_request_id
    ON "__SCHEMA__".mv_gift_card_request_summary (request_id);

CREATE MATERIALIZED VIEW "__SCHEMA__".mv_requester_leaderboard AS
SELECT
    gcr.created_by					AS user_id,
    u.name							AS requester_name,
    COALESCE(g.id, -1)				AS group_id,
    g.name							AS group_name,
    g.type							AS group_type,
    CASE
        WHEN g.type IN ('corporate', 'ngo', 'alumni')
        THEN 'Corporate'
        ELSE 'Personal'
    END								AS request_type,
    COUNT(DISTINCT gcr.id)			AS total_requests,
    COUNT(DISTINCT gc.id)			AS total_cards,
    COUNT(DISTINCT gc.id)
        FILTER (WHERE gc.assigned_to IS NOT NULL)	AS fulfilled_cards,
    COUNT(DISTINCT gc.id)
        FILTER (WHERE gc.assigned_to IS NULL)		AS pending_cards,
    COUNT(DISTINCT gc.tree_id)		AS total_trees,
    COALESCE(SUM(gcr.amount_received), 0)	AS total_amount_received,
    MIN(gcr.created_at)				AS first_request_at,
    MAX(gcr.created_at)				AS last_request_at,
    ARRAY_AGG(DISTINCT
        CASE gcr.event_type
            WHEN '1' THEN 'Birthday'
            WHEN '2' THEN 'Memorial'
            WHEN '3' THEN 'General gift'
            WHEN '4' THEN 'Wedding'
            WHEN '5' THEN 'Anniversary'
            WHEN '6' THEN 'Festival Celebration'
            WHEN '7' THEN 'Retirement'
            ELSE NULL
        END
    ) FILTER (WHERE
        CASE gcr.event_type
            WHEN '1' THEN 'Birthday'
            WHEN '2' THEN 'Memorial'
            WHEN '3' THEN 'General gift'
            WHEN '4' THEN 'Wedding'
            WHEN '5' THEN 'Anniversary'
            WHEN '6' THEN 'Festival Celebration'
            WHEN '7' THEN 'Retirement'
            ELSE NULL
        END IS NOT NULL
    )								AS occasion_types
FROM "__SCHEMA__".gift_card_requests gcr
LEFT JOIN "__SCHEMA__".users u
    ON u.id = gcr.created_by
LEFT JOIN "__SCHEMA__".groups g
    ON g.id = gcr.group_id
LEFT JOIN "__SCHEMA__".gift_cards gc
    ON gc.gift_card_request_id = gcr.id
WHERE
    gcr.request_type = 'Gift Cards'
    AND (
        gcr.tags IS NULL
        OR (
            gcr.tags::text NOT ILIKE '%InternalTest%'
            AND gcr.tags::text NOT ILIKE '%TestTransaction%'
        )
    )
GROUP BY
    gcr.created_by, u.name,
    g.id, g.name, g.type;

CREATE UNIQUE INDEX idx_mv_requester_lb_uid
    ON "__SCHEMA__".mv_requester_leaderboard (user_id, group_id);
