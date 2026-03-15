import { supabase } from "./supabase";
import { PlatformSearchResult } from "./platform-search";

interface SaveSearchParams {
  searchKeyword: string;
  foreignRatio: string;
  changeWillingness: string;
  platformData: PlatformSearchResult;
  grade?: string;
  score?: number;
}

/** fire-and-forget: 검색 결과를 search_results 테이블에 저장 */
export function saveSearchResult(params: SaveSearchParams): void {
  const { platformData } = params;

  const naver = platformData.platforms.find((p) => p.name === "네이버 지도");
  const kakao = platformData.platforms.find((p) => p.name === "카카오맵");
  const google = platformData.platforms.find((p) => p.name === "Google Maps");

  supabase
    .from("search_results")
    .insert({
      // 사용자 입력
      search_keyword: params.searchKeyword,
      foreign_ratio: params.foreignRatio,
      change_willingness: params.changeWillingness,

      // 매장 기본 정보
      store_name: platformData.storeName,
      business_type: platformData.businessType,
      address: platformData.address,
      phone: platformData.phone || null,
      instagram_url: platformData.instagramUrl || null,

      // 네이버
      naver_registered: naver?.registered ?? false,
      naver_category: platformData.naverCategory || null,
      naver_link: naver?.link || null,
      naver_address: platformData.naverRaw?.address || null,
      naver_road_address: platformData.naverRaw?.roadAddress || null,
      naver_mapx: platformData.naverRaw?.mapx || null,
      naver_mapy: platformData.naverRaw?.mapy || null,
      naver_raw: platformData.naverRaw || null,

      // 카카오
      kakao_registered: kakao?.registered ?? false,
      kakao_category: platformData.kakaoCategory || null,
      kakao_place_url: kakao?.link || null,
      kakao_address: platformData.kakaoRaw?.address_name || null,
      kakao_road_address: platformData.kakaoRaw?.road_address_name || null,
      kakao_x: platformData.kakaoRaw?.x || null,
      kakao_y: platformData.kakaoRaw?.y || null,
      kakao_raw: platformData.kakaoRaw || null,

      // Google
      google_registered: google?.registered ?? false,
      google_rating: google?.score || null,
      google_review_count: google?.reviewCount ?? 0,
      google_has_photos: google?.hasPhotos ?? false,
      google_has_english: google?.hasEnglish ?? false,
      google_address: platformData.googleRaw?.formattedAddress || null,
      google_raw: platformData.googleRaw || null,

      // 분석 결과
      grade: params.grade || null,
      score: params.score || null,
    })
    .then(({ error }) => {
      if (error) {
        console.error("[save-search-result] Failed to save:", error.message);
      } else {
        console.log("[save-search-result] Saved:", params.searchKeyword);
      }
    });
}

const CACHE_TTL_DAYS = 7;

/** 캐시 조회: 같은 keyword로 7일 이내 검색 결과가 있으면 반환 */
export async function getCachedResult(searchKeyword: string): Promise<PlatformSearchResult | null> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CACHE_TTL_DAYS);

  const { data, error } = await supabase
    .from("search_results")
    .select("*")
    .eq("search_keyword", searchKeyword)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[save-search-result] Cache lookup error:", error.message);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const row = data[0];
  console.log("[save-search-result] Cache HIT for:", searchKeyword);

  // DB row → PlatformSearchResult 복원
  return {
    storeName: row.store_name || "",
    businessType: row.business_type || "",
    address: row.address || "",
    phone: row.phone || "",
    naverCategory: row.naver_category || "",
    kakaoCategory: row.kakao_category || "",
    instagramUrl: row.instagram_url || undefined,
    naverRaw: row.naver_raw || null,
    kakaoRaw: row.kakao_raw || null,
    googleRaw: row.google_raw || null,
    platforms: [
      {
        name: "네이버 지도",
        registered: row.naver_registered ?? false,
        reviewCount: 0,
        hasPhotos: row.naver_registered ?? false,
        hasEnglish: false,
        link: row.naver_link || undefined,
        category: row.naver_category || undefined,
      },
      {
        name: "카카오맵",
        registered: row.kakao_registered ?? false,
        reviewCount: 0,
        hasPhotos: row.kakao_registered ?? false,
        hasEnglish: false,
        link: row.kakao_place_url || undefined,
        category: row.kakao_category || undefined,
      },
      {
        name: "Google Maps",
        registered: row.google_registered ?? false,
        score: row.google_rating ? Number(row.google_rating) : undefined,
        reviewCount: row.google_review_count ?? 0,
        hasPhotos: row.google_has_photos ?? false,
        hasEnglish: row.google_has_english ?? false,
      },
    ],
  };
}
