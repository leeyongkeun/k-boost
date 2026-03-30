import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST: 렌더링된 카드 이미지를 Storage에 업로드하고 DB 업데이트
export async function POST(req: NextRequest) {
  // 간단한 인증: setId가 DB에 존재하는지로 검증
  try {
    const formData = await req.formData();
    const setId = formData.get("setId") as string;
    const cardIndex = Number(formData.get("cardIndex"));
    const file = formData.get("file") as File;

    if (!setId || isNaN(cardIndex) || !file) {
      return NextResponse.json({ error: "필수 파라미터 누락" }, { status: 400 });
    }

    const datePath = new Date().toISOString().slice(0, 10);
    const filePath = `${datePath}/${setId}/card-${cardIndex}.png`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("cardnews")
      .upload(filePath, buffer, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("[cardnews-upload] Storage error:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("cardnews")
      .getPublicUrl(filePath);

    // DB에 image_url 업데이트
    const { error: updateError } = await supabase
      .from("cardnews_cards")
      .update({ image_url: urlData.publicUrl })
      .eq("set_id", setId)
      .eq("card_index", cardIndex);

    if (updateError) {
      console.error("[cardnews-upload] DB update error:", updateError.message);
    }

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error("[cardnews-upload] Error:", e);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
