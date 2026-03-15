import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { QUESTIONS } from "@/lib/questions";
import { QuizAnswers, AnalysisResult, PlatformInfo, KeyMetric } from "@/lib/types";
import { lookupStore } from "@/lib/data-lookup";
import { analyzeWithData } from "@/lib/analyze-with-data";

function generateMockResult(answers: QuizAnswers): AnalysisResult {
  const storeInfo = answers.store_info || "";
  const storeInfoLower = storeInfo.toLowerCase();

  // 매장명 추출 (쉼표 또는 공백 기준 첫 단어)
  const storeName = storeInfo.split(/[,，]/)[0].trim() || storeInfo.trim();

  // 위치 기반 점수
  const hotSpots = ["홍대", "이태원", "명동", "강남", "성수", "을지로", "북촌", "해운대", "경복궁", "익선동", "연남"];
  const warmSpots = ["신촌", "건대", "잠실", "동대문", "인사동", "경리단길", "이태원", "한남", "압구정"];
  let accessibilityScore = 10;
  if (hotSpots.some((s) => storeInfoLower.includes(s))) accessibilityScore = 20;
  else if (warmSpots.some((s) => storeInfoLower.includes(s))) accessibilityScore = 15;

  // 업종 추론 (매장명/위치 키워드 기반)
  const cafeKeywords = ["카페", "cafe", "커피", "coffee", "디저트", "베이커리", "빵"];
  const beautyKeywords = ["뷰티", "헤어", "네일", "salon", "미용"];
  const foodKeywords = ["식당", "레스토랑", "고기", "치킨", "국수", "밥", "한식", "일식", "중식"];

  let businessType = "매장";
  let kPotentialScore = 8;
  if (cafeKeywords.some((k) => storeInfoLower.includes(k))) {
    businessType = "카페";
    kPotentialScore = 15;
  } else if (beautyKeywords.some((k) => storeInfoLower.includes(k))) {
    businessType = "뷰티샵";
    kPotentialScore = 13;
  } else if (foodKeywords.some((k) => storeInfoLower.includes(k))) {
    businessType = "음식점";
    kPotentialScore = 10;
  }

  // 외국인 비율 → 리뷰/온라인 점수 보정
  const foreignRatio = answers.foreign_ratio || "very_low";
  const foreignMultiplier: Record<string, number> = { high: 1.0, medium: 0.8, low: 0.6, very_low: 0.4 };
  const fMul = foreignMultiplier[foreignRatio] || 0.4;

  // 변화 의지
  const willingness = answers.change_willingness || "low";
  const willScores: Record<string, number> = { high: 10, medium: 7, low: 3 };
  const ownerReadiness = willScores[willingness] || 3;

  // 플랫폼 분석 Mock
  const isHotLocation = accessibilityScore >= 15;
  const hasGoodPresence = fMul >= 0.6;

  const platforms: PlatformInfo[] = [
    {
      name: "네이버 지도",
      registered: true,
      score: 3.8 + Math.round(fMul * 12) / 10,
      reviewCount: Math.round(30 + fMul * 200 + (isHotLocation ? 100 : 0)),
      hasPhotos: true,
      hasEnglish: false,
    },
    {
      name: "카카오맵",
      registered: true,
      score: 3.7 + Math.round(fMul * 10) / 10,
      reviewCount: Math.round(10 + fMul * 80),
      hasPhotos: true,
      hasEnglish: false,
    },
    {
      name: "Google Maps",
      registered: hasGoodPresence,
      score: hasGoodPresence ? 3.5 + Math.round(fMul * 15) / 10 : undefined,
      reviewCount: hasGoodPresence ? Math.round(5 + fMul * 50) : 0,
      hasPhotos: hasGoodPresence,
      hasEnglish: hasGoodPresence && fMul >= 0.8,
    },
    {
      name: "TripAdvisor",
      registered: fMul >= 0.8,
      score: fMul >= 0.8 ? 3.5 + Math.round(fMul * 10) / 10 : undefined,
      reviewCount: fMul >= 0.8 ? Math.round(fMul * 30) : 0,
      hasPhotos: fMul >= 0.8,
      hasEnglish: fMul >= 0.8,
    },
    {
      name: "Instagram",
      registered: true,
      reviewCount: Math.round(50 + fMul * 300 + (isHotLocation ? 200 : 0)),
      hasPhotos: true,
      hasEnglish: fMul >= 0.6,
    },
  ];

  // 점수 계산
  const registeredCount = platforms.filter((p) => p.registered).length;
  const hasEnglishCount = platforms.filter((p) => p.hasEnglish).length;
  const onlinePresence = Math.min(20, Math.round(registeredCount * 4 + hasEnglishCount * 1.5));
  const avgScore = platforms.filter((p) => p.score).reduce((a, p) => a + (p.score || 0), 0) / Math.max(1, platforms.filter((p) => p.score).length);
  const totalReviews = platforms.reduce((a, p) => a + (p.reviewCount || 0), 0);
  const reviewStatus = Math.min(20, Math.round((avgScore - 3) * 8 + Math.min(totalReviews / 50, 10)));
  const visualContent = Math.min(15, Math.round(5 + fMul * 5 + (isHotLocation ? 5 : 0)));

  const breakdown = {
    online_presence: Math.max(5, onlinePresence),
    review_status: Math.max(5, reviewStatus),
    visual_content: Math.max(5, visualContent),
    accessibility: accessibilityScore,
    k_potential: kPotentialScore,
    owner_readiness: ownerReadiness,
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  let grade: AnalysisResult["grade"] = "D";
  if (score >= 85) grade = "S";
  else if (score >= 65) grade = "A";
  else if (score >= 45) grade = "B";
  else if (score >= 25) grade = "C";

  // 수치 기반 핵심 지표
  const naverPlatform = platforms.find((p) => p.name === "네이버 지도")!;
  const googlePlatform = platforms.find((p) => p.name === "Google Maps")!;
  const instaPlatform = platforms.find((p) => p.name === "Instagram")!;

  const keyMetrics: KeyMetric[] = [
    {
      label: "네이버 평점",
      value: `${naverPlatform.score?.toFixed(1) || "-"}`,
      status: (naverPlatform.score || 0) >= 4.3 ? "good" : (naverPlatform.score || 0) >= 3.8 ? "warning" : "critical",
      detail: `리뷰 ${naverPlatform.reviewCount}건 기준`,
    },
    {
      label: "Google Maps",
      value: googlePlatform.registered ? `${googlePlatform.score?.toFixed(1)}` : "미등록",
      status: googlePlatform.registered ? ((googlePlatform.score || 0) >= 4.0 ? "good" : "warning") : "critical",
      detail: googlePlatform.registered ? `리뷰 ${googlePlatform.reviewCount}건` : "외국인 접근 불가",
    },
    {
      label: "외국어 지원",
      value: `${hasEnglishCount}/${platforms.length}`,
      status: hasEnglishCount >= 3 ? "good" : hasEnglishCount >= 1 ? "warning" : "critical",
      detail: hasEnglishCount === 0 ? "영어 정보 전무" : `${hasEnglishCount}개 플랫폼 영어 지원`,
    },
    {
      label: "SNS 노출",
      value: `${instaPlatform.reviewCount}건`,
      status: (instaPlatform.reviewCount || 0) >= 300 ? "good" : (instaPlatform.reviewCount || 0) >= 100 ? "warning" : "critical",
      detail: "인스타그램 관련 게시물",
    },
    {
      label: "총 리뷰 수",
      value: `${totalReviews}건`,
      status: totalReviews >= 300 ? "good" : totalReviews >= 100 ? "warning" : "critical",
      detail: "전체 플랫폼 합산",
    },
  ];

  // 등급별 컨텐츠
  const titles: Record<string, string> = {
    S: `${storeName}, K-글로벌 황금 매장!`,
    A: `${storeName}, K-글로벌 잠재력 TOP!`,
    B: `${storeName}, 숨겨진 K-매력 발견!`,
    C: `${storeName}, K-글로벌 여정의 시작`,
    D: `${storeName}, 기본기부터 탄탄하게`,
  };

  const summaries: Record<string, string> = {
    S: `${platforms.length}개 플랫폼 분석 결과, ${storeName}은(는) 이미 K-글로벌화에 최적화된 조건을 갖추고 있습니다. 온라인 존재감과 리뷰 현황이 우수하며, 강한 변화 의지까지 갖추셨습니다.`,
    A: `${platforms.length}개 플랫폼 분석 결과, K-글로벌 잠재력이 매우 높습니다. 핵심 플랫폼 개선만으로 외국인 고객 유입을 크게 늘릴 수 있습니다.`,
    B: `${platforms.length}개 플랫폼 분석 결과, 충분한 가능성이 확인됩니다. 온라인 존재감 강화와 외국어 지원부터 시작하면 빠른 성과를 기대할 수 있습니다.`,
    C: `${platforms.length}개 플랫폼 분석 결과, 아직 K-글로벌화를 위한 기반을 다지는 단계입니다. 하지만 올바른 방향만 잡으면 충분히 성장할 수 있습니다.`,
    D: `현재 온라인 존재감과 외국인 접근성 모두 개선이 필요합니다. 무료 플랫폼 등록부터 시작해보세요.`,
  };

  const ctaMessages: Record<string, string> = {
    S: "K-BOOST 프리미엄 분석 받아보기",
    A: "K-BOOST 맞춤 전략 확인하기",
    B: "K-BOOST 시작 가이드 받기",
    C: "K-BOOST 무료 상담 받기",
    D: "K-BOOST 기본 진단 받기",
  };

  return {
    grade,
    score,
    score_breakdown: breakdown,
    store_name: storeName,
    business_type: businessType,
    platforms,
    title: titles[grade],
    summary: summaries[grade],
    key_metrics: keyMetrics,
    improvements: [
      !googlePlatform.registered
        ? "Google Maps 매장 등록 및 영어 정보 입력"
        : "Google Maps 영어 리뷰 수 확대 (리뷰 카드 비치)",
      hasEnglishCount < 3
        ? "주요 플랫폼 영어/일본어 매장 정보 추가"
        : "다국어 메뉴판 및 안내 자료 제작",
      (instaPlatform.reviewCount || 0) < 200
        ? "인스타그램 K-컨셉 콘텐츠 제작 (해시태그 전략)"
        : "TripAdvisor 등록 및 외국인 리뷰 유도",
    ],
    action_plan: !googlePlatform.registered
      ? "이번 주 Google Maps에 매장을 등록하세요. 무료이고, 외국인이 가장 먼저 검색하는 플랫폼입니다. 매장 사진 5장 + 영어 설명 3줄이면 충분합니다."
      : "이번 주 Google Maps 매장 정보를 영어로 업데이트하세요. 영업시간, 메뉴 설명, 사진을 추가하면 외국인 검색 노출이 즉시 늘어납니다.",
    potential: `3개월 후 외국인 고객 비율 ${Math.round(fMul * 30 + 10)}% 증가, Google Maps 영어 리뷰 월 ${Math.round(10 + fMul * 30)}건 이상, 인스타 해시태그 노출 월 ${Math.round(200 + fMul * 500)}건+ 기대`,
    cta_message: ctaMessages[grade],
  };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const { answers } = (await request.json()) as { answers: QuizAnswers };

    // 필수 질문 검증
    const requiredFields = QUESTIONS.map((q) => q.id);
    const missing = requiredFields.filter((id) => {
      const val = answers[id];
      return !val || val.trim() === "";
    });

    if (missing.length > 0) {
      return NextResponse.json(
        { error: "모든 질문에 답변해주세요.", missing },
        { status: 400 }
      );
    }

    // 1단계: 로컬 데이터 조회 시도
    const storeInfo = answers.store_info || "";
    const storeName = storeInfo.split(/[,，]/)[0].trim() || storeInfo.trim();
    const lookup = await lookupStore(storeInfo);

    if (lookup.matchType !== "mock") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return NextResponse.json(
        analyzeWithData(lookup, answers.foreign_ratio || "very_low", answers.change_willingness || "low", storeName)
      );
    }

    // 2단계: API 키가 없으면 Mock 데이터 반환
    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return NextResponse.json(generateMockResult(answers));
    }

    // 3단계: Claude API 호출
    const userMsg = QUESTIONS.map((q) => {
      const ans = answers[q.id];
      if (q.type === "text") return `[${q.question}]\n답변: ${ans}`;
      const opt = q.options?.find((o) => o.value === ans);
      return `[${q.question}]\n답변: ${opt?.label || ans}`;
    }).join("\n\n");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Anthropic API error:", errorData);
      return NextResponse.json(
        { error: "AI 분석 중 오류가 발생했습니다." },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text = data.content?.map((c: { text?: string }) => c.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Analysis error:", e);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
