import { AreaData, LookupResult } from "./types";
import aliasesData from "@/data/_aliases.json";
import indexData from "@/data/_index.json";

// 벤치마크 데이터
import cafeBench from "@/data/benchmarks/cafe.json";
import restaurantBench from "@/data/benchmarks/restaurant.json";
import beautyBench from "@/data/benchmarks/beauty.json";
import defaultBench from "@/data/benchmarks/default.json";

// 지역 데이터 (전체 로드)
import seoulHongdae from "@/data/areas/seoul-hongdae.json";
import seoulItaewon from "@/data/areas/seoul-itaewon.json";
import seoulMyeongdong from "@/data/areas/seoul-myeongdong.json";
import seoulGangnam from "@/data/areas/seoul-gangnam.json";
import seoulSeongsu from "@/data/areas/seoul-seongsu.json";
import seoulEuljiro from "@/data/areas/seoul-euljiro.json";
import seoulBukchon from "@/data/areas/seoul-bukchon.json";
import seoulIkseon from "@/data/areas/seoul-ikseon.json";
import seoulYeonnam from "@/data/areas/seoul-yeonnam.json";
import seoulHannam from "@/data/areas/seoul-hannam.json";
import seoulApgujeong from "@/data/areas/seoul-apgujeong.json";
import seoulSinchon from "@/data/areas/seoul-sinchon.json";
import seoulKondae from "@/data/areas/seoul-kondae.json";
import seoulJamsil from "@/data/areas/seoul-jamsil.json";
import seoulDongdaemun from "@/data/areas/seoul-dongdaemun.json";
import seoulInsadong from "@/data/areas/seoul-insadong.json";
import seoulGyeongnidan from "@/data/areas/seoul-gyeongnidan.json";
import seoulMangwon from "@/data/areas/seoul-mangwon.json";
import seoulSeochon from "@/data/areas/seoul-seochon.json";
import seoulYeouido from "@/data/areas/seoul-yeouido.json";
import busanHaeundae from "@/data/areas/busan-haeundae.json";
import busanSeomyeon from "@/data/areas/busan-seomyeon.json";
import gyeongju from "@/data/areas/gyeongju.json";
import jeonjuHanok from "@/data/areas/jeonju-hanok.json";
import jejuCity from "@/data/areas/jeju-city.json";
import jejuSeogwipo from "@/data/areas/jeju-seogwipo.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const AREA_MAP: Record<string, AreaData> = Object.fromEntries(
  Object.entries({
    "seoul-hongdae": seoulHongdae,
    "seoul-itaewon": seoulItaewon,
    "seoul-myeongdong": seoulMyeongdong,
    "seoul-gangnam": seoulGangnam,
    "seoul-seongsu": seoulSeongsu,
    "seoul-euljiro": seoulEuljiro,
    "seoul-bukchon": seoulBukchon,
    "seoul-ikseon": seoulIkseon,
    "seoul-yeonnam": seoulYeonnam,
    "seoul-hannam": seoulHannam,
    "seoul-apgujeong": seoulApgujeong,
    "seoul-sinchon": seoulSinchon,
    "seoul-kondae": seoulKondae,
    "seoul-jamsil": seoulJamsil,
    "seoul-dongdaemun": seoulDongdaemun,
    "seoul-insadong": seoulInsadong,
    "seoul-gyeongnidan": seoulGyeongnidan,
    "seoul-mangwon": seoulMangwon,
    "seoul-seochon": seoulSeochon,
    "seoul-yeouido": seoulYeouido,
    "busan-haeundae": busanHaeundae,
    "busan-seomyeon": busanSeomyeon,
    "gyeongju": gyeongju,
    "jeonju-hanok": jeonjuHanok,
    "jeju-city": jejuCity,
    "jeju-seogwipo": jejuSeogwipo,
  }).map(([k, v]) => [k, v as any])
);
/* eslint-enable @typescript-eslint/no-explicit-any */

const aliases = aliasesData as Record<string, string>;
const _index = indexData;

// 업종 추론 키워드
const BUSINESS_KEYWORDS: Record<string, string[]> = {
  "카페": ["카페", "cafe", "커피", "coffee", "디저트", "베이커리", "빵", "브런치"],
  "음식점": ["식당", "레스토랑", "고기", "치킨", "국수", "밥", "한식", "일식", "중식", "횟집", "회", "분식", "떡볶이", "삼겹살", "갈비", "냉면"],
  "뷰티샵": ["뷰티", "헤어", "네일", "salon", "미용", "클리닉", "피부", "에스테틱"],
};

const BENCH_MAP: Record<string, typeof cafeBench> = {
  "카페": cafeBench,
  "음식점": restaurantBench,
  "뷰티샵": beautyBench,
};

function inferBusinessType(text: string): string {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(BUSINESS_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return type;
  }
  return "매장";
}

function findAreaFromText(text: string): AreaData | undefined {
  // 별칭에서 매칭 (긴 키워드 우선 매칭)
  const sortedAliases = Object.keys(aliases).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    if (text.includes(alias)) {
      const districtId = aliases[alias];
      return AREA_MAP[districtId];
    }
  }
  return undefined;
}

function getBenchmark(businessType: string, tier: string) {
  const bench = BENCH_MAP[businessType] || defaultBench;
  const tierData = bench.tiers[tier as keyof typeof bench.tiers];
  return tierData || bench.tiers["B"];
}

export function lookupStore(storeInfo: string): LookupResult {
  const businessType = inferBusinessType(storeInfo);

  // TODO: Phase 2에서 _index.json의 stores 배열에서 정확한 매장 매칭 추가
  // const exactStore = findExactStore(storeInfo);

  // 상권 매칭
  const area = findAreaFromText(storeInfo);

  if (area) {
    const benchmark = getBenchmark(businessType, area.tourist_rank);
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

export { _index, AREA_MAP };
