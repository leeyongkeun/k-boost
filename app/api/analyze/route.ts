import { NextRequest, NextResponse } from "next/server";
import { QUESTIONS } from "@/lib/questions";
import { QuizAnswers } from "@/lib/types";
import { lookupStore } from "@/lib/data-lookup";
import { analyzeWithData } from "@/lib/analyze-with-data";
// Gemini 웹검색 분석 (USE_GEMINI_SEARCH=true 시 활성화)
// import { searchAndAnalyzeStore } from "@/lib/gemini";

const USE_GEMINI_SEARCH = process.env.USE_GEMINI_SEARCH === "true";

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

    // --- Gemini 웹검색 모드 ---
    if (USE_GEMINI_SEARCH) {
      const { searchAndAnalyzeStore } = await import("@/lib/gemini");

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

      const result = await searchAndAnalyzeStore({
        storeName,
        storeInfo,
        foreignRatio,
        changeWillingness,
        areaContext,
      });

      if (!result) {
        return NextResponse.json(
          { error: "매장 분석에 실패했습니다. 매장명과 위치를 정확히 입력하고 다시 시도해주세요." },
          { status: 500 }
        );
      }

      return NextResponse.json(result);
    }

    // --- DB 목데이터 모드 (기본) ---
    const lookup = await lookupStore(storeInfo);

    console.log("[analyze] storeInfo:", storeInfo, "matchType:", lookup.matchType, "businessType:", lookup.businessType);

    if (lookup.matchType === "mock") {
      return NextResponse.json(
        { error: "해당 지역은 아직 분석 데이터가 없습니다. 주요 관광 상권(홍대, 이태원, 명동, 강남, 성수, 해운대 등)의 매장 위치를 입력해주세요." },
        { status: 404 }
      );
    }

    const dbResult = analyzeWithData(lookup, foreignRatio, changeWillingness, storeName);
    return NextResponse.json(dbResult);
  } catch (e) {
    console.error("Analysis error:", e);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
