import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isValidSession } from "@/lib/admin-auth";
import { CardNewsItem } from "@/lib/cardnews-types";
import { getGradientKey } from "@/lib/cardnews-gradients";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  if (!isValidSession(req)) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }] as never[],
    });

    const today = new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const prompt = `당신은 한국 관광산업 콘텐츠 전문가입니다. 오늘(${today}) 기준으로 최신 한국 관광 뉴스를 웹 검색하여 인스타그램 카드뉴스 10장 분량의 콘텐츠를 만들어주세요.

## 검색 키워드 (이 주제들로 검색하세요)
- 한국 외국인 관광객 최신 뉴스
- 방한 외국인 소비 트렌드 2025 2026
- K-관광 성장 통계
- 외국인 맛집 핫플레이스
- 한국 관광산업 전망
- 인바운드 관광 정책

## 카드뉴스 구성
정확히 10장의 카드를 만들어주세요:

1. **카드 1 (cover)**: 커버. headline에 오늘 날짜와 "K-관광 트렌드"를 포함. bodyPoints는 이번 세트의 핵심 키워드 3개.
2. **카드 2~9 (content)**: 각각 다른 뉴스/트렌드 주제.
   - headline: 임팩트 있는 제목 (최대 25자)
   - subHeadline: 부제목 (최대 30자)
   - statValue: 핵심 수치 1개 (예: "1,750만명", "+23%", "4.2조원")
   - statLabel: 수치 설명 (예: "2025 방한 외국인")
   - bodyPoints: 핵심 포인트 2~3개 (각 최대 35자)
   - source: 출처 (예: "한국관광공사", "문화체육관광부")
3. **카드 10 (cta)**: CTA 카드. headline: "우리 매장도 외국인 고객을 유치할 수 있습니다". bodyPoints에 K-BOOST 서비스 소개 3줄.

## 콘텐츠 톤앤매너
- 타겟: 한국 매장 사장님 (카페, 식당, 뷰티샵 등)
- 메시지: "관광산업이 이렇게 뜨고 있으니, 우리 매장도 준비하자"
- 숫자/데이터 중심으로 신뢰감 있게
- 너무 딱딱하지 않고, 인스타그램에 맞는 가벼운 톤

## 응답 형식
반드시 아래 JSON 배열로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

[
  {
    "index": 0,
    "type": "cover",
    "headline": "string",
    "subHeadline": "string (optional)",
    "bodyPoints": ["string", "string", "string"],
    "statValue": "string (optional)",
    "statLabel": "string (optional)",
    "source": "string (optional)"
  },
  ... (총 10개)
]

주의:
- 반드시 10개의 카드를 생성하세요.
- 검색으로 찾은 실제 뉴스와 데이터만 사용하세요.
- index는 0부터 9까지.
- type은 index 0 = "cover", index 1~8 = "content", index 9 = "cta"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSON 파싱
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[cardnews] Failed to parse JSON from Gemini response");
      return NextResponse.json({ error: "콘텐츠 생성 실패. 다시 시도해주세요." }, { status: 500 });
    }

    const rawCards = JSON.parse(jsonMatch[0]) as Partial<CardNewsItem>[];

    if (!Array.isArray(rawCards) || rawCards.length < 10) {
      return NextResponse.json({ error: "카드 수가 부족합니다. 다시 시도해주세요." }, { status: 500 });
    }

    // 정규화 + gradient 배정
    const cards: CardNewsItem[] = rawCards.slice(0, 10).map((card, i) => ({
      index: i,
      type: i === 0 ? "cover" : i === 9 ? "cta" : "content",
      headline: card.headline || "",
      subHeadline: card.subHeadline || undefined,
      bodyPoints: Array.isArray(card.bodyPoints) ? card.bodyPoints : [],
      statValue: card.statValue || undefined,
      statLabel: card.statLabel || undefined,
      source: card.source || undefined,
      gradientKey: getGradientKey(i),
    }));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      cards,
    });
  } catch (error) {
    console.error("[cardnews] Generation error:", error);
    return NextResponse.json({ error: "카드뉴스 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
