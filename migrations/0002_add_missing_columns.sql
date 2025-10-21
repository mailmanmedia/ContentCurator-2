-- Migration: Add missing columns to various tables
-- Date: 2025-01-20
-- Purpose: Add columns that routes.ts expects but are missing from schema

-- Add missing columns to rss_articles table
ALTER TABLE rss_articles ADD COLUMN IF NOT EXISTS raw_data_json JSONB;
ALTER TABLE rss_articles ADD COLUMN IF NOT EXISTS topics TEXT[];
ALTER TABLE rss_articles ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE rss_articles ADD COLUMN IF NOT EXISTS sentiment JSONB;

-- Add missing column to images table
ALTER TABLE images ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Add missing columns to frameworks table
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS total_downloads INTEGER DEFAULT 0;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS current_version_id INTEGER;

-- Add missing column to framework_versions table
ALTER TABLE framework_versions ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Add missing column to report_renderings table (if it exists)
-- Note: This table might not exist yet, so we use a conditional approach
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_renderings') THEN
    ALTER TABLE report_renderings ADD COLUMN IF NOT EXISTS content_html TEXT;
  END IF;
END $$;

-- Add missing column to reports table (title -> name mapping exists, but routes uses .title)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
    -- Reports table uses 'name' not 'title', this is a code issue not schema issue
    -- We'll fix this in the routes.ts file instead
  END IF;
END $$;

-- Add foreign key constraint for current_version_id if both tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'frameworks') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'framework_versions') THEN
    ALTER TABLE frameworks 
    ADD CONSTRAINT fk_frameworks_current_version 
    FOREIGN KEY (current_version_id) 
    REFERENCES framework_versions(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for new columns that will be queried frequently
CREATE INDEX IF NOT EXISTS idx_rss_articles_topics ON rss_articles USING GIN (topics);
CREATE INDEX IF NOT EXISTS idx_rss_articles_sentiment ON rss_articles USING GIN (raw_data_json);
CREATE INDEX IF NOT EXISTS idx_frameworks_total_downloads ON frameworks (total_downloads);
