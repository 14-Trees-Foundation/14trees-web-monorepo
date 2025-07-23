-- Migration: Add gift source tracking to gift_redeem_transactions table
-- Date: 2024-12-19
-- Description: Add gift_source_type and source_request_id columns to support transaction source tracking

-- Add new columns
ALTER TABLE gift_redeem_transactions 
ADD COLUMN gift_source_type VARCHAR(50) DEFAULT 'fresh_request',
ADD COLUMN source_request_id INTEGER;

-- Add foreign key constraint
ALTER TABLE gift_redeem_transactions 
ADD CONSTRAINT fk_grt_source_request 
FOREIGN KEY (source_request_id) REFERENCES gift_card_requests(id);

-- Add indexes for performance
CREATE INDEX idx_grt_source_type ON gift_redeem_transactions(gift_source_type);
CREATE INDEX idx_grt_source_request ON gift_redeem_transactions(source_request_id);

-- Add comments for documentation
COMMENT ON COLUMN gift_redeem_transactions.gift_source_type IS 'Type of gift source: fresh_request or pre_purchased';
COMMENT ON COLUMN gift_redeem_transactions.source_request_id IS 'Reference to the original gift_card_request that sourced this transaction';