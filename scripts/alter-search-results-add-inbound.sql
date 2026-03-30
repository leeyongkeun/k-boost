-- Add inbound column to search_results table
-- Run this in Supabase SQL Editor

ALTER TABLE search_results
  ADD COLUMN IF NOT EXISTS inbound TEXT;

-- inbound 유입경로 필터링용 인덱스
CREATE INDEX IF NOT EXISTS idx_search_results_inbound
  ON search_results (inbound)
  WHERE inbound IS NOT NULL;
