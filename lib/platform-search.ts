import { PlatformInfo } from "./types";
import { logError } from "./error-logger";

const API_TIMEOUT_MS = 6000;

interface NaverItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

interface KakaoDocument {
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  place_url: string;
  x: string;
  y: string;
}

interface GooglePlace {
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
  primaryType?: string;
  websiteUri?: string;
  reviews?: {
    originalText?: { text: string; languageCode: string };
    rating: number;
  }[];
}

export interface PlatformSearchResult {
  storeName: string;
  businessType: string;
  address: string;
  phone: string;
  platforms: PlatformInfo[];
  naverCategory: string;
  kakaoCategory: string;
}

// --- 타임아웃 유틸 ---
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => {
        console.log(`[platform-search] ${label} timed out after ${ms}ms`);
        resolve(null);
      }, ms);
    }),
  ]);
}

// --- 네이버 지도 검색 ---
async function searchNaver(query: string): Promise<NaverItem | null> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=1`;
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      console.error("[platform-search] Naver HTTP error:", res.status, errText);
      logError({ searchKeyword: query, errorMessage: `Naver HTTP ${res.status}: ${errText.slice(0, 200)}`, errorType: "platform_search" });
      return null;
    }

    const data = await res.json();
    console.log("[platform-search] Naver response total:", data.total, "items:", data.items?.length);
    if (!data.items || data.items.length === 0) return null;

    return data.items[0] as NaverItem;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[platform-search] Naver error:", msg);
    logError({ searchKeyword: query, errorMessage: `Naver: ${msg}`, errorType: "platform_search" });
    return null;
  }
}

// --- 카카오맵 검색 ---
async function searchKakao(query: string): Promise<KakaoDocument | null> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      console.error("[platform-search] Kakao HTTP error:", res.status, errText);
      logError({ searchKeyword: query, errorMessage: `Kakao HTTP ${res.status}: ${errText.slice(0, 200)}`, errorType: "platform_search" });
      return null;
    }

    const data = await res.json();
    console.log("[platform-search] Kakao response total:", data.meta?.total_count, "docs:", data.documents?.length);
    if (!data.documents || data.documents.length === 0) return null;

    return data.documents[0] as KakaoDocument;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[platform-search] Kakao error:", msg);
    logError({ searchKeyword: query, errorMessage: `Kakao: ${msg}`, errorType: "platform_search" });
    return null;
  }
}

// --- Google Maps Places API (New) 검색 ---
async function searchGoogleMaps(query: string): Promise<{
  registered: boolean;
  score?: number;
  reviewCount: number;
  hasPhotos: boolean;
  hasEnglish: boolean;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.log("[platform-search] Google Maps API key not set, skipping");
    return null;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos,places.reviews,places.primaryType,places.websiteUri",
      },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        textQuery: query,
        languageCode: "ko",
        maxResultCount: 1,
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      console.error("[platform-search] Google Maps error:", res.status, errText);
      logError({ searchKeyword: query, errorMessage: `Google Maps HTTP ${res.status}: ${errText.slice(0, 200)}`, errorType: "platform_search" });
      return null;
    }

    const data = await res.json();
    if (!data.places || data.places.length === 0) {
      return { registered: false, reviewCount: 0, hasPhotos: false, hasEnglish: false };
    }

    const place: GooglePlace = data.places[0];

    const hasEnglishReview = (place.reviews || []).some(
      (r) => r.originalText?.languageCode === "en"
    );

    return {
      registered: true,
      score: place.rating,
      reviewCount: place.userRatingCount || 0,
      hasPhotos: (place.photos || []).length > 0,
      hasEnglish: hasEnglishReview,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[platform-search] Google Maps error:", msg);
    logError({ searchKeyword: query, errorMessage: `Google Maps: ${msg}`, errorType: "platform_search" });
    return null;
  }
}

// --- 업종 추론 ---
function inferBusinessType(naverCategory: string, kakaoCategory: string): string {
  const combined = (naverCategory + " " + kakaoCategory).toLowerCase();

  if (/베이커리|빵/.test(combined)) return "베이커리";
  if (/네일/.test(combined)) return "네일샵";
  if (/헤어|미용|salon|바버/.test(combined)) return "헤어샵";
  if (/피부|클리닉|에스테틱|성형/.test(combined)) return "클리닉";
  if (/카페|디저트|커피|coffee/.test(combined)) return "카페";
  if (/뷰티|beauty|왁싱|속눈썹/.test(combined)) return "뷰티샵";
  if (/한식|국밥|삼겹|갈비|비빔|불고기|찌개|냉면|칼국수|보쌈|족발/.test(combined)) return "한식당";
  if (/일식|초밥|스시|라멘|이자카야|우동|돈카츠|오마카세/.test(combined)) return "일식";
  if (/중식|짜장|짬뽕|마라/.test(combined)) return "중식";
  if (/양식|파스타|피자|스테이크|버거|브런치/.test(combined)) return "양식";
  if (/주점|술집|바|pub|호프|포차|와인|칵테일/.test(combined)) return "주점";
  if (/숙박|호텔|모텔|게스트하우스|펜션/.test(combined)) return "숙박";
  if (/음식점|레스토랑|식당/.test(combined)) return "음식점";
  if (/소품|편집|잡화|문구/.test(combined)) return "소품샵";

  return "매장";
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

// --- 전체 플랫폼 통합 검색 (전체 12초 타임아웃) ---
export async function searchPlatforms(query: string): Promise<PlatformSearchResult | null> {
  const startTime = Date.now();

  // 1단계: 네이버, 카카오 동시 검색 (매장 기본 정보 확보)
  const [naverResult, kakaoResult] = await Promise.all([
    searchNaver(query),
    searchKakao(query),
  ]);

  console.log("[platform-search] Phase 1 done in", Date.now() - startTime, "ms");
  console.log("[platform-search] Naver result:", naverResult ? "found" : "null");
  console.log("[platform-search] Kakao result:", kakaoResult ? "found" : "null");

  // 둘 다 못 찾으면 실패
  if (!naverResult && !kakaoResult) {
    console.log("[platform-search] Both failed for query:", query);
    logError({ searchKeyword: query, errorMessage: "네이버/카카오 모두 검색 결과 없음", errorType: "platform_search" });
    return null;
  }

  const storeName = naverResult
    ? stripHtml(naverResult.title)
    : kakaoResult!.place_name;

  const naverCategory = naverResult?.category || "";
  const kakaoCategory = kakaoResult?.category_name || "";
  const businessType = inferBusinessType(naverCategory, kakaoCategory);

  const address = naverResult?.roadAddress || naverResult?.address
    || kakaoResult?.road_address_name || kakaoResult?.address_name || "";

  const phone = naverResult?.telephone || kakaoResult?.phone || "";

  // 2단계: Google Maps 검색
  const googleQuery = `${storeName} ${address}`;
  const googleResult = await searchGoogleMaps(googleQuery);

  console.log("[platform-search] Phase 2 done in", Date.now() - startTime, "ms");
  console.log("[platform-search] Google Maps:", googleResult ? "found" : "skipped/not found");

  const platforms: PlatformInfo[] = [
    {
      name: "네이버 지도",
      registered: !!naverResult,
      reviewCount: 0,
      hasPhotos: !!naverResult,
      hasEnglish: false,
    },
    {
      name: "카카오맵",
      registered: !!kakaoResult,
      reviewCount: 0,
      hasPhotos: !!kakaoResult,
      hasEnglish: false,
    },
    {
      name: "Google Maps",
      registered: googleResult?.registered ?? false,
      score: googleResult?.score,
      reviewCount: googleResult?.reviewCount ?? 0,
      hasPhotos: googleResult?.hasPhotos ?? false,
      hasEnglish: googleResult?.hasEnglish ?? false,
    },
  ];

  console.log("[platform-search] Total time:", Date.now() - startTime, "ms");

  return {
    storeName,
    businessType,
    address,
    phone,
    platforms,
    naverCategory,
    kakaoCategory,
  };
}
