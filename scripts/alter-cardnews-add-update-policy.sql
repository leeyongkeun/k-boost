-- cardnews_cards에 UPDATE 정책 추가 (이미지 URL 업데이트용)
CREATE POLICY "Allow public update" ON cardnews_cards FOR UPDATE USING (true) WITH CHECK (true);

-- Storage 정책 (cardnews 버킷 업로드/읽기 허용)
CREATE POLICY "Allow public upload cardnews" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cardnews');
CREATE POLICY "Allow public read cardnews" ON storage.objects FOR SELECT USING (bucket_id = 'cardnews');
