# K-BOOST 작업 내역

## 2026-03-23 (12차)

### docs HTML → React 전환 (page1~4 전체)
- **Landing.tsx** 신규: page1.html 랜딩 페이지 React 변환
  - 로켓 애니메이션 (float, orbit, exhaust trail)
  - 카운트다운 타이머, CTA 버튼
- **page.tsx** 리디자인: page2.html 퀴즈 화면 스타일 적용
  - phase 관리: landing → quiz → loading → result → completion
- **QuizResult.tsx** 대폭 변경: page3.html 결과 화면 완전 반영
  - 매장 프로필, 점수 링, 카테고리 바, 진단 카드, 개선 방향
  - 매출 부스트 바 (애니메이션), CTA 섹션 (연락처 입력 + 개인정보 동의)
  - 연락처 자동 하이픈 포맷 (010-0000-0000)
  - 개인정보 수집 동의 모달
- **Completion.tsx** 신규: page4.html 신청완료 화면
  - 체크 아이콘 + confetti 애니메이션 + 완료 메시지
- **globals.css**: 애니메이션 keyframes 대폭 추가
  - circleIn, ringFade, confettiPop, rocketFloat, orbitSpin, exhaust 등
- **questions.ts**: 외국인 비율 옵션 HTML 원본에 맞춰 수정
  - 4개 → 3개 (전혀 없음 / 거의 없음 / 어느 정도)

### 관리자페이지 (`/admin`)
- **로그인**: ID/PW 인증 → 세션 토큰 발급 (64자 랜덤)
  - 로그인 시도 5회 제한 (초과 시 5분 차단)
  - 세션 4시간 자동 만료
  - sessionStorage에 토큰 저장 → 새로고침해도 유지
  - 로그아웃 버튼
- **리스트 화면**: search_results 테이블 조회
  - 필터: 등급 / 연락처 유무 / PDF 발송 여부
  - 정렬: 컬럼 헤더 클릭 (일시, 매장명, 업종, 점수, 등급)
  - pdf_sent 체크박스 토글 → 즉시 DB UPDATE (optimistic)
  - 상세보기 아이콘(👁) → 팝업 모달
- **상세 모달**: 매장 전체 데이터 확인
  - 매장 정보, 사용자 입력, 네이버/카카오/Google 플랫폼 상세, 고객 정보
- **UI**: 로켓 이모지 로고, 다크 네이비 테마 통일

### 리드 수집 (Phase 5)
- **`/api/lead`**: 고객 연락처를 search_results 테이블에 UPDATE
  - store_name + 최근 1시간 내 row 매칭 (fallback: 최신 row)
- **DB 스키마 변경** (`scripts/alter-search-results-add-lead.sql`)
  - `customer_phone TEXT` 컬럼 추가
  - `pdf_sent BOOLEAN DEFAULT false` 컬럼 추가
  - partial index: customer_phone IS NOT NULL 조건
- **RLS**: UPDATE 정책 추가 필요 (`Allow public update`)

### 커밋
- `974baa3`: 12개 파일 변경, 1810줄 추가
- origin/master에 push 완료 → Vercel 자동 배포

---

## 2026-03-15 (11차)

### 점수 UI 최종 정리
- **등급 큰 원형 제거** → 점수 링만 중앙 배치 (170px, 46px 폰트)
- **등급은 미니 뱃지(28px 사각)로** 라벨 앞에: `[A] K-글로벌 유망 매장 상위20%`
- 점수 텍스트 링 정중앙 배치 (`dominantBaseline: central`)

---

## 2026-03-15 (10차)

### 진단 상세 통합 + 텍스트 말머리표 정리
- **플랫폼 카드 + Key Metrics 중복 해소** → 플랫폼별 통합 카드
  - 플랫폼명으로 매칭되는 지표 설명을 카드 하단에 포함
  - 나머지 지표(외국어 지원, 온라인 존재감 등)만 별도 카드로
- **플랫폼 카드 한 줄형**: 아이콘 | 이름+링크 | ⭐4.5 32건 EN [등록]
- **이번 주 바로 실행**: 긴 문장 → 문장 단위 말머리표(•) 분리
- **3개월 후 기대 효과**: 쉼표 구분 → 항목별 말머리표(•) 분리

---

## 2026-03-15 (9차)

