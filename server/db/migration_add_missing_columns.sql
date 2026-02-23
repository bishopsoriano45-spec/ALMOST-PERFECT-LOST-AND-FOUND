-- Migration: Add missing columns to lost_items and found_items tables
-- Run this to fix upload errors

-- Add qr_code column to lost_items
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Add updated_at column to lost_items
ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add qr_code column to found_items
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Add updated_at column to found_items
ALTER TABLE found_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update status constraint to include 'active' status
ALTER TABLE lost_items DROP CONSTRAINT IF EXISTS lost_items_status_check;
ALTER TABLE lost_items ADD CONSTRAINT lost_items_status_check 
    CHECK(status IN ('open', 'active', 'matched', 'claimed', 'closed'));

ALTER TABLE found_items DROP CONSTRAINT IF EXISTS found_items_status_check;
ALTER TABLE found_items ADD CONSTRAINT found_items_status_check 
    CHECK(status IN ('open', 'active', 'matched', 'claimed', 'closed'));

-- Update existing 'open' status to 'active' to match code expectations
UPDATE lost_items SET status = 'active' WHERE status = 'open';
UPDATE found_items SET status = 'active' WHERE status = 'open';
