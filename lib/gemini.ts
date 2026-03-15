import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalysisResult, PlatformInfo, KeyMetric, ScoreBreakdown } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface GeminiSearchInput {
  storeName: string;
  storeInfo: string;
  foreignRatio: string;
  changeWillingness: string;
  areaContext?: {
    districtName: string;
    city: string;
    touristRank: string;
    foreignVisitorRatio: number;
    dailyFootTraffic: number;
  };
}

interface GeminiRawResult {
  business_type: string;
  platforms: {
    name: string;
    registered: boolean;
    score?: number;
    reviewCount?: number;
    hasPhotos?: boolean;
    hasEnglish?: boolean;
  }[];
  key_metrics: {
    label: string;
    value: string;
    status: "good" | "warning" | "critical";
    detail: string;
  }[];
  score_breakdown: {
    online_presence: number;
    review_status: number;
    visual_content: number;
    accessibility: number;
    k_potential: number;
    owner_readiness: number;
  };
  title: string;
  summary: string;
  improvements: string[];
  action_plan: string;
  potential: string;
}

export async function searchAndAnalyzeStore(
  input: GeminiSearchInput
): Promise<AnalysisResult | null> {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }] as never[],
    });

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

    const areaInfo = input.areaContext
      ? `\n참고 상권 데이터: ${input.areaContext.city} ${input.areaContext.districtName}, 관광등급 ${input.areaContext.touristRank}, 외국인 비율 ${Math.round(input.areaContext.foreignVisitorRatio * 100)}%, 일 유동인구 ${input.areaContext.dailyFootTraffic.toLocaleString()}명`
      : "";

    const prompt = `당신은 K-글로벌화 컨설팅 전문가입니다. 아래 매장을 실제로 웹 검색하여 분석해주세요.

## 매장 정보
- 사용자 입력: "${input.storeInfo}"
- 매장명: ${input.storeName}
- 현재 외국인 손님 비율: ${foreignRatioLabel[input.foreignRatio] || input.foreignRatio}
- 변화 의향: ${willLabel[input.changeWillingness] || input.changeWillingness}${areaInfo}

## 검색 지시
아래 플랫폼에서 "${input.storeName}"을 검색하세요:
1. **네이버 지도** — 등록 여부, 별점, 리뷰 수, 사진 여부, 영어 지원 여부
2. **카카오맵** — 등록 여부, 별점, 리뷰 수
3. **Google Maps** — 등록 여부, 별점, 리뷰 수, 영어 리뷰 존재 여부

검색 결과가 없으면 "미등록"으로 처리하세요. 추측하지 말고 검색 결과만 사용하세요.

## 분석 기준

### 점수 체계 (100점 만점)
- online_presence (0~20): 플랫폼 등록 수 × 4 + 영어 지원 플랫폼 수 × 1.5
- review_status (0~20): 평균 별점과 총 리뷰 수 기반
- visual_content (0~15): 사진 품질과 양, SNS 노출도 기반
- accessibility (0~20): 위치의 관광 접근성 (핵심 관광지=20, 준관광=15, 일반=10, 외곽=5)
- k_potential (0~15): 업종의 K-컬처 적합도 + 상권 외국인 수요
- owner_readiness (0~10): 변화 의향 기반 (적극적=10, 조건부=7, 소극적=3)

### 등급
- S: 85~100점 (K-화 황금 매장)
- A: 65~84점 (K-화 유망 매장)
- B: 45~64점 (K-화 가능 매장)
- C: 25~44점 (K-화 준비 단계)
- D: 0~24점 (재검토 필요)

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

{
  "business_type": "검색 결과로 파악한 업종 (카페, 음식점, 뷰티샵, 베이커리, 헤어샵 등)",
  "platforms": [
    {"name": "네이버 지도", "registered": true/false, "score": 별점(없으면 생략), "reviewCount": 리뷰수, "hasPhotos": true/false, "hasEnglish": true/false},
    {"name": "카카오맵", "registered": true/false, "score": 별점, "reviewCount": 리뷰수, "hasPhotos": true/false, "hasEnglish": false},
    {"name": "Google Maps", "registered": true/false, "score": 별점, "reviewCount": 리뷰수, "hasPhotos": true/false, "hasEnglish": true/false},
    {"name": "TripAdvisor", "registered": true/false, "score": 별점, "reviewCount": 리뷰수, "hasPhotos": true/false, "hasEnglish": true/false},
    {"name": "Instagram", "registered": true/false, "reviewCount": 해시태그게시물수, "hasPhotos": true, "hasEnglish": true/false}
  ],
  "key_metrics": [
    {"label": "네이버 평점", "value": "4.5", "status": "good/warning/critical", "detail": "상세 설명"},
    {"label": "Google Maps", "value": "4.2 또는 미등록", "status": "good/warning/critical", "detail": "상세 설명"},
    {"label": "외국어 지원", "value": "2/5", "status": "good/warning/critical", "detail": "상세 설명"},
    {"label": "SNS 노출", "value": "150건", "status": "good/warning/critical", "detail": "상세 설명"},
    {"label": "총 리뷰", "value": "350건", "status": "good/warning/critical", "detail": "상세 설명"}
  ],
  "score_breakdown": {
    "online_presence": 0~20,
    "review_status": 0~20,
    "visual_content": 0~15,
    "accessibility": 0~20,
    "k_potential": 0~15,
    "owner_readiness": 0~10
  },
  "title": "매장명을 포함한 임팩트 있는 한 줄 진단 (15자 이내)",
  "summary": "2~3문장으로 실제 검색 데이터 기반 진단. 구체적 수치 포함.",
  "improvements": ["실제 데이터 기반 구체적 개선 포인트 3개"],
  "action_plan": "이번 주 바로 실행할 수 있는 구체적 액션 1개",
  "potential": "3개월 후 구체적 수치 변화 예측"
}

주의사항:
- 검색으로 찾은 실제 데이터만 사용하세요.
- 검색 결과가 없는 플랫폼은 registered: false로 처리하세요.
- key_metrics의 status: 별점 4.0 이상 또는 양호="good", 보통="warning", 미흡="critical"
- improvements는 정확히 3개 작성하세요.
- 뻔한 일반론 금지. 이 매장의 실제 데이터에 기반한 구체적 조언만.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSON 파싱 (코드블록 제거)
    const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(jsonStr) as GeminiRawResult;

    // 유효성 검증
    if (!parsed.platforms || !parsed.score_breakdown || !parsed.title || !parsed.summary) {
      console.error("Gemini result validation failed:", parsed);
      return null;
    }

    if (!Array.isArray(parsed.improvements) || parsed.improvements.length === 0) {
      console.error("Gemini improvements validation failed:", parsed.improvements);
      return null;
    }

    // 점수 계산
    const breakdown: ScoreBreakdown = {
      online_presence: Math.min(20, Math.max(0, parsed.score_breakdown.online_presence)),
      review_status: Math.min(20, Math.max(0, parsed.score_breakdown.review_status)),
      visual_content: Math.min(15, Math.max(0, parsed.score_breakdown.visual_content)),
      accessibility: Math.min(20, Math.max(0, parsed.score_breakdown.accessibility)),
      k_potential: Math.min(15, Math.max(0, parsed.score_breakdown.k_potential)),
      owner_readiness: Math.min(10, Math.max(0, parsed.score_breakdown.owner_readiness)),
    };

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

    let grade: AnalysisResult["grade"] = "D";
    if (score >= 85) grade = "S";
    else if (score >= 65) grade = "A";
    else if (score >= 45) grade = "B";
    else if (score >= 25) grade = "C";

    const ctaMessages: Record<string, string> = {
      S: "K-BOOST 프리미엄 분석 받아보기",
      A: "K-BOOST 맞춤 전략 확인하기",
      B: "K-BOOST 시작 가이드 받기",
      C: "K-BOOST 무료 상담 받기",
      D: "K-BOOST 기본 진단 받기",
    };

    const platforms: PlatformInfo[] = (parsed.platforms || []).map((p) => ({
      name: p.name,
      registered: p.registered,
      score: p.score,
      reviewCount: p.reviewCount || 0,
      hasPhotos: p.hasPhotos,
      hasEnglish: p.hasEnglish,
    }));

    const keyMetrics: KeyMetric[] = (parsed.key_metrics || []).map((m) => ({
      label: m.label,
      value: m.value,
      status: m.status,
      detail: m.detail,
    }));

    return {
      grade,
      score,
      score_breakdown: breakdown,
      store_name: input.storeName,
      business_type: parsed.business_type || "매장",
      platforms,
      title: parsed.title,
      summary: parsed.summary,
      key_metrics: keyMetrics,
      improvements: parsed.improvements.slice(0, 3),
      action_plan: parsed.action_plan,
      potential: parsed.potential,
      cta_message: ctaMessages[grade],
    };
  } catch (error) {
    console.error("Gemini Search API error:", error);
    return null;
  }
}

// --- 플랫폼 API 데이터 기반 분석 (Google Search 없이, 토큰만 사용) ---

interface AnalyzeWithDataInput {
  storeName: string;
  storeInfo: string;
  businessType: string;
  address: string;
  phone: string;
  platforms: {
    name: string;
    registered: boolean;
    score?: number;
    reviewCount?: number;
    hasEnglish?: boolean;
  }[];
  naverCategory: string;
  kakaoCategory: string;
  foreignRatio: string;
  changeWillingness: string;
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
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  try {
    // Google Search 없이 분석만 수행 (thinking 토큰 제한으로 속도 향상)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 1024 },
      } as never,
    });

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
    {"label": "외국어 지원", "value": "0/5", "status": "good/warning/critical", "detail": "상세 설명"},
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

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonStr = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (!parsed.score_breakdown || !parsed.title || !parsed.summary) {
      console.error("Gemini analysis validation failed:", parsed);
      return null;
    }

    if (!Array.isArray(parsed.improvements) || parsed.improvements.length === 0) {
      console.error("Gemini improvements validation failed");
      return null;
    }

    const breakdown: ScoreBreakdown = {
      online_presence: Math.min(20, Math.max(0, parsed.score_breakdown.online_presence)),
      review_status: Math.min(20, Math.max(0, parsed.score_breakdown.review_status)),
      visual_content: Math.min(15, Math.max(0, parsed.score_breakdown.visual_content)),
      accessibility: Math.min(20, Math.max(0, parsed.score_breakdown.accessibility)),
      k_potential: Math.min(15, Math.max(0, parsed.score_breakdown.k_potential)),
      owner_readiness: Math.min(10, Math.max(0, parsed.score_breakdown.owner_readiness)),
    };

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

    let grade: AnalysisResult["grade"] = "D";
    if (score >= 85) grade = "S";
    else if (score >= 65) grade = "A";
    else if (score >= 45) grade = "B";
    else if (score >= 25) grade = "C";

    const ctaMessages: Record<string, string> = {
      S: "K-BOOST 프리미엄 분석 받아보기",
      A: "K-BOOST 맞춤 전략 확인하기",
      B: "K-BOOST 시작 가이드 받기",
      C: "K-BOOST 무료 상담 받기",
      D: "K-BOOST 기본 진단 받기",
    };

    const keyMetrics: KeyMetric[] = (parsed.key_metrics || []).map((m: { label: string; value: string; status: "good" | "warning" | "critical"; detail: string }) => ({
      label: m.label,
      value: m.value,
      status: m.status,
      detail: m.detail,
    }));

    return {
      grade,
      score,
      score_breakdown: breakdown,
      store_name: input.storeName,
      business_type: input.businessType,
      platforms: input.platforms.map((p) => ({
        name: p.name,
        registered: p.registered,
        score: p.score,
        reviewCount: p.reviewCount || 0,
        hasPhotos: p.registered,
        hasEnglish: p.hasEnglish || false,
      })),
      title: parsed.title,
      summary: parsed.summary,
      key_metrics: keyMetrics,
      improvements: parsed.improvements.slice(0, 3),
      action_plan: parsed.action_plan,
      potential: parsed.potential,
      cta_message: ctaMessages[grade],
    };
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return null;
  }
}
