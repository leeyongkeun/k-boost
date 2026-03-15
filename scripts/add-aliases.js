/**
 * 기존 상권에 별칭 추가 스크립트
 *
 * 사용법:
 *   node scripts/add-aliases.js
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
  console.log("\n=== K-BOOST 별칭 추가 ===\n");

  // 현재 등록된 상권 목록
  const { data: areas } = await supabase.from("areas").select("district_id, district_name, city").order("city");
  console.log("등록된 상권 목록:");
  areas.forEach((a) => console.log(`  ${a.district_id} — ${a.district_name} (${a.city})`));

  const districtId = await ask("\ndistrict_id 입력: ");

  const target = areas.find((a) => a.district_id === districtId);
  if (!target) {
    console.log("해당 상권을 찾을 수 없습니다.");
    rl.close();
    return;
  }

  // 기존 별칭 표시
  const { data: existing } = await supabase.from("area_aliases").select("alias").eq("district_id", districtId);
  console.log(`\n${target.district_name} 기존 별칭: ${existing.map((e) => e.alias).join(", ") || "(없음)"}`);

  const input = await ask("추가할 별칭 (쉼표 구분): ");
  const newAliases = input.split(",").map((s) => s.trim()).filter(Boolean);

  if (newAliases.length === 0) {
    console.log("취소됨.");
    rl.close();
    return;
  }

  const rows = newAliases.map((alias) => ({ alias, district_id: districtId }));
  const { error } = await supabase.from("area_aliases").insert(rows);

  if (error) {
    console.error("추가 실패:", error.message);
  } else {
    console.log(`✅ 별칭 ${newAliases.length}개 추가 완료: ${newAliases.join(", ")}`);
  }

  rl.close();
}

main().catch((e) => { console.error(e); rl.close(); });
