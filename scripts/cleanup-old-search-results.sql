-- 30일 이상 된 search_results 삭제 (수동 실행 또는 pg_cron 등록)
-- Supabase pg_cron 등록 예시:
-- SELECT cron.schedule('cleanup-old-search-results', '0 3 * * 0', $$DELETE FROM search_results WHERE created_at < (now() AT TIME ZONE 'Asia/Seoul') - INTERVAL '30 days'$$);

DELETE FROM search_results
WHERE created_at < (now() AT TIME ZONE 'Asia/Seoul') - INTERVAL '30 days';

-- 일별 API 호출량 모니터링 쿼리
-- SELECT
--   DATE(created_at) AS day,
--   COUNT(*) AS total_searches,
--   COUNT(DISTINCT search_keyword) AS unique_keywords
-- FROM search_results
-- GROUP BY DATE(created_at)
-- ORDER BY day DESC
-- LIMIT 30;
