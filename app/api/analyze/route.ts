import { NextRequest, NextResponse } from "next/server";
import { QUESTIONS } from "@/lib/questions";
import { QuizAnswers } from "@/lib/types";
import { lookupStore } from "@/lib/data-lookup";
import { analyzeWithData } from "@/lib/analyze-with-data";
import { logError } from "@/lib/error-logger";

// 분석 모드: "api" (네이버/카카오 API + Claude 분석) | "gemini_search" (Gemini 웹검색) | "db" (DB 목데이터)
const ANALYZE_MODE = process.env.ANALYZE_MODE || "db";

const PLATFORM_SEARCH_TIMEOUT_MS = 14400;
const GLOBAL_ANALYSIS_TIMEOUT_MS = 18000;

// 전체 분석에 18초 타임아웃
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

    // --- 모드 1: 네이버/카카오 API + Gemini 분석 (가장 저렴 + 정확) ---
    if (ANALYZE_MODE === "api") {
      const { searchPlatforms } = await import("@/lib/platform-search");
      const { analyzeWithPlatformData } = await import("@/lib/claude");

      console.log("[analyze] API mode - searching platforms for:", storeName);

      const platformData = await withGlobalTimeout(searchPlatforms(storeInfo), PLATFORM_SEARCH_TIMEOUT_MS);

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
