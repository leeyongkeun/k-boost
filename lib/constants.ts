// --- 타임아웃 ---
export const API_TIMEOUT_MS = 5000;           // 개별 플랫폼 API (3개 병렬이므로 줄임)
export const PLATFORM_SEARCH_TIMEOUT_MS = 7000;  // 전체 플랫폼 검색 (3개 병렬)
export const GLOBAL_ANALYSIS_TIMEOUT_MS = 20000; // 전체 분석 (플랫폼 + Claude)

// --- 캐시 ---
export const CACHE_TTL_DAYS = 7;

// --- Rate Limit ---
export const RATE_LIMIT_MAX = 5;              // IP당 최대 요청 수
export const RATE_LIMIT_WINDOW_MS = 60_000;   // 윈도우 (1분)

// --- 입력 검증 ---
export const STORE_INFO_MAX_LENGTH = 200;

// --- 등급 ---
export const GRADE_THRESHOLDS = { S: 85, A: 65, B: 45, C: 25 } as const;

// --- CTA 메시지 ---
export const CTA_MESSAGES: Record<string, string> = {
  S: "K-BOOST 프리미엄 분석 받아보기",
  A: "K-BOOST 맞춤 전략 확인하기",
  B: "K-BOOST 시작 가이드 받기",
  C: "K-BOOST 무료 상담 받기",
  D: "K-BOOST 기본 진단 받기",
};

// --- 점수 정규화 한도 ---
export const SCORE_LIMITS = {
  online_presence: 20,
  review_status: 20,
  visual_content: 15,
  accessibility: 20,
  k_potential: 15,
  owner_readiness: 10,
} as const;
