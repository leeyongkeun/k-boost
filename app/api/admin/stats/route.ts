import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isValidSession } from "@/lib/admin-auth";

interface DailyRow {
  date: string;
  total: number;
  S: number;
  A: number;
  B: number;
  C: number;
  D: number;
}

export async function GET(req: NextRequest) {
  if (!isValidSession(req)) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(Number(searchParams.get("days")) || 30, 90);

  // KST 기준 N일 전
  const cutoff = new Date(Date.now() + 9 * 60 * 60 * 1000);
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  // UTC로 변환해서 쿼리
  const cutoffUTC = new Date(cutoff.getTime() - 9 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("search_results")
    .select("created_at, grade, customer_phone, pdf_sent")
    .gte("created_at", cutoffUTC.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "통계 조회 실패" }, { status: 500 });
  }

  // 전체 통계 (all-time)
  const { count: totalAllTime } = await supabase
    .from("search_results")
    .select("id", { count: "exact", head: true });

  const { count: totalWithPhone } = await supabase
    .from("search_results")
    .select("id", { count: "exact", head: true })
    .not("customer_phone", "is", null);

  const { count: totalPdfSent } = await supabase
    .from("search_results")
    .select("id", { count: "exact", head: true })
    .eq("pdf_sent", true);

  // 일별 그룹핑 (KST 기준)
  const dailyMap = new Map<string, DailyRow>();
  const grades = ["S", "A", "B", "C", "D"] as const;

  // 빈 날짜도 채우기 위해 날짜 범위 생성
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dailyMap.set(dateStr, { date: dateStr, total: 0, S: 0, A: 0, B: 0, C: 0, D: 0 });
  }

  // 오늘 날짜 (KST)
  const todayStr = now.toISOString().slice(0, 10);
  let todayCount = 0;

  for (const row of data || []) {
    // UTC created_at → KST 날짜
    const kst = new Date(new Date(row.created_at).getTime() + 9 * 60 * 60 * 1000);
    const dateStr = kst.toISOString().slice(0, 10);

    let entry = dailyMap.get(dateStr);
    if (!entry) {
      entry = { date: dateStr, total: 0, S: 0, A: 0, B: 0, C: 0, D: 0 };
      dailyMap.set(dateStr, entry);
    }

    entry.total++;
    if (row.grade && grades.includes(row.grade)) {
      entry[row.grade as typeof grades[number]]++;
    }

    if (dateStr === todayStr) todayCount++;
  }

  // Map → sorted array
  const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    daily,
    summary: {
      totalAllTime: totalAllTime ?? 0,
      today: todayCount,
      withPhone: totalWithPhone ?? 0,
      pdfSent: totalPdfSent ?? 0,
      leadRate: totalAllTime ? Math.round(((totalWithPhone ?? 0) / totalAllTime) * 100) : 0,
      pdfRate: totalAllTime ? Math.round(((totalPdfSent ?? 0) / totalAllTime) * 100) : 0,
    },
  });
}
