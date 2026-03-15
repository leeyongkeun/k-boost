import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 환경변수 확인
  results.env = {
    ANALYZE_MODE: process.env.ANALYZE_MODE || "(not set, default db)",
    NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ? "SET" : "MISSING",
    NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ? "SET" : "MISSING",
    KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY ? "SET" : "MISSING",
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ? "SET" : "MISSING",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "SET" : "MISSING",
  };

  // 네이버 API 테스트
  try {
    const query = "블루보틀 삼청점";
    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=1`;
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID || "",
        "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET || "",
      },
      cache: "no-store",
    });
    const data = await res.json();
    results.naver = {
      status: res.status,
      total: data.total,
      items: data.items?.length || 0,
      firstTitle: data.items?.[0]?.title || null,
      error: data.errorMessage || null,
    };
  } catch (e) {
    results.naver = { error: String(e) };
  }

  // 카카오 API 테스트
  try {
    const query = "블루보틀 삼청점";
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
      },
      cache: "no-store",
    });
    const data = await res.json();
    results.kakao = {
      status: res.status,
      total: data.meta?.total_count || 0,
      docs: data.documents?.length || 0,
      firstName: data.documents?.[0]?.place_name || null,
      error: data.errorMessage || null,
    };
  } catch (e) {
    results.kakao = { error: String(e) };
  }

  return NextResponse.json(results, { status: 200 });
}
