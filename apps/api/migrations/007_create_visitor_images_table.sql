-- Migration: Create visitor images table
-- Date: 2024-12-19
-- Description: Create table to store visitor-uploaded images linked to saplings, with optional visitor and visit IDs

CREATE TABLE visitor_images (
    id SERIAL PRIMARY KEY,
    sapling_id VARCHAR(255) NOT NULL,
    visitor_id INTEGER,
    visit_id INTEGER,
    type VARCHAR(50) NOT NULL CHECK (type IN ('user_tree_image', 'user_card_image')),
    image_url TEXT NOT NULL,
    original_name VARCHAR(255),
    mime VARCHAR(100),
    size INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_visitor_images_sapling_id ON visitor_images(sapling_id);
CREATE INDEX idx_visitor_images_visitor_id ON visitor_images(visitor_id);
CREATE INDEX idx_visitor_images_visit_id ON visitor_images(visit_id);
CREATE INDEX idx_visitor_images_type ON visitor_images(type);

-- Add comments for documentation
COMMENT ON TABLE visitor_images IS 'Stores images uploaded by visitors for specific saplings';
COMMENT ON COLUMN visitor_images.sapling_id IS 'Identifier for the sapling this image belongs to';
COMMENT ON COLUMN visitor_images.visitor_id IS 'User ID of the visitor who uploaded the image (optional)';
COMMENT ON COLUMN visitor_images.visit_id IS 'Visit ID associated with this image (optional)';
COMMENT ON COLUMN visitor_images.type IS 'Type of image: user_tree_image or user_card_image';
COMMENT ON COLUMN visitor_images.image_url IS 'S3 URL where the image is stored';
COMMENT ON COLUMN visitor_images.original_name IS 'Original filename of the uploaded image';
COMMENT ON COLUMN visitor_images.mime IS 'MIME type of the image file';
COMMENT ON COLUMN visitor_images.size IS 'Size of the image file in bytes';