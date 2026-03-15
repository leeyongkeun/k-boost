/**
 * 현재 DB 데이터 조회 스크립트
 *
 * 사용법:
 *   node scripts/list-data.js
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  // 상권 목록
  const { data: areas } = await supabase.from("areas").select("district_id, district_name, city, tourist_rank").order("tourist_rank").order("city");
  console.log(`\n=== 상권 (${areas.length}개) ===`);
  const grouped = {};
  areas.forEach((a) => {
    const key = `${a.tourist_rank}등급`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(`${a.district_name}(${a.city})`);
  });
  Object.entries(grouped).forEach(([rank, list]) => {
    console.log(`  ${rank}: ${list.join(", ")}`);
  });

  // 별칭
  const { count: aliasCount } = await supabase.from("area_aliases").select("*", { count: "exact", head: true });
  console.log(`\n=== 별칭: ${aliasCount}개 ===`);

  // 벤치마크
  const { data: bench } = await supabase.from("benchmarks").select("business_type, district_tier");
  const bizTypes = [...new Set(bench.map((b) => b.business_type))];
  console.log(`\n=== 벤치마크: ${bench.length}개 (${bizTypes.join(", ")}) ===`);
}

main().catch(console.error);
