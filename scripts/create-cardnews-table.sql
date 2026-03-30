-- 카드뉴스 세트 (1회 생성 = 1row)
CREATE TABLE cardnews_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'Asia/Seoul'),
  card_count INTEGER DEFAULT 10
);

-- 카드뉴스 개별 카드 (세트당 10장)
CREATE TABLE cardnews_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID REFERENCES cardnews_sets(id) ON DELETE CASCADE,
  card_index INTEGER NOT NULL,
  card_type TEXT NOT NULL, -- cover, content, cta
  headline TEXT,
  sub_headline TEXT,
  body_points JSONB, -- ["point1", "point2"]
  stat_value TEXT,
  stat_label TEXT,
  source TEXT,
  image_keyword TEXT,
  image_url TEXT, -- Supabase Storage public URL
  gradient_key TEXT,
  created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'Asia/Seoul')
);

-- RLS
ALTER TABLE cardnews_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardnews_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON cardnews_sets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read" ON cardnews_sets FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON cardnews_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read" ON cardnews_cards FOR SELECT USING (true);

-- 인덱스
CREATE INDEX idx_cardnews_cards_set_id ON cardnews_cards (set_id);
CREATE INDEX idx_cardnews_sets_created_at ON cardnews_sets (created_at DESC);

-- Supabase Storage 버킷 생성 (SQL Editor에서 실행 안됨 — 대시보드에서 수동 생성)
-- 버킷명: cardnews
-- Public: true
