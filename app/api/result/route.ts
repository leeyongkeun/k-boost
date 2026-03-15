import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { result } = await request.json();

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
