import Anthropic from "@anthropic-ai/sdk";
import { AnalysisResult, PlatformInfo } from "./types";
import { logError } from "./error-logger";
import { normalizeBreakdown, calcScoreAndGrade, parseAiJson, validateParsed, buildAnalysisResult } from "./normalize-result";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AnalyzeWithDataInput {
  storeName: string;
  storeInfo: string;
  businessType: string;
  address: string;
  phone: string;
  platforms: PlatformInfo[];
  naverCategory: string;
  kakaoCategory: string;
  foreignRatio: string;
  changeWillingness: string;
  instagramUrl?: string;
  areaContext?: {
    districtName: string;
    city: string;
    touristRank: string;
    foreignVisitorRatio: number;
    dailyFootTraffic: number;
  };
}

export async function analyzeWithPlatformData(
  input: AnalyzeWithDataInput
): Promise<AnalysisResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  try {
    const foreignRatioLabel: Record<string, string> = {
      high: "60% 이상",
      medium: "30~60%",
      low: "10~30%",
      very_low: "10% 미만",
    };

    const willLabel: Record<string, string> = {
      high: "적극적 (80% 이상 변화 가능)",
      medium: "조건부 수용 (50% 이상 변화 가능)",
      low: "소극적 (20% 이상 변화 가능)",
    };

    const platformSummary = input.platforms
      .map((p) => {
        const parts = [p.name, p.registered ? "등록됨" : "미등록"];
        if (p.score) parts.push(`평점 ${p.score}`);
        if (p.reviewCount) parts.push(`리뷰 ${p.reviewCount}건`);
        if (p.hasEnglish) parts.push("영어 지원");
        return parts.join(" / ");
      })
      .join("\n");

    const areaInfo = input.areaContext
      ? `\n## 상권 데이터\n- 위치: ${input.areaContext.city} ${input.areaContext.districtName}\n- 관광등급: ${input.areaContext.touristRank}\n- 외국인 비율: ${Math.round(input.areaContext.foreignVisitorRatio * 100)}%\n- 일 유동인구: ${input.areaContext.dailyFootTraffic.toLocaleString()}명`
      : "";

    const prompt = `당신은 K-글로벌화 컨설팅 전문가입니다. 아래 매장의 실제 플랫폼 데이터를 분석해주세요.

## 매장 정보
- 매장명: ${input.storeName}
- 업종: ${input.businessType}
- 주소: ${input.address}
- 전화: ${input.phone || "정보 없음"}
- 네이버 카테고리: ${input.naverCategory || "없음"}
- 카카오 카테고리: ${input.kakaoCategory || "없음"}
- 현재 외국인 손님 비율: ${foreignRatioLabel[input.foreignRatio] || input.foreignRatio}
- 변화 의향: ${willLabel[input.changeWillingness] || input.changeWillingness}
${areaInfo}

## 플랫폼 등록 현황 (실제 API 검색 결과)
${platformSummary}

## 점수 기준 (100점 만점)
- online_presence (0~20): 플랫폼 등록 수(네이버/카카오/Google Maps) × 6 + 영어 지원 플랫폼 수 × 2
- review_status (0~20): 평균 별점과 총 리뷰 수 기반
- visual_content (0~15): 사진 등록 여부, 품질 기반
- accessibility (0~20): 위치의 관광 접근성 (핵심 관광지=20, 준관광=15, 일반=10, 외곽=5)
- k_potential (0~15): 업종의 K-컬처 적합도 + 상권 외국인 수요
- owner_readiness (0~10): 변화 의향 기반 (적극적=10, 조건부=7, 소극적=3)

## 등급
- S: 85~100점 / A: 65~84점 / B: 45~64점 / C: 25~44점 / D: 0~24점

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

{
  "score_breakdown": {
    "online_presence": 0~20,
    "review_status": 0~20,
    "visual_content": 0~15,
    "accessibility": 0~20,
    "k_potential": 0~15,
    "owner_readiness": 0~10
  },
  "key_metrics": [
    {"label": "네이버 지도", "value": "등록됨 또는 미등록", "status": "good/warning/critical", "detail": "상세 설명"},
    {"label": "카카오맵", "value": "등록됨 또는 미등록", "status": "good/warning/critical", "detail": "상세 설명"},
    {"label": "Google Maps", "value": "등록됨 또는 미등록", "status": "good/warning/critical", "detail": "상세 설명"},
    {"label": "외국어 지원", "value": "N/3 플랫폼", "status": "good/warning/critical", "detail": "상세 설명"},
    {"label": "온라인 존재감", "value": "등록 N개", "status": "good/warning/critical", "detail": "상세 설명"}
  ],
  "title": "매장명을 포함한 임팩트 있는 한 줄 진단 (15자 이내)",
  "summary": "2~3문장 진단. 실제 등록 데이터와 상권 특성을 연결해서 설명.",
  "improvements": ["구체적 개선 포인트 3개. 업종과 위치 특성 반영."],
  "action_plan": "이번 주 바로 실행할 수 있는 구체적 액션 1개. 소요시간, 방법, 기대효과 포함.",
  "potential": "3개월 후 구체적 수치 변화 예측."
}

주의사항:
- 실제 플랫폼 등록 데이터에 기반하여 분석하세요.
- 주소에서 상권을 추론하여 accessibility 점수를 매기세요.
- 업종(${input.businessType})의 K-화 특성을 반영하세요.
- improvements는 정확히 3개 작성하세요.
- 뻔한 일반론 금지. 이 매장에 맞는 구체적 조언만.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    console.log("[claude] Raw response length:", text.length, "stop_reason:", message.stop_reason);

    if (message.stop_reason === "max_tokens") {
      console.error("[claude] Response was truncated (max_tokens reached)");
    }

    const parsed = parseAiJson(text);
    if (!parsed || !validateParsed(parsed)) {
      console.error("[claude] Analysis validation failed");
      return null;
    }

    const breakdown = normalizeBreakdown(parsed.score_breakdown as Record<string, number>);
    const { score, grade } = calcScoreAndGrade(breakdown);

    return buildAnalysisResult({
      parsed,
      breakdown,
      score,
      grade,
      storeName: input.storeName,
      businessType: input.businessType,
      address: input.address,
      phone: input.phone,
      instagramUrl: input.instagramUrl,
      platforms: input.platforms.map((p) => ({
        name: p.name,
        registered: p.registered,
        score: p.score,
        reviewCount: p.reviewCount || 0,
        hasPhotos: p.registered,
        hasEnglish: p.hasEnglish || false,
        link: p.link,
        category: p.category,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[claude] Analysis error:", msg);
    logError({ searchKeyword: input.storeName, errorMessage: `Claude: ${msg}`, errorType: "claude_analysis" });
    return null;
  }
}
