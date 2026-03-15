import { NextRequest, NextResponse } from "next/server";
import { QUESTIONS } from "@/lib/questions";
import { QuizAnswers } from "@/lib/types";
import { lookupStore } from "@/lib/data-lookup";
import { analyzeWithData } from "@/lib/analyze-with-data";
import { logError } from "@/lib/error-logger";
import {
  PLATFORM_SEARCH_TIMEOUT_MS,
  GLOBAL_ANALYSIS_TIMEOUT_MS,
  STORE_INFO_MAX_LENGTH,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/constants";

// 분석 모드: "api" (네이버/카카오 API + Claude 분석) | "gemini_search" (Gemini 웹검색) | "db" (DB 목데이터)
const ANALYZE_MODE = process.env.ANALYZE_MODE || "db";

// --- Rate Limiter (인메모리, IP 기반) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// 전체 분석에 타임아웃
function withGlobalTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), ms);
    }),
  ]);
}

export async function POST(request: NextRequest) {
  try {
    // Rate Limit 체크
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 1분 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

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

    const storeInfo = answers.store_info || "";

    // 입력 길이 검증
    if (storeInfo.length > STORE_INFO_MAX_LENGTH) {
      return NextResponse.json(
        { error: `매장 정보는 ${STORE_INFO_MAX_LENGTH}자 이내로 입력해주세요.` },
        { status: 400 }
      );
    }

    const storeName = storeInfo.split(/[,，]/)[0].trim() || storeInfo.trim();
    const foreignRatio = answers.foreign_ratio || "very_low";
    const changeWillingness = answers.change_willingness || "low";

    // DB 상권 데이터 조회 (보조 컨텍스트)
    let areaContext;
    try {
      const lookup = await lookupStore(storeInfo);
      if (lookup.matchType !== "mock" && lookup.area) {
        areaContext = {
          districtName: lookup.area.district_name,
          city: lookup.area.city,
          touristRank: lookup.area.tourist_rank,
          foreignVisitorRatio: lookup.area.foreign_visitor_ratio,
          dailyFootTraffic: lookup.area.daily_foot_traffic,
        };
      }
    } catch (e) {
      console.log("[analyze] DB lookup skipped:", e);
    }

    const startTime = Date.now();

    // --- 모드 1: 네이버/카카오 API + Claude 분석 (가장 저렴 + 정확) ---
    if (ANALYZE_MODE === "api") {
      const { searchPlatforms } = await import("@/lib/platform-search");
      const { analyzeWithPlatformData } = await import("@/lib/claude");
      const { saveSearchResult, getCachedResult } = await import("@/lib/save-search-result");

      console.log("[analyze] API mode - searching platforms for:", storeName);

      // 캐시 조회 (7일 이내 같은 키워드)
      let platformData = await getCachedResult(storeInfo);
      let fromCache = false;

      if (platformData) {
        fromCache = true;
        console.log("[analyze] Cache HIT - skipping API calls, saved", Date.now() - startTime, "ms");
      } else {
        platformData = await withGlobalTimeout(searchPlatforms(storeInfo), PLATFORM_SEARCH_TIMEOUT_MS);
      }

      if (!platformData) {
        logError({ searchKeyword: storeInfo, errorMessage: "플랫폼 검색 결과 없음", errorType: "platform_search" });
        return NextResponse.json(
          { error: "매장을 찾을 수 없습니다. 매장명을 정확히 입력해주세요." },
          { status: 404 }
        );
      }

      console.log("[analyze] Platform search done in", Date.now() - startTime, "ms");

      const remainingTime = Math.max(3000, GLOBAL_ANALYSIS_TIMEOUT_MS - (Date.now() - startTime));
      const result = await withGlobalTimeout(
        analyzeWithPlatformData({
          storeName: platformData.storeName,
          storeInfo,
          businessType: platformData.businessType,
          address: platformData.address,
          phone: platformData.phone,
          platforms: platformData.platforms,
          naverCategory: platformData.naverCategory,
          kakaoCategory: platformData.kakaoCategory,
          foreignRatio,
          changeWillingness,
          instagramUrl: platformData.instagramUrl,
          areaContext,
        }),
        remainingTime
      );

      console.log("[analyze] Total time:", Date.now() - startTime, "ms");

      if (!result) {
        logError({ searchKeyword: storeInfo, errorMessage: "Claude 분석 결과 null 반환", errorType: "claude_analysis" });
        return NextResponse.json(
          { error: "매장 분석에 실패했습니다. 다시 시도해주세요." },
          { status: 500 }
        );
      }

      // 캐시가 아닌 경우에만 DB에 저장 (fire-and-forget)
      if (!fromCache) {
        saveSearchResult({
          searchKeyword: storeInfo,
          foreignRatio,
          changeWillingness,
          platformData,
          grade: result.grade,
          score: result.score,
        });
      }

      return NextResponse.json(result);
    }

    // --- 모드 2: Gemini 웹검색 (Google Search Grounding) ---
    if (ANALYZE_MODE === "gemini_search") {
      const { searchAndAnalyzeStore } = await import("@/lib/gemini");

      const result = await withGlobalTimeout(
        searchAndAnalyzeStore({
          storeName,
          storeInfo,
          foreignRatio,
          changeWillingness,
          areaContext,
        }),
        GLOBAL_ANALYSIS_TIMEOUT_MS
      );

      if (!result) {
        return NextResponse.json(
          { error: "매장 분석에 실패했습니다. 매장명과 위치를 정확히 입력하고 다시 시도해주세요." },
          { status: 500 }
        );
      }

      return NextResponse.json(result);
    }

    // --- 모드 3: DB 목데이터 (기본, 무료) ---
    const lookup = await lookupStore(storeInfo);

    console.log("[analyze] DB mode - storeInfo:", storeInfo, "matchType:", lookup.matchType);

    if (lookup.matchType === "mock") {
      return NextResponse.json(
        { error: "해당 지역은 아직 분석 데이터가 없습니다. 주요 관광 상권(홍대, 이태원, 명동, 강남, 성수, 해운대 등)의 매장 위치를 입력해주세요." },
        { status: 404 }
      );
    }

    const dbResult = analyzeWithData(lookup, foreignRatio, changeWillingness, storeName);
    return NextResponse.json(dbResult);
  } catch (e) {
    const isTimeout = e instanceof Error && e.message === "TIMEOUT";
    const errorMsg = isTimeout ? "18s timeout exceeded" : (e instanceof Error ? e.message : String(e));
    console.error("Analysis error:", errorMsg);
    logError({
      searchKeyword: undefined,
      errorMessage: errorMsg,
      errorType: isTimeout ? "timeout" : "unknown",
    });
    return NextResponse.json(
      { error: isTimeout ? "분석 시간이 초과되었습니다. 다시 시도해주세요." : "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
