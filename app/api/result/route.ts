import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_GRADES = ["S", "A", "B", "C", "D"];

export async function POST(request: NextRequest) {
  try {
    const { result } = await request.json();

    // 기본 검증
    if (
      !result ||
      typeof result !== "object" ||
      typeof result.score !== "number" ||
      !VALID_GRADES.includes(result.grade) ||
      typeof result.store_name !== "string" ||
      !result.store_name.trim()
    ) {
      return NextResponse.json({ error: "유효하지 않은 결과 데이터" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("quiz_results")
      .insert({ result })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: "결과 저장 실패" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: "저장 중 오류 발생" }, { status: 500 });
  }
}
