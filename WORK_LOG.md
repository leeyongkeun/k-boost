# K-BOOST 작업 내역

## 2026-03-15 (4차)

### 결과 화면 UI 강화 — 매장 프로필 + 플랫폼 상세 + 아이콘
- **매장 프로필 카드** 추가 (결과 상단)
  - 매장명, 업종, 주소, 전화번호 표시
  - 실제 데이터 기반 신뢰감 강화
- **플랫폼 카드 개선** (한 줄 → 카드형)
  - 평점, 리뷰 수, 사진, 영어 지원 태그 표시
  - 카테고리 정보 표시 (네이버/카카오)
- **플랫폼 아이콘** SVG 적용 (`public/icons/`)
  - 네이버 지도, 카카오맵, Google Maps, Instagram 4종
- **플랫폼 링크 안전 처리**
  - 네이버 `link`가 인스타그램이면 → 네이버 지도 검색 URL로 대체
  - 인스타 링크는 별도 IG 카드로 분리 표시
  - Google Maps는 항상 검색 URL 생성
- **인스타그램 링크** 자동 감지 및 표시
  - 네이버 API link가 instagram.com이면 별도 Instagram 카드 노출
- 타입 확장: `PlatformInfo`에 `link`, `category` / `AnalysisResult`에 `store_address`, `store_phone`, `instagram_url`

---

## 2026-03-15 (3차)

### 타임아웃 20% 증가 + 에러 로깅
- **타임아웃 증가**
  - 개별 API: 5s → 6s / 플랫폼 검색: 12s → 14.4s / 글로벌: 15s → 18s
  - 상수화: `API_TIMEOUT_MS`, `PLATFORM_SEARCH_TIMEOUT_MS`, `GLOBAL_ANALYSIS_TIMEOUT_MS`
- **에러 로깅** (`lib/error-logger.ts` 신규)
  - Supabase `error_logs` 테이블에 자동 기록 (fire-and-forget)
  - 에러 유형: `platform_search` / `claude_analysis` / `timeout` / `unknown`
  - 검색 키워드 + 에러 메시지 저장
  - 호출 위치: platform-search.ts, route.ts, claude.ts

---

## 2026-03-15 (2차)

### 플랫폼 검색 + Claude 분석 파이프라인 완성
- **3개 플랫폼 실시간 검색** (`lib/platform-search.ts` 신규)
  - 네이버 지도 API (6초 타임아웃)
  - 카카오맵 API (6초 타임아웃)
  - Google Maps Places API v1 (6초 타임아웃)
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
