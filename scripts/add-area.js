/**
 * 새 상권 데이터 추가 스크립트
 *
 * 사용법:
 *   node scripts/add-area.js
 *
 * 대화형으로 상권 정보를 입력받아 Supabase DB에 INSERT합니다.
 * 별칭도 함께 등록합니다.
 */

const readline = require("readline");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  console.log("\n=== K-BOOST 상권 데이터 추가 ===\n");

  // 기본 정보
  const districtName = await ask("상권명 (예: 수원역): ");
  const city = await ask("도시 (예: 수원): ");
  const districtId = await ask(`district_id (예: suwon-station) [자동: ${city.toLowerCase()}-${districtName.toLowerCase().replace(/\s+/g, "")}]: `)
    || `${city.toLowerCase()}-${districtName.toLowerCase().replace(/\s+/g, "")}`;

  // 관광 등급
  const touristRank = await ask("관광등급 S/A/B/C (S=핵심관광지, A=준핵심, B=일반, C=비관광): ");

  // 외국인 비율
  const foreignRatio = parseFloat(await ask("외국인 방문 비율 (0~1, 예: 0.15): "));

  // 유동인구
  const footTraffic = parseInt(await ask("일 유동인구 (예: 80000): "));

  // 인기 업종
  const bizTypes = await ask("인기 업종 (쉼표 구분, 예: 카페,음식점,뷰티샵): ");
  const popularTypes = bizTypes.split(",").map((s) => s.trim());

  // 주요 랜드마크
  const landmarks = await ask("주요 랜드마크 (쉼표 구분, 예: 수원역,수원화성): ");
  const nearbyLandmarks = landmarks.split(",").map((s) => s.trim());

  // 구글맵 검색량
  const googleVolume = await ask("Google Maps 검색량 high/medium/low: ");

  // 평균 리뷰수
  const avgNaver = parseInt(await ask("평균 네이버 리뷰수 (예: 100): "));
  const avgGoogle = parseInt(await ask("평균 구글 리뷰수 (예: 10): "));

  // 경쟁 밀도
  const density = await ask("경쟁 밀도 high/medium/low: ");

  // 별칭
  const aliasInput = await ask("별칭 (쉼표 구분, 예: 수원역,수원,수원시): ");
  const aliases = aliasInput.split(",").map((s) => s.trim()).filter(Boolean);

  // 확인
  console.log("\n--- 입력 확인 ---");
  console.log(`상권: ${districtName} (${city})`);
  console.log(`ID: ${districtId}`);
  console.log(`등급: ${touristRank} / 외국인: ${(foreignRatio * 100).toFixed(0)}% / 유동인구: ${footTraffic.toLocaleString()}`);
  console.log(`업종: ${popularTypes.join(", ")}`);
  console.log(`랜드마크: ${nearbyLandmarks.join(", ")}`);
  console.log(`별칭: ${aliases.join(", ")}`);

  const confirm = await ask("\nDB에 저장하시겠습니까? (y/n): ");
  if (confirm.toLowerCase() !== "y") {
    console.log("취소됨.");
    rl.close();
    return;
  }

  // areas INSERT
  const { error: areaErr } = await supabase.from("areas").insert({
    district_id: districtId,
    district_name: districtName,
    city,
    tourist_rank: touristRank.toUpperCase(),
    foreign_visitor_ratio: foreignRatio,
    daily_foot_traffic: footTraffic,
    popular_business_types: popularTypes,
    nearby_landmarks: nearbyLandmarks,
    google_maps_search_volume: googleVolume.toLowerCase(),
    avg_naver_review_count: avgNaver,
    avg_google_review_count: avgGoogle,
    competitor_density: density.toLowerCase(),
  });

  if (areaErr) {
    console.error("상권 추가 실패:", areaErr.message);
    rl.close();
    return;
  }
  console.log(`✅ 상권 "${districtName}" 추가 완료`);

  // aliases INSERT
  if (aliases.length > 0) {
    const rows = aliases.map((alias) => ({ alias, district_id: districtId }));
    const { error: aliasErr } = await supabase.from("area_aliases").insert(rows);
    if (aliasErr) {
      console.error("별칭 추가 실패:", aliasErr.message);
    } else {
      console.log(`✅ 별칭 ${aliases.length}개 추가 완료: ${aliases.join(", ")}`);
    }
  }

  // 현재 총 개수
  const { count: areaCount } = await supabase.from("areas").select("*", { count: "exact", head: true });
  const { count: aliasCount } = await supabase.from("area_aliases").select("*", { count: "exact", head: true });
  console.log(`\n현재 DB: 상권 ${areaCount}개 / 별칭 ${aliasCount}개`);

  rl.close();
}

main().catch((e) => { console.error(e); rl.close(); });
