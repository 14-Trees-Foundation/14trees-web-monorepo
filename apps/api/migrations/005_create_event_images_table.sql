-- Migration: Create event_images table with sequence support
-- Date: 2025-01-28
-- Description: Create dedicated table for event images with sequence ordering

-- Create event_images table
CREATE TABLE IF NOT EXISTS event_images (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_sequence ON event_images(event_id, sequence);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_images_updated_at
    BEFORE UPDATE ON event_images
    FOR EACH ROW
    EXECUTE FUNCTION update_event_images_updated_at();

-- Migration script to move existing images from events.images array to event_images table
-- This will be run separately after the table is created
DO $$
DECLARE
    event_record RECORD;
    image_url TEXT;
    seq_counter INTEGER;
BEGIN
    -- Loop through all events that have images
    FOR event_record IN 
        SELECT id, images 
        FROM events 
        WHERE images IS NOT NULL AND array_length(images, 1) > 0
    LOOP
        seq_counter := 0;
        
        -- Loop through each image in the array
        FOREACH image_url IN ARRAY event_record.images
        LOOP
            INSERT INTO event_images (event_id, image_url, sequence)
            VALUES (event_record.id, image_url, seq_counter);
            
            seq_counter := seq_counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Note: After migration is complete and verified, we can deprecate the images column in events table
-- ALTER TABLE events DROP COLUMN images; -- Run this later after confirming migration success