import { AnalysisResult, ScoreBreakdown, KeyMetric, PlatformInfo } from "./types";
import { SCORE_LIMITS, GRADE_THRESHOLDS, CTA_MESSAGES } from "./constants";

/** AI 응답의 score_breakdown을 범위 내로 정규화 */
export function normalizeBreakdown(raw: Record<string, number>): ScoreBreakdown {
  return {
    online_presence: clamp(raw.online_presence, 0, SCORE_LIMITS.online_presence),
    review_status: clamp(raw.review_status, 0, SCORE_LIMITS.review_status),
    visual_content: clamp(raw.visual_content, 0, SCORE_LIMITS.visual_content),
    accessibility: clamp(raw.accessibility, 0, SCORE_LIMITS.accessibility),
    k_potential: clamp(raw.k_potential, 0, SCORE_LIMITS.k_potential),
    owner_readiness: clamp(raw.owner_readiness, 0, SCORE_LIMITS.owner_readiness),
  };
}

/** breakdown → 총점 + 등급 계산 */
export function calcScoreAndGrade(breakdown: ScoreBreakdown): { score: number; grade: AnalysisResult["grade"] } {
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  let grade: AnalysisResult["grade"] = "D";
  if (score >= GRADE_THRESHOLDS.S) grade = "S";
  else if (score >= GRADE_THRESHOLDS.A) grade = "A";
  else if (score >= GRADE_THRESHOLDS.B) grade = "B";
  else if (score >= GRADE_THRESHOLDS.C) grade = "C";
  return { score, grade };
}

/** AI 응답 JSON → 검증 + 파싱 */
export function parseAiJson(text: string): Record<string, unknown> | null {
  try {
    const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(jsonStr);
  } catch {
    console.error("[normalize-result] JSON parse failed");
    return null;
  }
}

/** AI 응답 유효성 검증 */
export function validateParsed(parsed: Record<string, unknown>): boolean {
  if (!parsed.score_breakdown || !parsed.title || !parsed.summary) return false;
  if (!Array.isArray(parsed.improvements) || parsed.improvements.length === 0) return false;
  return true;
}

/** key_metrics 배열 정규화 */
export function normalizeKeyMetrics(raw: unknown[]): KeyMetric[] {
  return (raw || []).map((m: unknown) => {
    const metric = m as { label: string; value: string; status: string; detail: string };
    return {
      label: metric.label,
      value: metric.value,
      status: (metric.status as KeyMetric["status"]) || "warning",
      detail: metric.detail,
    };
  });
}

/** 공통 AnalysisResult 조립 */
export function buildAnalysisResult(params: {
  parsed: Record<string, unknown>;
  breakdown: ScoreBreakdown;
  score: number;
  grade: AnalysisResult["grade"];
  storeName: string;
  businessType: string;
  platforms: PlatformInfo[];
  address?: string;
  phone?: string;
  instagramUrl?: string;
}): AnalysisResult {
  const { parsed, breakdown, score, grade, storeName, businessType, platforms } = params;
  return {
    grade,
    score,
    score_breakdown: breakdown,
    store_name: storeName,
    business_type: businessType,
    store_address: params.address || undefined,
    store_phone: params.phone || undefined,
    instagram_url: params.instagramUrl,
    platforms,
    title: parsed.title as string,
    summary: parsed.summary as string,
    key_metrics: normalizeKeyMetrics(parsed.key_metrics as unknown[]),
    improvements: (parsed.improvements as string[]).slice(0, 3),
    action_plan: parsed.action_plan as string,
    potential: parsed.potential as string,
    cta_message: CTA_MESSAGES[grade],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value || 0));
}