### 결과 UI 가독성 2차 개선
- **점수 표시**: `76점` 한 줄 통합 (같은 폰트/크기)
- **섹션 구분**: 매장정보 / 진단상세 / 개선방향 구분선 + 타이틀
- **Key Metrics**: 라벨+값 상단, 설명 하단 분리 (텍스트 크기 11-12px로 향상)
- **개선 포인트**: 아이콘 카드형 (🎯📈💡 + "개선 1/2/3")
- **액션 플랜**: ⚡ 아이콘 + 서브텍스트 강조 카드
- **CTA 문구**: "다시 테스트하기" → "다른 매장도 진단해보기"

---

## 2026-03-15 (8차)

### 타임아웃 최적화 — 20초 + 3개 플랫폼 완전 병렬
- **전체 타임아웃**: 18s → 20s
- **플랫폼 검색 병렬화**: 네이버+카카오(병렬) → Google(순차) 에서 → 3개 완전 병렬
  - 플랫폼 검색 소요 ~12초 → ~5초로 단축
- **단계별 병렬화**: 캐시 조회 + DB 상권 조회도 동시 실행
- **Claude에 최소 5s 보장** (기존 3s)
- 개별 API 타임아웃: 6s → 5s

---

## 2026-03-15 (7차)

### 결과 UI 임팩트 애니메이션 + 점수 표시 개선
- **점수 표시**: `74 / 100점` → `74점` 간결하게
- **등급 배지**: 바운스 등장(gradeEnter) + 뒤쪽 글로우 펄스 + 라벨 페이드인
- **점수 카운트업**: 0 → 실제 점수 (1.4s ease-out cubic)
- **링 드로잉**: 원형 프로그레스 애니메이션
- **Breakdown 바**: 좌→우 순차 슬라이드인 (100ms 간격)
- **애니메이션 순서 보장**: ScoreRing `onAnimationDone` 콜백 → 바 완료 후 타이틀 → 본문 순차
- 고득점(65+) 링 주변 글로우 이펙트

---

## 2026-03-15 (6차)

### 코드 품질 개선 + 결과 UI 가독성
- **보안**: Rate Limiting (IP당 분당 5회), 입력 200자 제한, `/api/result` 스키마 검증
- **버그 수정**: `analyze-with-data.ts` instaP undefined 접근 수정
- **구조 개선**
  - `lib/constants.ts`: 타임아웃, 캐시TTL, 등급, CTA 상수 통합
  - `lib/normalize-result.ts`: 점수 정규화/등급 계산/JSON 파싱 공통 유틸
  - `claude.ts`, `gemini.ts`: 중복 로직 제거
- **결과 UI 가독성**
  - 섹션 구분선 + 타이틀 (매장정보/진단상세/개선방향)
  - Key Metrics: 2열 그리드 → 1열 리스트형
  - 개선 포인트: 아이콘 카드형 (🎯📈💡)
  - 액션 플랜: 크기/강조 강화 (⚡ + 서브텍스트)
  - 점수 바 두께 증가, 플랫폼 등록/미등록 배지 모두 표시
- **운영**: 캐시 정리 SQL + 코드 리뷰 문서 추가

---

## 2026-03-15 (5차)

### API 응답 DB 저장 (캐시 + 데이터 축적)
- **`search_results` 테이블 설계** (`scripts/create-search-results-table.sql`)
  - 검색 1회 = 1행 통합 구조 (네이버/카카오/Google 분리 X)
  - 정규화 컬럼 + Raw JSON(JSONB) 병행 → 쿼리 가능 + 향후 재추출 가능
  - RLS 정책 (public insert/read) + 캐시 조회용 인덱스
  - `created_at`은 KST(한국시간) 기준 저장
- **Raw API 응답 반환** (`lib/platform-search.ts` 수정)
  - `PlatformSearchResult`에 `naverRaw`, `kakaoRaw`, `googleRaw` 필드 추가
  - `searchGoogleMaps()` 반환에 `raw: GooglePlace` 추가
- **DB 저장 + 캐시 조회** (`lib/save-search-result.ts` 신규)
  - `saveSearchResult()`: fire-and-forget로 검색 결과 저장
  - `getCachedResult()`: 같은 keyword 7일 이내 캐시 히트 시 API 호출 스킵
- **분석 라우트 연동** (`app/api/analyze/route.ts` 수정)
  - API 모드에서 캐시 조회 우선 → 히트 시 플랫폼 API 호출 생략
  - 캐시 미스 시 분석 완료 후 grade/score 포함 DB 저장

---

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
