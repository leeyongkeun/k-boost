import { NextRequest, NextResponse } from "next/server";
import { QUESTIONS } from "@/lib/questions";
import { QuizAnswers } from "@/lib/types";
import { lookupStore } from "@/lib/data-lookup";
import { searchAndAnalyzeStore } from "@/lib/gemini";

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

    // DB 상권 데이터 조회 (보조 컨텍스트 — 없어도 동작)
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

    console.log("[analyze] storeName:", storeName, "areaContext:", areaContext ? "found" : "none");

    // Gemini 웹검색 + 분석
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
  } catch (e) {
    console.error("Analysis error:", e);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
