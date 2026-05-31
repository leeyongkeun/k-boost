// ─────────────────────────────────────────────────────────────
// Meta(Facebook) Pixel 헬퍼
//
// 가이드 문서(docs/meta_pixel_guide.md) 기반.
// CRA가 아닌 Next.js App Router 프로젝트라, 기본 코드는 app/layout.tsx 에서
// next/script 로 로드하고, 이벤트는 이 헬퍼를 통해 발화한다.
//
// 모든 호출은 window.fbq 존재 여부를 가드하므로(아래 trackPixel),
// 픽셀 로딩 전/SSR/광고차단 환경에서도 에러가 나지 않는다.
// ─────────────────────────────────────────────────────────────

/** .env.local 의 NEXT_PUBLIC_META_PIXEL_ID (없으면 가이드 기본 ID 폴백) */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "1307787700930555";

type FbqStandardEvent = "PageView" | "Lead";
type FbqCustomEvent =
  | "test_start"
  | "quiz_start"
  | "result_view"
  | "cta_click";

declare global {
  interface Window {
    fbq?: (
      method: "track" | "trackCustom" | "init",
      eventOrId: string,
      params?: Record<string, unknown>
    ) => void;
    _fbq?: unknown;
  }
}

/**
 * 표준(Standard) 이벤트 발화. Lead 등 메타가 정의한 전환 이벤트용.
 * params 로 value/currency 등 전환 가치를 함께 보낼 수 있다.
 */
export function trackStandard(
  event: FbqStandardEvent,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params);
}

/**
 * 커스텀(Custom) 이벤트 발화. test_start / quiz_start / result_view / cta_click 등
 * 우리가 직접 정의한 퍼널 단계용.
 */
export function trackCustom(
  event: FbqCustomEvent,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", event, params);
}

/** ★ 가장 중요한 전환 — 연락처 제출(리드) */
export function trackLead(params?: Record<string, unknown>) {
  trackStandard("Lead", params);
}
