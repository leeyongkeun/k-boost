import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  sessions, SESSION_TTL,
  loginAttempts, MAX_ATTEMPTS,
  getClientIp, isBlocked, recordAttempt, clearAttempts,
  generateToken, isValidSession,
} from "@/lib/admin-auth";

// POST: 로그인 → 세션 토큰 발급
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isBlocked(ip)) {
    return NextResponse.json(
      { error: "로그인 시도가 너무 많습니다. 5분 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const { id, password } = await req.json();
    const adminId = process.env.ADMIN_ID || "kb_admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "zjstjfxld1!2@3#";

    if (id !== adminId || password !== adminPassword) {
      recordAttempt(ip);
      const entry = loginAttempts.get(ip);
      const remaining = MAX_ATTEMPTS - (entry?.count || 0);
      return NextResponse.json(
        { error: `아이디 또는 비밀번호가 올바르지 않습니다.${remaining > 0 ? ` (${remaining}회 남음)` : ""}` },
        { status: 401 }
      );
    }

    clearAttempts(ip);
    const token = generateToken();
    sessions.set(token, Date.now() + SESSION_TTL);

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// GET: fetch search_results data
export async function GET(req: NextRequest) {
  if (!isValidSession(req)) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  // ── 카드뉴스 이력 조회 ──
  if (type === "cardnews_sets") {
    const { data, error } = await supabase
      .from("cardnews_sets")
      .select("id, created_at, card_count")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });

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

  if (type === "cardnews_detail") {
    const setId = searchParams.get("setId");
    if (!setId) return NextResponse.json({ error: "setId 필요" }, { status: 400 });

    const { data, error } = await supabase
      .from("cardnews_cards")
      .select("*")
      .eq("set_id", setId)
      .order("card_index", { ascending: true });

    if (error) return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    return NextResponse.json({ cards: data });
  }

  // ── 기존: 단건 조회 ──
  const detailId = searchParams.get("id");
  if (detailId) {
    const { data, error } = await supabase
      .from("search_results")
      .select("*")
      .eq("id", detailId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "데이터를 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ data });
  }

  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? true : false;
  const filterGrade = searchParams.get("grade") || "";
  const filterPhone = searchParams.get("hasPhone") || "";
  const filterPdfSent = searchParams.get("pdfSent") || "";

  let query = supabase
    .from("search_results")
    .select(
      "id, created_at, store_name, business_type, address, score, grade, customer_phone, pdf_sent, inbound"
    )
    .order(sortBy, { ascending: sortOrder });

  if (filterGrade) {
    query = query.eq("grade", filterGrade);
  }

  if (filterPhone === "yes") {
    query = query.not("customer_phone", "is", null);
  } else if (filterPhone === "no") {
    query = query.is("customer_phone", null);
  }

  if (filterPdfSent === "true") {
    query = query.eq("pdf_sent", true);
  } else if (filterPdfSent === "false") {
    query = query.or("pdf_sent.eq.false,pdf_sent.is.null");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Admin fetch error:", error);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// PATCH: toggle pdf_sent
export async function PATCH(req: NextRequest) {
  if (!isValidSession(req)) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, pdf_sent } = body;

    if (!id) {
      return NextResponse.json({ error: "ID 필요" }, { status: 400 });
    }

    const { error } = await supabase
      .from("search_results")
      .update({ pdf_sent: !!pdf_sent })
      .eq("id", id);

    if (error) {
      console.error("Admin update error:", error);
      return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
