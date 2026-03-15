const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const NEW = [
  { business_type: "주점", tiers: {
    S: { avg_naver_score: 4.1, avg_naver_reviews: 120, avg_google_score: 3.9, avg_google_reviews: 25, avg_instagram_hashtags: 1500, google_registration_rate: 0.4, tripadvisor_registration_rate: 0.1, english_support_rate: 0.2 },
    A: { avg_naver_score: 4.0, avg_naver_reviews: 80, avg_google_score: 3.7, avg_google_reviews: 15, avg_instagram_hashtags: 800, google_registration_rate: 0.25, tripadvisor_registration_rate: 0.05, english_support_rate: 0.1 },
    B: { avg_naver_score: 3.8, avg_naver_reviews: 50, avg_google_score: 3.5, avg_google_reviews: 5, avg_instagram_hashtags: 300, google_registration_rate: 0.15, tripadvisor_registration_rate: 0.02, english_support_rate: 0.05 },
    C: { avg_naver_score: 3.6, avg_naver_reviews: 25, avg_google_score: 3.3, avg_google_reviews: 2, avg_instagram_hashtags: 100, google_registration_rate: 0.08, tripadvisor_registration_rate: 0.01, english_support_rate: 0.02 },
  }},
  { business_type: "숙박", tiers: {
    S: { avg_naver_score: 4.2, avg_naver_reviews: 100, avg_google_score: 4.1, avg_google_reviews: 50, avg_instagram_hashtags: 1200, google_registration_rate: 0.8, tripadvisor_registration_rate: 0.5, english_support_rate: 0.6 },
    A: { avg_naver_score: 4.0, avg_naver_reviews: 70, avg_google_score: 3.9, avg_google_reviews: 30, avg_instagram_hashtags: 600, google_registration_rate: 0.6, tripadvisor_registration_rate: 0.3, english_support_rate: 0.4 },
    B: { avg_naver_score: 3.8, avg_naver_reviews: 40, avg_google_score: 3.7, avg_google_reviews: 15, avg_instagram_hashtags: 250, google_registration_rate: 0.4, tripadvisor_registration_rate: 0.1, english_support_rate: 0.2 },
    C: { avg_naver_score: 3.6, avg_naver_reviews: 20, avg_google_score: 3.5, avg_google_reviews: 5, avg_instagram_hashtags: 80, google_registration_rate: 0.2, tripadvisor_registration_rate: 0.03, english_support_rate: 0.08 },
  }},
  { business_type: "네일샵", tiers: {
    S: { avg_naver_score: 4.6, avg_naver_reviews: 130, avg_google_score: 4.3, avg_google_reviews: 25, avg_instagram_hashtags: 2800, google_registration_rate: 0.6, tripadvisor_registration_rate: 0.1, english_support_rate: 0.3 },
    A: { avg_naver_score: 4.4, avg_naver_reviews: 90, avg_google_score: 4.1, avg_google_reviews: 15, avg_instagram_hashtags: 1500, google_registration_rate: 0.4, tripadvisor_registration_rate: 0.05, english_support_rate: 0.15 },
    B: { avg_naver_score: 4.2, avg_naver_reviews: 50, avg_google_score: 3.9, avg_google_reviews: 5, avg_instagram_hashtags: 500, google_registration_rate: 0.2, tripadvisor_registration_rate: 0.02, english_support_rate: 0.08 },
    C: { avg_naver_score: 4.0, avg_naver_reviews: 25, avg_google_score: 3.6, avg_google_reviews: 2, avg_instagram_hashtags: 150, google_registration_rate: 0.1, tripadvisor_registration_rate: 0.01, english_support_rate: 0.03 },
  }},
  { business_type: "클리닉", tiers: {
    S: { avg_naver_score: 4.4, avg_naver_reviews: 200, avg_google_score: 4.2, avg_google_reviews: 40, avg_instagram_hashtags: 2000, google_registration_rate: 0.7, tripadvisor_registration_rate: 0.15, english_support_rate: 0.45 },
    A: { avg_naver_score: 4.2, avg_naver_reviews: 130, avg_google_score: 4.0, avg_google_reviews: 25, avg_instagram_hashtags: 1000, google_registration_rate: 0.5, tripadvisor_registration_rate: 0.08, english_support_rate: 0.25 },
    B: { avg_naver_score: 4.0, avg_naver_reviews: 70, avg_google_score: 3.8, avg_google_reviews: 10, avg_instagram_hashtags: 400, google_registration_rate: 0.3, tripadvisor_registration_rate: 0.03, english_support_rate: 0.1 },
    C: { avg_naver_score: 3.8, avg_naver_reviews: 35, avg_google_score: 3.5, avg_google_reviews: 3, avg_instagram_hashtags: 150, google_registration_rate: 0.15, tripadvisor_registration_rate: 0.01, english_support_rate: 0.05 },
  }},
  { business_type: "베이커리", tiers: {
    S: { avg_naver_score: 4.4, avg_naver_reviews: 250, avg_google_score: 4.2, avg_google_reviews: 40, avg_instagram_hashtags: 3500, google_registration_rate: 0.65, tripadvisor_registration_rate: 0.15, english_support_rate: 0.25 },
    A: { avg_naver_score: 4.2, avg_naver_reviews: 150, avg_google_score: 4.0, avg_google_reviews: 25, avg_instagram_hashtags: 1800, google_registration_rate: 0.45, tripadvisor_registration_rate: 0.08, english_support_rate: 0.15 },
    B: { avg_naver_score: 4.0, avg_naver_reviews: 80, avg_google_score: 3.8, avg_google_reviews: 10, avg_instagram_hashtags: 600, google_registration_rate: 0.25, tripadvisor_registration_rate: 0.03, english_support_rate: 0.08 },
    C: { avg_naver_score: 3.8, avg_naver_reviews: 40, avg_google_score: 3.5, avg_google_reviews: 3, avg_instagram_hashtags: 200, google_registration_rate: 0.12, tripadvisor_registration_rate: 0.01, english_support_rate: 0.03 },
  }},
  { business_type: "한식당", tiers: {
    S: { avg_naver_score: 4.3, avg_naver_reviews: 300, avg_google_score: 4.1, avg_google_reviews: 50, avg_instagram_hashtags: 2500, google_registration_rate: 0.65, tripadvisor_registration_rate: 0.3, english_support_rate: 0.3 },
    A: { avg_naver_score: 4.1, avg_naver_reviews: 180, avg_google_score: 3.9, avg_google_reviews: 30, avg_instagram_hashtags: 1200, google_registration_rate: 0.45, tripadvisor_registration_rate: 0.15, english_support_rate: 0.18 },
    B: { avg_naver_score: 3.9, avg_naver_reviews: 80, avg_google_score: 3.7, avg_google_reviews: 10, avg_instagram_hashtags: 400, google_registration_rate: 0.25, tripadvisor_registration_rate: 0.05, english_support_rate: 0.08 },
    C: { avg_naver_score: 3.7, avg_naver_reviews: 35, avg_google_score: 3.4, avg_google_reviews: 3, avg_instagram_hashtags: 120, google_registration_rate: 0.1, tripadvisor_registration_rate: 0.01, english_support_rate: 0.03 },
  }},
  { business_type: "일식", tiers: {
    S: { avg_naver_score: 4.3, avg_naver_reviews: 200, avg_google_score: 4.1, avg_google_reviews: 35, avg_instagram_hashtags: 1800, google_registration_rate: 0.55, tripadvisor_registration_rate: 0.2, english_support_rate: 0.25 },
    A: { avg_naver_score: 4.1, avg_naver_reviews: 130, avg_google_score: 3.9, avg_google_reviews: 20, avg_instagram_hashtags: 900, google_registration_rate: 0.35, tripadvisor_registration_rate: 0.1, english_support_rate: 0.15 },
    B: { avg_naver_score: 3.9, avg_naver_reviews: 70, avg_google_score: 3.7, avg_google_reviews: 8, avg_instagram_hashtags: 350, google_registration_rate: 0.2, tripadvisor_registration_rate: 0.03, english_support_rate: 0.08 },
    C: { avg_naver_score: 3.7, avg_naver_reviews: 30, avg_google_score: 3.4, avg_google_reviews: 3, avg_instagram_hashtags: 100, google_registration_rate: 0.1, tripadvisor_registration_rate: 0.01, english_support_rate: 0.03 },
  }},
  { business_type: "중식", tiers: {
    S: { avg_naver_score: 4.2, avg_naver_reviews: 220, avg_google_score: 4.0, avg_google_reviews: 30, avg_instagram_hashtags: 1500, google_registration_rate: 0.5, tripadvisor_registration_rate: 0.15, english_support_rate: 0.2 },
    A: { avg_naver_score: 4.0, avg_naver_reviews: 140, avg_google_score: 3.8, avg_google_reviews: 18, avg_instagram_hashtags: 700, google_registration_rate: 0.3, tripadvisor_registration_rate: 0.08, english_support_rate: 0.1 },
    B: { avg_naver_score: 3.8, avg_naver_reviews: 70, avg_google_score: 3.6, avg_google_reviews: 8, avg_instagram_hashtags: 300, google_registration_rate: 0.18, tripadvisor_registration_rate: 0.03, english_support_rate: 0.05 },
    C: { avg_naver_score: 3.6, avg_naver_reviews: 30, avg_google_score: 3.3, avg_google_reviews: 3, avg_instagram_hashtags: 80, google_registration_rate: 0.08, tripadvisor_registration_rate: 0.01, english_support_rate: 0.02 },
  }},
  { business_type: "양식", tiers: {
    S: { avg_naver_score: 4.3, avg_naver_reviews: 180, avg_google_score: 4.1, avg_google_reviews: 35, avg_instagram_hashtags: 2000, google_registration_rate: 0.6, tripadvisor_registration_rate: 0.2, english_support_rate: 0.3 },
    A: { avg_naver_score: 4.1, avg_naver_reviews: 120, avg_google_score: 3.9, avg_google_reviews: 22, avg_instagram_hashtags: 1000, google_registration_rate: 0.4, tripadvisor_registration_rate: 0.1, english_support_rate: 0.18 },
    B: { avg_naver_score: 3.9, avg_naver_reviews: 65, avg_google_score: 3.7, avg_google_reviews: 8, avg_instagram_hashtags: 400, google_registration_rate: 0.22, tripadvisor_registration_rate: 0.04, english_support_rate: 0.08 },
    C: { avg_naver_score: 3.7, avg_naver_reviews: 30, avg_google_score: 3.4, avg_google_reviews: 3, avg_instagram_hashtags: 120, google_registration_rate: 0.1, tripadvisor_registration_rate: 0.01, english_support_rate: 0.03 },
  }},
  { business_type: "소품샵", tiers: {
    S: { avg_naver_score: 4.3, avg_naver_reviews: 80, avg_google_score: 4.0, avg_google_reviews: 20, avg_instagram_hashtags: 3000, google_registration_rate: 0.5, tripadvisor_registration_rate: 0.08, english_support_rate: 0.25 },
    A: { avg_naver_score: 4.1, avg_naver_reviews: 50, avg_google_score: 3.8, avg_google_reviews: 12, avg_instagram_hashtags: 1500, google_registration_rate: 0.35, tripadvisor_registration_rate: 0.04, english_support_rate: 0.15 },
    B: { avg_naver_score: 3.9, avg_naver_reviews: 30, avg_google_score: 3.6, avg_google_reviews: 5, avg_instagram_hashtags: 500, google_registration_rate: 0.2, tripadvisor_registration_rate: 0.02, english_support_rate: 0.08 },
    C: { avg_naver_score: 3.7, avg_naver_reviews: 15, avg_google_score: 3.3, avg_google_reviews: 2, avg_instagram_hashtags: 150, google_registration_rate: 0.08, tripadvisor_registration_rate: 0.01, english_support_rate: 0.03 },
  }},
  { business_type: "헤어샵", tiers: {
    S: { avg_naver_score: 4.5, avg_naver_reviews: 180, avg_google_score: 4.2, avg_google_reviews: 30, avg_instagram_hashtags: 2200, google_registration_rate: 0.6, tripadvisor_registration_rate: 0.1, english_support_rate: 0.3 },
    A: { avg_naver_score: 4.3, avg_naver_reviews: 120, avg_google_score: 4.0, avg_google_reviews: 18, avg_instagram_hashtags: 1100, google_registration_rate: 0.4, tripadvisor_registration_rate: 0.05, english_support_rate: 0.15 },
    B: { avg_naver_score: 4.1, avg_naver_reviews: 60, avg_google_score: 3.8, avg_google_reviews: 8, avg_instagram_hashtags: 400, google_registration_rate: 0.22, tripadvisor_registration_rate: 0.02, english_support_rate: 0.08 },
    C: { avg_naver_score: 3.9, avg_naver_reviews: 30, avg_google_score: 3.5, avg_google_reviews: 3, avg_instagram_hashtags: 120, google_registration_rate: 0.1, tripadvisor_registration_rate: 0.01, english_support_rate: 0.03 },
  }},
];

async function main() {
  const { data: existing } = await supabase.from("benchmarks").select("business_type, district_tier");
  const existingSet = new Set(existing.map(b => b.business_type + "_" + b.district_tier));

  let added = 0, skipped = 0;
  for (const biz of NEW) {
    for (const [tier, data] of Object.entries(biz.tiers)) {
      if (existingSet.has(biz.business_type + "_" + tier)) { skipped++; continue; }
      const { error } = await supabase.from("benchmarks").insert({ business_type: biz.business_type, district_tier: tier, ...data });
      if (error) console.error("❌ " + biz.business_type + " " + tier + ":", error.message);
      else added++;
    }
  }

  const { count } = await supabase.from("benchmarks").select("*", { count: "exact", head: true });
  const { data: all } = await supabase.from("benchmarks").select("business_type");
  const types = [...new Set(all.map(b => b.business_type))];
  console.log("✅ " + added + "개 추가 / " + skipped + "개 스킵");
  console.log("현재 벤치마크: " + count + "개 (" + types.length + "개 업종)");
  console.log("업종: " + types.join(", "));
}
main();
