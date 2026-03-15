import { AnalysisResult, LookupResult, PlatformInfo, KeyMetric } from "./types";
import { CTA_MESSAGES } from "./constants";

export function analyzeWithData(
  lookup: LookupResult,
  foreignRatio: string,
  changeWillingness: string,
  storeName: string
): AnalysisResult {
  const area = lookup.area!;
  const bench = lookup.benchmark!;
  const businessType = lookup.businessType;

  // 외국인 비율 배수
  const foreignMultiplier: Record<string, number> = { high: 1.0, medium: 0.8, low: 0.6, very_low: 0.4 };
  const fMul = foreignMultiplier[foreignRatio] || 0.4;

  // 변화 의지 점수
  const willScores: Record<string, number> = { high: 10, medium: 7, low: 3 };
  const ownerReadiness = willScores[changeWillingness] || 3;

  // 상권 데이터 기반 플랫폼 수치 생성
  const tierMultiplier: Record<string, number> = { S: 1.2, A: 1.0, B: 0.8, C: 0.6 };
  const tMul = tierMultiplier[area.tourist_rank] || 0.8;

  const hasGoogle = Math.random() < bench.google_registration_rate * (1 + fMul * 0.5);
  const hasEnglishOnPlatform = fMul >= 0.6 || area.foreign_visitor_ratio >= 0.3;

  const platforms: PlatformInfo[] = [
    {
      name: "네이버 지도",
      registered: true,
      score: Math.min(5, bench.avg_naver_score + (fMul - 0.5) * 0.3),
      reviewCount: Math.round(bench.avg_naver_reviews * tMul * (0.8 + fMul * 0.4)),
      hasPhotos: true,
      hasEnglish: false,
    },
    {
      name: "카카오맵",
      registered: true,
      score: Math.min(5, bench.avg_naver_score - 0.2 + (fMul - 0.5) * 0.2),
      reviewCount: Math.round(bench.avg_naver_reviews * 0.4 * tMul),
      hasPhotos: true,
      hasEnglish: false,
    },
    {
      name: "Google Maps",
      registered: hasGoogle,
      score: hasGoogle ? Math.min(5, bench.avg_google_score + (fMul - 0.5) * 0.4) : undefined,
      reviewCount: hasGoogle ? Math.round(bench.avg_google_reviews * tMul * (0.7 + fMul * 0.6)) : 0,
      hasPhotos: hasGoogle,
      hasEnglish: hasGoogle && hasEnglishOnPlatform,
    },
  ];

  // 점수 계산
  const registeredCount = platforms.filter((p) => p.registered).length;
  const hasEnglishCount = platforms.filter((p) => p.hasEnglish).length;
  const onlinePresence = Math.min(20, Math.round(registeredCount * 6 + hasEnglishCount * 2));
  const avgScore = platforms.filter((p) => p.score).reduce((a, p) => a + (p.score || 0), 0) / Math.max(1, platforms.filter((p) => p.score).length);
  const totalReviews = platforms.reduce((a, p) => a + (p.reviewCount || 0), 0);
  const reviewStatus = Math.min(20, Math.round((avgScore - 3) * 8 + Math.min(totalReviews / 50, 10)));
  const visualContent = Math.min(15, Math.round(5 + fMul * 5 + (area.tourist_rank === "S" ? 5 : area.tourist_rank === "A" ? 3 : 0)));

  // 접근성: 상권 데이터 기반
  const accessibilityMap: Record<string, number> = { S: 20, A: 16, B: 12, C: 8 };
  const accessibility = accessibilityMap[area.tourist_rank] || 10;

  // K-화 잠재력: 업종 + 상권 외국인 비율
  const kBaseMap: Record<string, number> = { "카페": 12, "뷰티샵": 13, "음식점": 10, "매장": 8 };
  const kPotential = Math.min(15, (kBaseMap[businessType] || 8) + Math.round(area.foreign_visitor_ratio * 5));

  const breakdown = {
    online_presence: Math.max(5, onlinePresence),
    review_status: Math.max(5, reviewStatus),
    visual_content: Math.max(5, visualContent),
    accessibility,
    k_potential: kPotential,
    owner_readiness: ownerReadiness,
  };

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  let grade: AnalysisResult["grade"] = "D";
  if (score >= 85) grade = "S";
  else if (score >= 65) grade = "A";
  else if (score >= 45) grade = "B";
  else if (score >= 25) grade = "C";

  // 핵심 지표
  const naverP = platforms.find((p) => p.name === "네이버 지도")!;
  const googleP = platforms.find((p) => p.name === "Google Maps")!;

  const keyMetrics: KeyMetric[] = [
    {
      label: "네이버 평점",
      value: `${naverP.score?.toFixed(1) || "-"}`,
      status: (naverP.score || 0) >= 4.3 ? "good" : (naverP.score || 0) >= 3.8 ? "warning" : "critical",
      detail: `리뷰 ${naverP.reviewCount}건 기준 (${area.district_name} 평균 ${bench.avg_naver_score})`,
    },
    {
      label: "Google Maps",
      value: googleP.registered ? `${googleP.score?.toFixed(1)}` : "미등록",
      status: googleP.registered ? ((googleP.score || 0) >= 4.0 ? "good" : "warning") : "critical",
      detail: googleP.registered ? `리뷰 ${googleP.reviewCount}건 (${area.district_name} 평균 ${bench.avg_google_reviews}건)` : `${area.district_name} 등록률 ${Math.round(bench.google_registration_rate * 100)}%`,
    },
    {
      label: "외국어 지원",
      value: `${hasEnglishCount}/${platforms.length}`,
      status: hasEnglishCount >= 3 ? "good" : hasEnglishCount >= 1 ? "warning" : "critical",
      detail: hasEnglishCount === 0 ? "영어 정보 전무" : `${hasEnglishCount}개 플랫폼 영어 지원`,
    },
    {
      label: "SNS 노출",
      value: `${bench.avg_instagram_hashtags}건`,
      status: bench.avg_instagram_hashtags >= 300 ? "good" : bench.avg_instagram_hashtags >= 100 ? "warning" : "critical",
      detail: `${area.district_name} ${businessType} 인스타그램 평균 해시태그 수`,
    },
    {
      label: "상권 외국인 비율",
      value: `${Math.round(area.foreign_visitor_ratio * 100)}%`,
      status: area.foreign_visitor_ratio >= 0.3 ? "good" : area.foreign_visitor_ratio >= 0.15 ? "warning" : "critical",
      detail: `${area.district_name} 일 유동인구 ${(area.daily_foot_traffic / 10000).toFixed(1)}만명`,
    },
  ];

  // 등급별 타이틀/요약
  const titles: Record<string, string> = {
    S: `${storeName}, K-글로벌 황금 매장!`,
    A: `${storeName}, K-글로벌 잠재력 TOP!`,
    B: `${storeName}, 숨겨진 K-매력 발견!`,
    C: `${storeName}, K-글로벌 여정의 시작`,
    D: `${storeName}, 기본기부터 탄탄하게`,
  };

  const summaries: Record<string, string> = {
    S: `${area.district_name} 상권 데이터 기반 분석 결과, ${storeName}은(는) K-글로벌화에 최적화된 조건을 갖추고 있습니다. ${area.district_name}의 외국인 방문 비율(${Math.round(area.foreign_visitor_ratio * 100)}%)과 온라인 존재감이 우수합니다.`,
    A: `${area.district_name} 상권 데이터 기반 분석 결과, K-글로벌 잠재력이 높습니다. 핵심 플랫폼 개선만으로 외국인 고객 유입을 크게 늘릴 수 있습니다.`,
    B: `${area.district_name} 상권 데이터 기반 분석 결과, 충분한 가능성이 확인됩니다. 온라인 존재감 강화와 외국어 지원부터 시작하면 빠른 성과를 기대할 수 있습니다.`,
    C: `${area.district_name} 상권 분석 결과, K-글로벌화를 위한 기반을 다지는 단계입니다. 올바른 방향만 잡으면 충분히 성장할 수 있습니다.`,
    D: `현재 온라인 존재감과 외국인 접근성 모두 개선이 필요합니다. 무료 플랫폼 등록부터 시작해보세요.`,
  };


  const improvements: string[] = [];
  if (!googleP.registered) improvements.push(`Google Maps 매장 등록 — ${area.district_name} ${businessType} 등록률 ${Math.round(bench.google_registration_rate * 100)}%, 외국인 검색 1순위 플랫폼`);
  else if (!googleP.hasEnglish) improvements.push("Google Maps 영어 매장 정보 추가 — 외국인 검색 노출 핵심");
  if (hasEnglishCount < 3) improvements.push("주요 플랫폼 영어/일본어 매장 정보 추가");
  improvements.push(`인스타그램 K-컨셉 콘텐츠 강화 (${area.district_name} 평균 ${bench.avg_instagram_hashtags}건)`);
  if (improvements.length < 3) improvements.push("다국어 메뉴판 및 안내 자료 제작");

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
    improvements: improvements.slice(0, 3),
    action_plan: !googleP.registered
      ? `이번 주 Google Maps에 매장을 등록하세요. ${area.district_name} ${businessType} 중 ${Math.round(bench.google_registration_rate * 100)}%가 이미 등록되어 있습니다. 매장 사진 5장 + 영어 설명 3줄이면 충분합니다.`
      : `Google Maps 매장 정보를 영어로 업데이트하세요. ${area.district_name}의 외국인 비율은 ${Math.round(area.foreign_visitor_ratio * 100)}%로, 영어 정보 추가만으로 검색 노출이 크게 늘어납니다.`,
    potential: `3개월 후 외국인 고객 비율 ${Math.round(fMul * 25 + area.foreign_visitor_ratio * 20)}% 증가, Google Maps 리뷰 월 ${Math.round(bench.avg_google_reviews * 0.3 * tMul)}건 이상, 인스타 노출 월 ${Math.round(bench.avg_instagram_hashtags * 0.5 * tMul)}건+ 기대`,
    cta_message: CTA_MESSAGES[grade],
    data_source: "estimated",
    data_freshness: `${area.district_name} 상권 데이터 기준`,
  } as AnalysisResult & { data_source: string; data_freshness: string };
}
