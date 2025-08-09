-- Migration: Add sequence support to event_messages table
-- Date: 2025-01-28
-- Description: Add sequence column and proper foreign key constraints to event_messages

-- Add sequence column if it doesn't exist
ALTER TABLE event_messages ADD COLUMN IF NOT EXISTS sequence INTEGER DEFAULT 0;

-- Add index for sequence ordering
CREATE INDEX IF NOT EXISTS idx_event_messages_sequence ON event_messages(event_id, sequence);

-- Ensure user_id has proper foreign key constraint (messenger)
-- First, let's check if the constraint already exists and add it if not
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_event_messages_user' 
        AND table_name = 'event_messages'
    ) THEN
        ALTER TABLE event_messages 
        ADD CONSTRAINT fk_event_messages_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing messages to have sequence numbers based on creation order
DO $$
DECLARE
    event_record RECORD;
    message_record RECORD;
    seq_counter INTEGER;
BEGIN
    -- Loop through all events that have messages
    FOR event_record IN 
        SELECT DISTINCT event_id 
        FROM event_messages 
        WHERE sequence = 0 OR sequence IS NULL
    LOOP
        seq_counter := 0;
        
        -- Loop through messages for this event ordered by created_at
        FOR message_record IN 
            SELECT id 
            FROM event_messages 
            WHERE event_id = event_record.event_id 
            ORDER BY created_at ASC
        LOOP
            UPDATE event_messages 
            SET sequence = seq_counter 
            WHERE id = message_record.id;
            
            seq_counter := seq_counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Make sequence NOT NULL after setting values
ALTER TABLE event_messages ALTER COLUMN sequence SET NOT NULL;