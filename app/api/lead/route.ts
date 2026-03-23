import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, storeName } = body;

    if (!phone || phone.length < 10) {
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
      console.error("Lead lookup error:", selectError);
      return NextResponse.json({ success: true });
    }

    if (!rows || rows.length === 0) {
      // Fallback: find the most recent row for this store regardless of time
      const { data: fallbackRows, error: fallbackError } = await supabase
        .from("search_results")
        .select("id")
        .eq("store_name", storeName)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fallbackError || !fallbackRows || fallbackRows.length === 0) {
        console.error("No search_results found for store:", storeName);
        return NextResponse.json({ success: true });
      }

      const { error: updateError } = await supabase
        .from("search_results")
        .update({ customer_phone: phone })
        .eq("id", fallbackRows[0].id);

      if (updateError) {
        console.error("Lead update error:", updateError);
      }

      return NextResponse.json({ success: true });
    }

    const { error: updateError } = await supabase
      .from("search_results")
      .update({ customer_phone: phone })
      .eq("id", rows[0].id);

    if (updateError) {
      console.error("Lead update error:", updateError);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
