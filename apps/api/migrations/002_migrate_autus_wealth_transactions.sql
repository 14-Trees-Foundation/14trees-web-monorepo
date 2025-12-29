-- Migration: Classify existing transactions for Autus Wealth (Group ID: 131)
-- Date: 2024-12-19
-- Description: Apply heuristic-based classification to existing transactions

-- Migration script for Group 131 only
UPDATE gift_redeem_transactions grt
SET 
    gift_source_type = CASE 
        WHEN combined_data.card_count = combined_data.no_of_cards 
             AND grt.created_at - combined_data.request_created_at < INTERVAL '2 hours'
        THEN 'fresh_request'
        ELSE 'pre_purchased'
    END,
    source_request_id = combined_data.request_id
FROM (
    SELECT 
        grt.id as transaction_id,
        gcr.id as request_id,
        gcr.no_of_cards,
        gcr.created_at as request_created_at,
        COUNT(grtc.gc_id) as card_count
    FROM gift_redeem_transactions grt
    JOIN gift_redeem_transaction_cards grtc ON grtc.grt_id = grt.id
    JOIN gift_cards gc ON gc.id = grtc.gc_id
    JOIN gift_card_requests gcr ON gcr.id = gc.gift_card_request_id
    WHERE grt.group_id = 131  -- Autus Wealth only
    GROUP BY grt.id, gcr.id, gcr.no_of_cards, gcr.created_at
) AS combined_data
WHERE grt.id = combined_data.transaction_id;

-- Verify migration results
SELECT 
    gift_source_type,
    COUNT(*) as transaction_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM gift_redeem_transactions 
WHERE group_id = 131
GROUP BY gift_source_type
ORDER BY transaction_count DESC;