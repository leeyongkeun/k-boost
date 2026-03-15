import { NextRequest, NextResponse } from "next/server";
import { QUESTIONS } from "@/lib/questions";
import { QuizAnswers } from "@/lib/types";
import { lookupStore } from "@/lib/data-lookup";
import { analyzeWithData } from "@/lib/analyze-with-data";

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

    // DB 상권 데이터 조회
    const storeInfo = answers.store_info || "";
    const storeName = storeInfo.split(/[,，]/)[0].trim() || storeInfo.trim();
    const lookup = await lookupStore(storeInfo);

    if (lookup.matchType === "mock") {
      return NextResponse.json(
        { error: "해당 지역은 아직 분석 데이터가 없습니다. 주요 관광 상권(홍대, 이태원, 명동, 강남, 성수, 해운대 등)의 매장 위치를 입력해주세요." },
        { status: 404 }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
    return NextResponse.json(
      analyzeWithData(lookup, answers.foreign_ratio || "very_low", answers.change_willingness || "low", storeName)
    );
  } catch (e) {
    console.error("Analysis error:", e);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
