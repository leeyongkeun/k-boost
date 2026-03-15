# K-BOOST 작업 내역

## 2026-03-15 (2차)

### 플랫폼 검색 + Claude 분석 파이프라인 완성
- **3개 플랫폼 실시간 검색** (`lib/platform-search.ts` 신규)
  - 네이버 지도 API (5초 타임아웃)
  - 카카오맵 API (5초 타임아웃)
  - Google Maps Places API v1 (5초 타임아웃)
  - 2단계 병렬 구조: (네이버+카카오 동시) → Google Maps 순차
- **Claude AI 분석** (`lib/claude.ts` 신규)
  - Claude Haiku로 플랫폼 데이터 기반 6차원 분석
  - `max_tokens: 1024 → 4096` 버그 수정 (JSON 응답 잘림 방지)
- **Gemini 소셜 검색 제거**
  - TripAdvisor/Instagram 검색 비활성화 (26초 소요, JSON 미준수)
  - Gemini는 `gemini_search` 모드에서만 사용
- **3모드 분석 전환** (`ANALYZE_MODE` 환경변수)
  - `api`: 네이버+카카오+Google Maps → Claude 분석 (현재 활성)
  - `gemini_search`: Gemini Google Search Grounding
  - `db`: Supabase 상권 DB 로컬 계산
- **디버그 API** (`app/api/debug/route.ts` 신규)
  - API 키 설정 상태 확인용 엔드포인트
- **의존성 추가**: `@anthropic-ai/sdk` (Claude API)
- **테스트 결과**: "그릭판다" → B등급(64점), 플랫폼 검색 0.6초 + Claude 분석 ~9초

### 문서 동기화
- `docs/K-BOOST_작업현황.md` 전면 업데이트 (코드 현행화)

---

## 2026-03-15 (1차)

### 플랫폼 검색 확장 (Google Maps API + Gemini 소셜 검색)
- `lib/platform-search.ts` 전면 업데이트
  - **Google Maps Places API (New)** 연결: 별점, 리뷰 수, 사진, 영어 리뷰 조회
  - **TripAdvisor** → Gemini 웹검색(Google Search Grounding)으로 등록 여부/별점/리뷰 조회
  - **Instagram** → Gemini 웹검색으로 해시태그 게시물 수, 공식 계정 여부 조회
- 2단계 병렬 검색 구조: (네이버+카카오) → (Google Maps + Gemini 소셜) 동시 실행
- `.env.local`에 `GOOGLE_MAPS_API_KEY` 항목 추가
- 빌드 성공 확인
