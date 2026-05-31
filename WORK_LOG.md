# K-BOOST 작업 내역

## 2026-05-31 (14차)

### 메타(Facebook) 픽셀 설치 — 광고 성과 추적
- 가이드(`docs/meta_pixel_guide.md`)는 CRA(`public/index.html`) 기준 → **Next.js App Router 방식으로 변환** 적용
- 픽셀 ID: `1307787700930555` → `.env.local` 의 `NEXT_PUBLIC_META_PIXEL_ID` 환경변수로 관리 (하드코딩 폴백 포함)
- **`lib/pixel.ts` 신규**: `window.fbq` 타입 선언 + `trackStandard`/`trackCustom`/`trackLead` 헬퍼 (SSR·로딩전·광고차단 가드 일원화)
- **기본 코드**: `app/layout.tsx` `<head>` 에 `next/script`(afterInteractive) + `<noscript>` — PageView 자동
- **이벤트 6종 발화 지점**:
  - `test_start` — `app/page.tsx` Landing onStart(랜딩 시작 버튼)
  - `quiz_start` — `app/page.tsx` handleSubmit(결과 확인 버튼, 검증 통과 후)
  - `result_view` — `app/page.tsx` result phase 진입
  - `Lead` ★ — `QuizResult.tsx` handleCtaSubmit(연락처 제출 완료) — store/score/grade 파라미터 포함
  - `cta_click` — `Completion.tsx` 외부 CTA(kboost.co.kr/plan) onClick
- 공유 결과 페이지(`/result/[id]`)는 중복 집계 방지 위해 **메인 퍼널만 추적**(미적용)
- `npm run build` 타입 통과 확인
- 검증: 브라우저 콘솔 `typeof fbq` → `"function"`, 또는 Meta Pixel Helper 확장으로 이벤트 실발화 확인

## 2026-03-30 (13차)

### inbound 유입경로 추적
- URL `?inbound=xxx` 쿼리 파라미터 캡처 → DB 저장
- `search_results` 테이블에 `inbound TEXT` 컬럼 추가 (마이그레이션 SQL 실행 완료)
- 프론트(`page.tsx`) → API(`analyze/route.ts`) → `save-search-result.ts` 전체 연결
- 관리자 리스트 테이블 + 상세 모달에 유입경로 컬럼 표시

### 관리자 대시보드
- **KPI 카드 4개**: 총 등록 수 / 오늘 등록 / 리드 수집률(%) / PDF 발송률(%)
- **일별 등록 스택 바 차트**: Recharts 라이브러리, 등급별(S~D) 컬러 스택
  - 7/14/30일 기간 토글 (기본 14일)
- **매장 위치 지도**: Leaflet + OpenStreetMap
  - 등급별 컬러 마커 핀, 클릭 시 매장명/주소/등급/점수 팝업
  - 카카오 좌표 우선, 네이버 좌표 폴백
  - 초기 위치 종로구 인근 고정 (zoom 12)
- 차트 + 지도 50:50 가로 배치 (`lg:grid-cols-2`)
- `lib/admin-auth.ts` — 세션 인증 헬퍼 공유 모듈 분리
- `/api/admin/stats` — 통계 전용 API 엔드포인트 신규

### 카드뉴스 자동 생성기 (`/admin/cardnews`)
- **Gemini Search Grounding**으로 최신 관광 뉴스 수집
- 10장 카드뉴스 자동 생성: 커버(1장) + 콘텐츠(8장) + CTA(1장)
- **90+ 주제 풀** — 10개 카테고리(방한통계, 소비트렌드, K-컬처, 핫플레이스, 정책, 매장운영, 시즌, 디지털, 글로벌비교, 미래전망)에서 매번 랜덤 8개 선택
- **도파민 자극형 헤드라인** 프롬프트 가이드 (긴급성/충격/호기심/비교/꿀팁 등)
- **Pexels API** 키워드 기반 배경 이미지 (서버 fetch → base64 변환)
- 1080×1080 인스타그램 사이즈 렌더링 (`html2canvas`)
- 개별 PNG 다운로드 + 전체 ZIP 다운로드 (`jszip`)
- 10종 그라디언트 배경 프리셋, 배경 이미지 원본 색감 + 반투명 텍스트 박스
- bodyPoints 2줄 제한, 폰트 사이즈 확대

