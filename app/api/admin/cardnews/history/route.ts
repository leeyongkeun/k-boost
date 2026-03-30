import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isValidSession } from "@/lib/admin-auth";

// GET: 카드뉴스 이력 조회
export async function GET(req: NextRequest) {
  if (!isValidSession(req)) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const setId = searchParams.get("setId");

  // 특정 세트 상세 조회
  if (setId) {
    const { data, error } = await supabase
      .from("cardnews_cards")
      .select("*")
      .eq("set_id", setId)
      .order("card_index", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }
    return NextResponse.json({ cards: data });
  }

  // 세트 목록 조회 (최근 50개)
  const { data, error } = await supabase
    .from("cardnews_sets")
    .select("id, created_at, card_count")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  // 각 세트의 첫 번째 카드(커버) 이미지 가져오기
  const setIds = (data || []).map((s) => s.id);
  let covers: Record<string, { headline: string; image_url: string | null }> = {};

  if (setIds.length > 0) {
    const { data: coverData } = await supabase
      .from("cardnews_cards")
      .select("set_id, headline, image_url")
      .in("set_id", setIds)
      .eq("card_index", 0);

    if (coverData) {
      covers = Object.fromEntries(
        coverData.map((c) => [c.set_id, { headline: c.headline, image_url: c.image_url }])
      );
    }
  }

  const sets = (data || []).map((s) => ({
    ...s,
    coverHeadline: covers[s.id]?.headline || null,
    coverImage: covers[s.id]?.image_url || null,
  }));

  return NextResponse.json({ sets });
}
