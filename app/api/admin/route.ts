import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// --- Session token (서버 메모리) ---
const sessions = new Map<string, number>(); // token → expireAt
const SESSION_TTL = 4 * 60 * 60 * 1000; // 4시간

// --- Rate limiter (로그인 시도 제한) ---
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 5 * 60 * 1000; // 5분 차단

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

function isBlocked(ip: string): boolean {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.blockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string): void {
  const entry = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_DURATION;
  }
  loginAttempts.set(ip, entry);
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function isValidSession(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  if (!token) return false;
  const expireAt = sessions.get(token);
  if (!expireAt) return false;
  if (Date.now() > expireAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

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

  // 단건 조회
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
