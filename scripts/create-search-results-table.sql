-- search_results: API 응답 캐시 + 검색 이력 축적
CREATE TABLE search_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 사용자 입력
  search_keyword TEXT NOT NULL,
  foreign_ratio TEXT,
  change_willingness TEXT,

  -- 매장 기본 정보 (정규화)
  store_name TEXT,
  business_type TEXT,
  address TEXT,
  phone TEXT,
  instagram_url TEXT,

  -- 네이버 지도
  naver_registered BOOLEAN DEFAULT false,
  naver_category TEXT,
  naver_link TEXT,
  naver_address TEXT,
  naver_road_address TEXT,
  naver_mapx TEXT,
  naver_mapy TEXT,
  naver_raw JSONB,

  -- 카카오맵
  kakao_registered BOOLEAN DEFAULT false,
  kakao_category TEXT,
  kakao_place_url TEXT,
  kakao_address TEXT,
  kakao_road_address TEXT,
  kakao_x TEXT,
  kakao_y TEXT,
  kakao_raw JSONB,

  -- Google Maps
  google_registered BOOLEAN DEFAULT false,
  google_rating NUMERIC(2,1),
  google_review_count INTEGER DEFAULT 0,
  google_has_photos BOOLEAN DEFAULT false,
  google_has_english BOOLEAN DEFAULT false,
  google_address TEXT,
  google_raw JSONB,

  -- 분석 결과 요약
  grade TEXT,
  score INTEGER,

  -- 메타
  created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'Asia/Seoul')
);

ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert" ON search_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read" ON search_results FOR SELECT USING (true);

-- 캐시 조회용 인덱스
CREATE INDEX idx_search_results_keyword ON search_results (search_keyword);
CREATE INDEX idx_search_results_created_at ON search_results (created_at DESC);