### 기타
- `next.config.ts` — `/admin`, `/admin/cardnews` 캐시 비활성화 (`no-store`)
- Leaflet 타일 렌더링 수정 (Tailwind preflight `img` 오버라이드)
- 관리자 메인에 "📰 카드뉴스" 바로가기 링크 추가

### 신규 패키지
- `recharts` — 차트
- `leaflet` + `@types/leaflet` — 지도
- `html2canvas` — HTML → PNG 캡처
- `jszip` — ZIP 다운로드

### 카드뉴스 디자인 튜닝 (커밋 a115951 ~ 0710a10)
- 배경 이미지 10장 모두 다르게 — 프롬프트 키워드 다양화 + Pexels 페이지 분산
- 배경 이미지 원본 색감 그대로 — 그라디언트/오버레이/장식 원 전부 제거
- 텍스트 박스 오버레이 15%로 (배경 투과)
- bodyPoints 2줄 제한, 폰트 사이즈 확대

### 카드뉴스 DB 저장 + 이력 갤러리 (커밋 7e5d8bb)
- `cardnews_sets` / `cardnews_cards` 테이블 생성 SQL
- 생성 시 Supabase Storage에 이미지 업로드 + DB에 카드 데이터 저장
- `/api/admin/cardnews/history` — 이력 조회 API
- 카드뉴스 페이지에 **생성/이력 탭** 추가
- 이력 탭: 사진첩 형태 세트 목록 → 클릭 시 10장 상세 보기

### Supabase 작업 필요 (수동)
- SQL: `scripts/create-cardnews-table.sql` 실행
- Storage: `cardnews` 버킷 생성 (Public)

### 신규 환경변수 (Vercel에도 등록 필요)
- `PEXELS_API_KEY` — 카드뉴스 배경 이미지용

### 카드뉴스 최종 렌더링 이미지 저장 (커밋 4f217c1)
- 서버사이드 배경 원본 업로드 → **클라이언트 html2canvas 캡처 후 업로드**로 변경
- 생성 후 자동으로 10장 캡처 → `/api/admin/cardnews/upload` → Supabase Storage
- 텍스트+배경이 합성된 **최종 카드뉴스 PNG**가 이력에 표시됨
- `cardnews_cards` UPDATE 정책 + Storage 업로드/읽기 정책 SQL 추가

### 인증 시스템 전면 개편 — stateless 토큰 (커밋 22d785d)
- **문제:** Vercel serverless에서 인메모리 Map 세션이 인스턴스 간 공유 불가 → 이력 조회/stats/카드뉴스 API 전부 401 에러
- **해결:** HMAC-SHA256 서명 기반 토큰으로 전환 (stateless)
  - `generateToken()`: 만료시간 + 서명이 토큰 안에 포함
  - `isValidSession()`: 서명 검증만으로 인증 → 어떤 인스턴스에서든 작동
- 모든 admin API 경로에서 동일하게 동작 (Map 의존 제거)

### Supabase 추가 SQL 실행 필요
- `scripts/alter-cardnews-add-update-policy.sql` (cardnews UPDATE + Storage 정책)

### 커밋 이력
- `2dad7b8`: inbound 쿼리 파라미터 추적
- `da4264e`: 관리자 대시보드 (KPI + 차트)
- `b4d8d4b` ~ `d4a634b`: 지도 추가 + 레이아웃 조정
- `89bf745`: admin 캐시 비활성화
- `c2f7501`: 카드뉴스 생성기 초기 구현
- `cfb1f2f`: 주제 풀 90+ 확장
- `d7327bd` ~ `76cd9b9`: 도파민 헤드라인 + Pexels 이미지
- `fdaf66d` ~ `0710a10`: 배경 이미지 원본 색감 + 오버레이 튜닝
- `a115951`: 10장 이미지 다양화
- `7e5d8bb`: DB 저장 + 이력 갤러리
- `12d9766`: 이력 조회를 /api/admin으로 통합
- `4f217c1`: 최종 렌더링 이미지 클라이언트 캡처 → Storage 업로드
- `22d785d`: 인메모리 세션 → HMAC 서명 기반 stateless 토큰
- `ee13ce1`: 이력 저장 수동 버튼 + 캡처 안정성 개선
- `6f86ccd`: CardNewsSet 타입 빌드 에러 수정
- 전체 push 완료 → Vercel 자동 배포
- **전 기능 정상 동작 확인 완료** (카드뉴스 생성 + 이력 저장 + 이력 갤러리)

---

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
