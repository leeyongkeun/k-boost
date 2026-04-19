import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, storeName } = body;

    const cleaned = phone ? phone.replace(/[^0-9]/g, "") : "";
    if (!cleaned || cleaned.length < 10 || cleaned.length > 11 || !/^01[016789]/.test(cleaned)) {
      return NextResponse.json(
        { error: "유효한 연락처를 입력해주세요." },
        { status: 400 }
      );
    }

    // Find the most recent search_results row for this store (within the last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: rows, error: selectError } = await supabase
      .from("search_results")
      .select("id")
      .eq("store_name", storeName)
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectError) {
      return NextResponse.json(
        { error: "연락처 저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    let targetId: string | null = null;

    if (rows && rows.length > 0) {
      targetId = rows[0].id;
    } else {
      // Fallback: find the most recent row for this store regardless of time
      const { data: fallbackRows, error: fallbackError } = await supabase
        .from("search_results")
        .select("id")
        .eq("store_name", storeName)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fallbackError || !fallbackRows || fallbackRows.length === 0) {
        return NextResponse.json(
          { error: "매장 정보를 찾을 수 없습니다. 다시 시도해주세요." },
          { status: 404 }
        );
      }

      targetId = fallbackRows[0].id;
    }

    const { error: updateError } = await supabase
      .from("search_results")
      .update({ customer_phone: cleaned })
      .eq("id", targetId);

    if (updateError) {
      return NextResponse.json(
        { error: "연락처 저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
