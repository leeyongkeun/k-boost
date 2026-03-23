-- Add customer_phone and pdf_sent columns to search_results table
-- Run this in Supabase SQL Editor

ALTER TABLE search_results
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS pdf_sent BOOLEAN DEFAULT false;

-- 고객 전화번호 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_search_results_customer_phone
  ON search_results (customer_phone)
  WHERE customer_phone IS NOT NULL;

-- pdf 미발송 건 필터링용 인덱스
CREATE INDEX IF NOT EXISTS idx_search_results_pdf_sent
  ON search_results (pdf_sent)
  WHERE customer_phone IS NOT NULL;
