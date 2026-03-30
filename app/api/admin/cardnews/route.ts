import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isValidSession } from "@/lib/admin-auth";
import { CardNewsItem } from "@/lib/cardnews-types";
import { getGradientKey } from "@/lib/cardnews-gradients";
import { pickRandomTopics } from "@/lib/cardnews-topics";
import { supabase } from "@/lib/supabase";

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

    // 10개 카테고리에서 랜덤 8개 주제 선정
    const selectedTopics = pickRandomTopics(8);
    const topicList = selectedTopics
      .map((t, i) => `${i + 1}. [${t.category}] ${t.topic}`)
      .join("\n");

    const prompt = `당신은 한국 관광산업 콘텐츠 전문가입니다. 오늘(${today}) 기준으로 아래 주제들을 웹 검색하여 인스타그램 카드뉴스 10장 분량의 콘텐츠를 만들어주세요.

## 오늘의 주제 (각 주제별로 반드시 웹 검색하세요)
${topicList}

각 주제를 검색할 때 최신 뉴스, 통계, 수치 데이터를 찾아주세요.
검색 결과가 부족한 주제는 관련 키워드를 변형하여 재검색하세요.

## 카드뉴스 구성
정확히 10장의 카드를 만들어주세요:

1. **카드 1 (cover)**: 커버. headline에 오늘 날짜와 "K-관광 트렌드"를 포함. bodyPoints는 이번 세트의 핵심 키워드 3개.
2. **카드 2~9 (content)**: 위 8개 주제를 각각 1장씩 다룹니다.
   - headline: 임팩트 있는 제목 (최대 25자)
   - subHeadline: 부제목 (최대 30자)
   - statValue: 핵심 수치 1개 (예: "1,750만명", "+23%", "4.2조원") — 반드시 검색에서 찾은 실제 수치
   - statLabel: 수치 설명 (예: "2025 방한 외국인")
   - bodyPoints: 핵심 포인트 2개 (각 최대 30자, 짧고 임팩트 있게)
   - source: 출처 (예: "한국관광공사", "문화체육관광부", "한국은행" 등)
3. **카드 10 (cta)**: CTA 카드. headline: "우리 매장도 외국인 고객을 유치할 수 있습니다". bodyPoints에 K-BOOST 서비스 소개 3줄.

## 헤드라인 작성법 (매우 중요!)
SNS는 도파민 고자극 시대입니다. 일반적인 뉴스 헤드라인으로는 다음 장을 안 넘깁니다.
아래 패턴을 반드시 사용하세요:

- **긴급성/마감**: "3월까지만 적용되는 자영업자 꿀팁", "이번 달 안에 안 하면 늦습니다"
- **충격/위기감**: "현재 자영업자들 ㅈ된 이유", "이거 모르면 매출 반토막"
- **숫자 강조**: "매출 340% 올린 카페의 비밀", "외국인 1,750만명이 쏟아진다"
- **호기심 유발**: "일본은 되는데 한국은 안 되는 이유", "옆 가게만 외국인이 몰리는 진짜 이유"
- **비교/대조**: "구글맵 등록한 매장 vs 안 한 매장, 매출 차이"
- **꿀팁/리스트**: "외국인이 한국에서 꼭 하는 것 TOP5", "사장님이 모르는 무료 마케팅 3가지"
- **트렌드 알림**: "요즘 외국인들 한국 와서 이것만 합니다", "2026 대박 터질 관광 업종"

절대 "~에 대해 알아봅시다", "~의 현황" 같은 딱딱한 뉴스 제목 쓰지 마세요.
사장님이 스크롤 멈추고 "어? 이거 뭐지?" 하게 만드세요.

## 콘텐츠 톤앤매너
- 타겟: 한국 매장 사장님 (카페, 식당, 뷰티샵, 헤어샵 등)
- 메시지: "관광산업이 이렇게 뜨고 있으니, 우리 매장도 준비하자"
- 숫자/데이터 중심으로 신뢰감 있게
- 반말 아닌 존댓말, 하지만 친근하고 직설적으로
- 매장 사장님이 "이 기회를 놓치면 안 되겠다"고 느낄 수 있게
- FOMO(놓칠까봐 불안한 심리)를 자극하세요
- 핵심 목표 3가지: ① 다음 장을 넘기게 ② 유익해서 저장하게 ③ 주변에 공유하게
- 각 카드가 독립적으로도 가치 있지만, 다음 카드가 궁금해지는 흐름을 만드세요

## 배경 이미지 키워드 (매우 중요 — 10장 모두 다른 이미지!)
각 카드에 imageKeyword 필드를 추가하세요. 이 키워드로 배경 사진을 검색합니다.
**10장의 키워드가 절대 겹치면 안 됩니다.** 각 카드마다 완전히 다른 장면을 보여주세요.

카드별 키워드 방향:
- 카드1(커버): "seoul skyline night"
- 카드2: "korean street food market"
- 카드3: "korean beauty shop interior"
- 카드4: "bukchon hanok village"
- 카드5: "korean bbq restaurant"
- 카드6: "myeongdong shopping crowd"
- 카드7: "jeju island coast"
- 카드8: "korean cafe latte art"
- 카드9: "gangnam neon signs"
- 카드10(CTA): "korea airplane travel"

위는 예시일 뿐입니다. 각 카드의 실제 주제에 맞게 작성하되, 장소/업종/장면이 모두 달라야 합니다.
"korea tourism" 같은 일반적인 키워드 금지. 구체적인 장면(장소+행위+대상)으로 작성하세요.

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
    "source": "string (optional)",
    "imageKeyword": "string (영어, 배경 이미지 검색용)"
  },
  ... (총 10개)
]

주의:
- 반드시 10개의 카드를 생성하세요.
- 검색으로 찾은 실제 뉴스와 데이터만 사용하세요.
- index는 0부터 9까지.
- type은 index 0 = "cover", index 1~8 = "content", index 9 = "cta"
- 핵심 목표: 사람들이 다음 장을 넘기고, 유익해서 저장하고, 공유하게 만드세요.
- 각 카드의 마지막 bodyPoint에 "다음 장에서 더 자세히 →" 같은 넘기기 유도 문구를 넣어도 좋습니다.
- imageKeyword는 반드시 영어로, 해당 카드 내용에 맞는 한국 관광 관련 이미지 검색어를 작성하세요.`;

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
    const cards: CardNewsItem[] = rawCards.slice(0, 10).map((card, i) => {
      const keyword = (card as Record<string, unknown>).imageKeyword as string || "korea tourism";
      return {
        index: i,
        type: i === 0 ? "cover" : i === 9 ? "cta" : "content",
        headline: card.headline || "",
        subHeadline: card.subHeadline || undefined,
        bodyPoints: Array.isArray(card.bodyPoints) ? card.bodyPoints : [],
        statValue: card.statValue || undefined,
        statLabel: card.statLabel || undefined,
        source: card.source || undefined,
        gradientKey: getGradientKey(i),
        imageKeyword: keyword,
      };
    });

    // Pexels API로 키워드 기반 배경 이미지 가져오기 → base64 변환
    const pexelsKey = process.env.PEXELS_API_KEY;
    const imagePromises = cards.map(async (card) => {
      if (!pexelsKey) return null;
      try {
        const keyword = card.imageKeyword || "korea tourism";
        const page = (card.index % 5) + 1;
        const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&page=${page}&orientation=square`;
        const searchRes = await fetch(searchUrl, {
          headers: { Authorization: pexelsKey },
        });
        if (!searchRes.ok) return null;
        const searchData = await searchRes.json();
        const photo = searchData.photos?.[0];
        if (!photo) return null;

        // large2x (1880px) 또는 large (940px) 사용
        const imgUrl = photo.src?.large2x || photo.src?.large || photo.src?.original;
        if (!imgUrl) return null;

        const imgRes = await fetch(imgUrl);
        if (!imgRes.ok) return null;
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        return `data:${contentType};base64,${base64}`;
      } catch {
        return null;
      }
    });

    const images = await Promise.all(imagePromises);
    cards.forEach((card, i) => {
      card.imageUrl = images[i] || undefined;
    });

    // DB에 세트+카드 텍스트 데이터 저장 (이미지는 클라이언트에서 캡처 후 별도 업로드)
    const generatedAt = new Date().toISOString();
    let setId: string | null = null;
    let saveError: string | null = null;
    try {
      setId = await saveCardNewsToDb(cards);
    } catch (e) {
      saveError = e instanceof Error ? e.message : String(e);
      console.error("[cardnews] Save failed:", saveError);
    }

    return NextResponse.json({
      generatedAt,
      cards,
      setId,
      saved: !saveError,
      saveError,
    });
  } catch (error) {
    console.error("[cardnews] Generation error:", error);
    return NextResponse.json({ error: "카드뉴스 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

/** 카드뉴스 텍스트 데이터를 DB에 저장, setId 반환 */
async function saveCardNewsToDb(cards: CardNewsItem[]): Promise<string | null> {
  const { data: setData, error: setError } = await supabase
    .from("cardnews_sets")
    .insert({ card_count: cards.length })
    .select("id")
    .single();

  if (setError || !setData) {
    console.error("[cardnews] Failed to create set:", setError?.message);
    return null;
  }

  const setId = setData.id;

  const cardRows = cards.map((card) => ({
    set_id: setId,
    card_index: card.index,
    card_type: card.type,
    headline: card.headline,
    sub_headline: card.subHeadline || null,
    body_points: card.bodyPoints,
    stat_value: card.statValue || null,
    stat_label: card.statLabel || null,
    source: card.source || null,
    image_keyword: card.imageKeyword || null,
    image_url: null,
    gradient_key: card.gradientKey,
  }));

  const { error: insertError } = await supabase
    .from("cardnews_cards")
    .insert(cardRows);

  if (insertError) {
    console.error("[cardnews] Cards insert error:", insertError.message);
    return null;
  }

  console.log("[cardnews] Saved set:", setId, "with", cardRows.length, "cards");
  return setId;
}
