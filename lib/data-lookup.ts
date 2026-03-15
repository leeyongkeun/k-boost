import { AreaData, BenchmarkTierData, LookupResult } from "./types";
import { supabase } from "./supabase";

// 업종 추론 키워드 (세분화된 업종 우선 매칭 → 상위 카테고리 fallback)
const BUSINESS_KEYWORDS: Record<string, string[]> = {
  "베이커리": ["베이커리", "빵집", "빵", "bakery", "제과", "브레드"],
  "네일샵": ["네일", "nail", "젤네일", "네일아트"],
  "헤어샵": ["헤어", "hair", "미용실", "미용", "salon", "펌", "염색", "바버샵", "바버"],
  "클리닉": ["클리닉", "피부과", "피부", "에스테틱", "성형", "의원", "병원"],
  "한식당": ["한식", "한정식", "국밥", "설렁탕", "삼겹살", "갈비", "비빔밥", "불고기", "찌개", "냉면", "칼국수", "보쌈", "족발"],
  "일식": ["일식", "초밥", "스시", "sushi", "라멘", "ramen", "이자카야", "우동", "돈카츠", "오마카세"],
  "중식": ["중식", "중국집", "짜장", "짬뽕", "탕수육", "마라", "마라탕", "훠궈"],
  "양식": ["양식", "파스타", "pasta", "피자", "pizza", "스테이크", "steak", "버거", "burger", "브런치"],
  "주점": ["주점", "술집", "바", "bar", "pub", "이자카야", "호프", "포차", "와인바", "칵테일"],
  "숙박": ["숙박", "호텔", "hotel", "모텔", "게스트하우스", "guesthouse", "민박", "펜션", "에어비앤비", "hostel", "호스텔"],
  "소품샵": ["소품", "편집샵", "잡화", "문구", "액세서리", "공방", "핸드메이드"],
  "카페": ["카페", "cafe", "커피", "coffee", "디저트", "브런치카페"],
  "음식점": ["식당", "레스토랑", "고기", "치킨", "국수", "밥", "횟집", "회", "분식", "떡볶이", "맛집", "밥집"],
  "뷰티샵": ["뷰티", "beauty", "왁싱", "속눈썹", "태닝"],
};

function inferBusinessType(text: string): string {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(BUSINESS_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return type;
  }
  return "매장";
}

async function findAreaFromText(text: string): Promise<AreaData | undefined> {
  // 별칭 테이블에서 매칭 (긴 키워드 우선)
  const { data: aliases } = await supabase
    .from("area_aliases")
    .select("alias, district_id")
    .order("alias");

  if (!aliases) return undefined;

  // 긴 별칭부터 매칭
  const sorted = aliases.sort((a, b) => b.alias.length - a.alias.length);
  for (const { alias, district_id } of sorted) {
    if (text.includes(alias)) {
      const { data: area } = await supabase
        .from("areas")
        .select("*")
        .eq("district_id", district_id)
        .single();

      if (area) {
        return {
          district_id: area.district_id,
          district_name: area.district_name,
          city: area.city,
          tourist_rank: area.tourist_rank,
          foreign_visitor_ratio: area.foreign_visitor_ratio,
          daily_foot_traffic: area.daily_foot_traffic,
          popular_business_types: area.popular_business_types,
          nearby_landmarks: area.nearby_landmarks,
          google_maps_search_volume: area.google_maps_search_volume,
          avg_naver_review_count: area.avg_naver_review_count,
          avg_google_review_count: area.avg_google_review_count,
          competitor_density: area.competitor_density,
        };
      }
    }
  }
  return undefined;
}

async function getBenchmark(businessType: string, tier: string): Promise<BenchmarkTierData> {
  // DB에서 해당 업종+등급 벤치마크 조회
  const { data } = await supabase
    .from("benchmarks")
    .select("*")
    .eq("business_type", businessType)
    .eq("district_tier", tier)
    .single();

  if (data) {
    return {
      avg_naver_score: data.avg_naver_score,
      avg_naver_reviews: data.avg_naver_reviews,
      avg_google_score: data.avg_google_score,
      avg_google_reviews: data.avg_google_reviews,
      avg_instagram_hashtags: data.avg_instagram_hashtags,
      google_registration_rate: data.google_registration_rate,
      tripadvisor_registration_rate: data.tripadvisor_registration_rate,
      english_support_rate: data.english_support_rate,
    };
  }

  // fallback: 기본 업종의 B등급
  const { data: fallback } = await supabase
    .from("benchmarks")
    .select("*")
    .eq("business_type", "매장")
    .eq("district_tier", "B")
    .single();

  return {
    avg_naver_score: fallback?.avg_naver_score ?? 3.8,
    avg_naver_reviews: fallback?.avg_naver_reviews ?? 50,
    avg_google_score: fallback?.avg_google_score ?? 3.5,
    avg_google_reviews: fallback?.avg_google_reviews ?? 5,
    avg_instagram_hashtags: fallback?.avg_instagram_hashtags ?? 300,
    google_registration_rate: fallback?.google_registration_rate ?? 0.2,
    tripadvisor_registration_rate: fallback?.tripadvisor_registration_rate ?? 0.02,
    english_support_rate: fallback?.english_support_rate ?? 0.05,
  };
}

export async function lookupStore(storeInfo: string): Promise<LookupResult> {
  const businessType = inferBusinessType(storeInfo);

  // 상권 매칭
  const area = await findAreaFromText(storeInfo);

  if (area) {
    const benchmark = await getBenchmark(businessType, area.tourist_rank);
    return {
      matchType: "area_benchmark",
      area,
      benchmark,
      businessType,
      confidence: 0.7,
    };
  }

  // 매칭 실패 → Mock fallback
  return {
    matchType: "mock",
    businessType,
    confidence: 0,
  };
}
