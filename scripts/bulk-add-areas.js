/**
 * 전국 주요 상권 일괄 등록 스크립트
 * - 중복 체크: district_id 기준으로 이미 있으면 스킵
 * - 별칭도 중복 체크 후 신규만 등록
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ===== 추가할 상권 리스트 =====
const NEW_AREAS = [
  // --- 서울 추가 ---
  {
    district_id: "seoul-hyehwa", district_name: "혜화/대학로", city: "서울", tourist_rank: "A",
    foreign_visitor_ratio: 0.20, daily_foot_traffic: 70000,
    popular_business_types: ["카페", "음식점", "공연장", "소극장"],
    nearby_landmarks: ["혜화역", "대학로", "마로니에공원", "성균관대"],
    google_maps_search_volume: "medium", avg_naver_review_count: 110, avg_google_review_count: 20, competitor_density: "medium",
    aliases: ["혜화", "혜화역", "대학로"]
  },
  {
    district_id: "seoul-gwanghwamun", district_name: "광화문", city: "서울", tourist_rank: "A",
    foreign_visitor_ratio: 0.40, daily_foot_traffic: 100000,
    popular_business_types: ["한식당", "카페", "음식점"],
    nearby_landmarks: ["광화문광장", "경복궁", "광화문역", "세종문화회관"],
    google_maps_search_volume: "high", avg_naver_review_count: 130, avg_google_review_count: 35, competitor_density: "medium",
    aliases: ["광화문", "광화문역", "광화문광장", "세종로"]
  },
  {
    district_id: "seoul-jongno", district_name: "종로", city: "서울", tourist_rank: "A",
    foreign_visitor_ratio: 0.30, daily_foot_traffic: 90000,
    popular_business_types: ["한식당", "카페", "전통찻집"],
    nearby_landmarks: ["종로", "종각역", "보신각", "청계천"],
    google_maps_search_volume: "medium", avg_naver_review_count: 120, avg_google_review_count: 25, competitor_density: "medium",
    aliases: ["종로", "종각", "종각역", "청계천"]
  },
  {
    district_id: "seoul-garosugil", district_name: "가로수길", city: "서울", tourist_rank: "A",
    foreign_visitor_ratio: 0.30, daily_foot_traffic: 80000,
    popular_business_types: ["카페", "뷰티샵", "소품샵", "음식점"],
    nearby_landmarks: ["신사역", "가로수길", "압구정로데오"],
    google_maps_search_volume: "medium", avg_naver_review_count: 150, avg_google_review_count: 30, competitor_density: "high",
    aliases: ["가로수길", "신사동", "신사역"]
  },
  {
    district_id: "seoul-yongsan", district_name: "용산", city: "서울", tourist_rank: "B",
    foreign_visitor_ratio: 0.15, daily_foot_traffic: 80000,
    popular_business_types: ["음식점", "카페", "전자상가"],
    nearby_landmarks: ["용산역", "국립중앙박물관", "용산전자상가", "아이파크몰"],
    google_maps_search_volume: "low", avg_naver_review_count: 100, avg_google_review_count: 10, competitor_density: "medium",
    aliases: ["용산", "용산역", "용산구"]
  },
  {
    district_id: "seoul-ttukseom", district_name: "뚝섬/성수", city: "서울", tourist_rank: "A",
    foreign_visitor_ratio: 0.25, daily_foot_traffic: 70000,
    popular_business_types: ["카페", "갤러리", "브런치", "소품샵"],
    nearby_landmarks: ["뚝섬역", "서울숲", "성수동 카페거리"],
    google_maps_search_volume: "medium", avg_naver_review_count: 140, avg_google_review_count: 25, competitor_density: "high",
    aliases: ["뚝섬역", "성수동 카페거리", "서울숲역"]
  },
  {
    district_id: "seoul-itaewon-hbc", district_name: "해방촌/남산", city: "서울", tourist_rank: "A",
    foreign_visitor_ratio: 0.35, daily_foot_traffic: 40000,
    popular_business_types: ["카페", "음식점", "바", "소품샵"],
    nearby_landmarks: ["남산타워", "해방촌", "숙대입구역"],
    google_maps_search_volume: "medium", avg_naver_review_count: 90, avg_google_review_count: 25, competitor_density: "low",
    aliases: ["남산", "남산타워", "숙대입구", "숙대입구역"]
  },

  // --- 부산 추가 ---
  {
    district_id: "busan-nampo", district_name: "남포동", city: "부산", tourist_rank: "A",
    foreign_visitor_ratio: 0.30, daily_foot_traffic: 90000,
    popular_business_types: ["음식점", "카페", "쇼핑", "횟집"],
    nearby_landmarks: ["남포역", "자갈치시장", "BIFF광장", "용두산공원"],
    google_maps_search_volume: "high", avg_naver_review_count: 140, avg_google_review_count: 30, competitor_density: "high",
    aliases: ["남포동", "남포역", "자갈치", "자갈치시장", "BIFF광장", "부평깡통시장"]
  },
  {
    district_id: "busan-gamcheon", district_name: "감천문화마을", city: "부산", tourist_rank: "A",
    foreign_visitor_ratio: 0.45, daily_foot_traffic: 30000,
    popular_business_types: ["카페", "기념품샵", "갤러리"],
    nearby_landmarks: ["감천문화마을", "감정역"],
    google_maps_search_volume: "high", avg_naver_review_count: 80, avg_google_review_count: 35, competitor_density: "low",
    aliases: ["감천문화마을", "감천마을"]
  },
  {
    district_id: "busan-gwangalli", district_name: "광안리", city: "부산", tourist_rank: "A",
    foreign_visitor_ratio: 0.25, daily_foot_traffic: 80000,
    popular_business_types: ["카페", "음식점", "바", "횟집"],
    nearby_landmarks: ["광안리해수욕장", "광안대교", "광안역"],
    google_maps_search_volume: "high", avg_naver_review_count: 130, avg_google_review_count: 25, competitor_density: "high",
    aliases: ["광안리해수욕장", "광안리역", "광안대교"]
  },
  {
    district_id: "busan-gijang", district_name: "기장", city: "부산", tourist_rank: "B",
    foreign_visitor_ratio: 0.15, daily_foot_traffic: 40000,
    popular_business_types: ["횟집", "카페", "음식점"],
    nearby_landmarks: ["기장시장", "해동용궁사", "오시리아"],
    google_maps_search_volume: "medium", avg_naver_review_count: 90, avg_google_review_count: 15, competitor_density: "medium",
    aliases: ["기장", "기장시장", "해동용궁사", "오시리아"]
  },

  // --- 대구 ---
  {
    district_id: "daegu-dongseongro", district_name: "동성로", city: "대구", tourist_rank: "B",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 100000,
    popular_business_types: ["음식점", "카페", "뷰티샵", "쇼핑"],
    nearby_landmarks: ["동성로", "중앙로역", "대구역", "서문시장"],
    google_maps_search_volume: "low", avg_naver_review_count: 120, avg_google_review_count: 8, competitor_density: "high",
    aliases: ["동성로", "대구", "대구역", "중앙로", "반월당", "서문시장"]
  },
  {
    district_id: "daegu-suseong", district_name: "수성못", city: "대구", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 50000,
    popular_business_types: ["카페", "음식점", "뷰티샵"],
    nearby_landmarks: ["수성못", "수성구", "들안길"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 5, competitor_density: "medium",
    aliases: ["수성못", "수성구", "들안길"]
  },

  // --- 대전 ---
  {
    district_id: "daejeon-dunsan", district_name: "둔산동", city: "대전", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 80000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["둔산동", "시청역", "갤러리아백화점", "타임월드"],
    google_maps_search_volume: "low", avg_naver_review_count: 100, avg_google_review_count: 5, competitor_density: "medium",
    aliases: ["둔산동", "대전", "대전역", "대전시청", "성심당"]
  },

  // --- 광주 ---
  {
    district_id: "gwangju-chungjangro", district_name: "충장로", city: "광주", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 70000,
    popular_business_types: ["음식점", "카페", "쇼핑"],
    nearby_landmarks: ["충장로", "금남로", "양림동", "국립아시아문화전당"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 5, competitor_density: "medium",
    aliases: ["충장로", "광주", "광주역", "금남로", "양림동"]
  },

  // --- 인천 ---
  {
    district_id: "incheon-chinatown", district_name: "차이나타운/월미도", city: "인천", tourist_rank: "A",
    foreign_visitor_ratio: 0.25, daily_foot_traffic: 60000,
    popular_business_types: ["중식당", "카페", "기념품샵"],
    nearby_landmarks: ["인천역", "차이나타운", "월미도", "자유공원"],
    google_maps_search_volume: "medium", avg_naver_review_count: 100, avg_google_review_count: 20, competitor_density: "medium",
    aliases: ["차이나타운", "월미도", "인천 차이나타운", "인천역"]
  },
  {
    district_id: "incheon-songdo", district_name: "송도", city: "인천", tourist_rank: "B",
    foreign_visitor_ratio: 0.15, daily_foot_traffic: 60000,
    popular_business_types: ["카페", "음식점", "뷰티샵"],
    nearby_landmarks: ["송도센트럴파크", "트리플스트리트", "컨벤시아"],
    google_maps_search_volume: "low", avg_naver_review_count: 110, avg_google_review_count: 10, competitor_density: "medium",
    aliases: ["송도", "송도신도시", "인천송도"]
  },

  // --- 강원 ---
  {
    district_id: "gangneung", district_name: "강릉", city: "강릉", tourist_rank: "A",
    foreign_visitor_ratio: 0.15, daily_foot_traffic: 50000,
    popular_business_types: ["카페", "횟집", "음식점", "빵집"],
    nearby_landmarks: ["강릉역", "경포대", "안목해변", "월화거리"],
    google_maps_search_volume: "medium", avg_naver_review_count: 120, avg_google_review_count: 15, competitor_density: "medium",
    aliases: ["강릉", "강릉역", "경포대", "안목해변", "안목카페거리"]
  },
  {
    district_id: "sokcho", district_name: "속초", city: "속초", tourist_rank: "A",
    foreign_visitor_ratio: 0.15, daily_foot_traffic: 40000,
    popular_business_types: ["횟집", "카페", "음식점"],
    nearby_landmarks: ["속초해수욕장", "설악산", "속초중앙시장", "아바이마을"],
    google_maps_search_volume: "medium", avg_naver_review_count: 100, avg_google_review_count: 12, competitor_density: "medium",
    aliases: ["속초", "속초시", "설악산", "속초해수욕장"]
  },
  {
    district_id: "chuncheon", district_name: "춘천", city: "춘천", tourist_rank: "B",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 40000,
    popular_business_types: ["닭갈비", "카페", "음식점"],
    nearby_landmarks: ["춘천역", "남이섬", "명동닭갈비골목", "소양강"],
    google_maps_search_volume: "medium", avg_naver_review_count: 90, avg_google_review_count: 10, competitor_density: "medium",
    aliases: ["춘천", "춘천역", "남이섬", "춘천닭갈비"]
  },

  // --- 경상 ---
  {
    district_id: "tongyeong", district_name: "통영", city: "통영", tourist_rank: "B",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 35000,
    popular_business_types: ["횟집", "카페", "음식점"],
    nearby_landmarks: ["통영항", "동피랑벽화마을", "중앙시장", "한려수도"],
    google_maps_search_volume: "medium", avg_naver_review_count: 80, avg_google_review_count: 8, competitor_density: "low",
    aliases: ["통영", "통영시", "동피랑", "통영항"]
  },
  {
    district_id: "pohang", district_name: "포항", city: "포항", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 30000,
    popular_business_types: ["횟집", "카페", "음식점"],
    nearby_landmarks: ["호미곶", "영일대해수욕장", "구룡포"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 5, competitor_density: "low",
    aliases: ["포항", "포항시", "호미곶", "구룡포"]
  },

  // --- 전라 ---
  {
    district_id: "yeosu", district_name: "여수", city: "여수", tourist_rank: "A",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 50000,
    popular_business_types: ["횟집", "카페", "음식점"],
    nearby_landmarks: ["여수엑스포", "오동도", "여수밤바다", "이순신광장"],
    google_maps_search_volume: "medium", avg_naver_review_count: 110, avg_google_review_count: 10, competitor_density: "medium",
    aliases: ["여수", "여수시", "여수밤바다", "여수엑스포", "오동도"]
  },
  {
    district_id: "suncheon", district_name: "순천", city: "순천", tourist_rank: "B",
    foreign_visitor_ratio: 0.08, daily_foot_traffic: 30000,
    popular_business_types: ["한식당", "카페", "음식점"],
    nearby_landmarks: ["순천만습지", "순천만국가정원", "낙안읍성"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 8, competitor_density: "low",
    aliases: ["순천", "순천시", "순천만", "순천만습지", "낙안읍성"]
  },
  {
    district_id: "damyang", district_name: "담양", city: "담양", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 20000,
    popular_business_types: ["한식당", "카페", "대나무숲"],
    nearby_landmarks: ["죽녹원", "메타세쿼이아길", "담양호"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 5, competitor_density: "low",
    aliases: ["담양", "죽녹원", "메타세쿼이아길"]
  },

  // --- 경기 추가 ---
  {
    district_id: "paju", district_name: "파주", city: "파주", tourist_rank: "B",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 40000,
    popular_business_types: ["카페", "음식점", "아울렛"],
    nearby_landmarks: ["파주프리미엄아울렛", "헤이리마을", "임진각", "DMZ"],
    google_maps_search_volume: "medium", avg_naver_review_count: 80, avg_google_review_count: 10, competitor_density: "low",
    aliases: ["파주", "헤이리", "헤이리마을", "파주아울렛", "임진각"]
  },
  {
    district_id: "pangyo", district_name: "판교", city: "성남", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 70000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["판교역", "판교테크노밸리", "현대백화점"],
    google_maps_search_volume: "low", avg_naver_review_count: 120, avg_google_review_count: 5, competitor_density: "high",
    aliases: ["판교", "판교역", "판교테크노밸리"]
  },
  {
    district_id: "ilsan", district_name: "일산", city: "고양", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 80000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["웨스턴돔", "라페스타", "일산호수공원", "킨텍스"],
    google_maps_search_volume: "low", avg_naver_review_count: 100, avg_google_review_count: 5, competitor_density: "high",
    aliases: ["일산", "일산역", "라페스타", "웨스턴돔", "킨텍스"]
  },

  // --- 충청 ---
  {
    district_id: "cheonan", district_name: "천안", city: "천안", tourist_rank: "C",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 60000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["천안역", "신부동", "독립기념관"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["천안", "천안역", "천안시", "신부동"]
  },

  // --- 제주 추가 ---
  {
    district_id: "jeju-hallim", district_name: "한림/협재", city: "제주", tourist_rank: "A",
    foreign_visitor_ratio: 0.20, daily_foot_traffic: 30000,
    popular_business_types: ["카페", "음식점", "횟집"],
    nearby_landmarks: ["협재해수욕장", "한림공원", "금능해수욕장"],
    google_maps_search_volume: "medium", avg_naver_review_count: 90, avg_google_review_count: 15, competitor_density: "low",
    aliases: ["한림", "협재", "협재해수욕장", "금능해수욕장"]
  },
  {
    district_id: "jeju-seongsan", district_name: "성산", city: "제주", tourist_rank: "A",
    foreign_visitor_ratio: 0.25, daily_foot_traffic: 25000,
    popular_business_types: ["카페", "횟집", "음식점"],
    nearby_landmarks: ["성산일출봉", "섭지코지", "우도"],
    google_maps_search_volume: "high", avg_naver_review_count: 80, avg_google_review_count: 20, competitor_density: "low",
    aliases: ["성산", "성산일출봉", "섭지코지", "우도"]
  },
];

async function main() {
  console.log("\n=== K-BOOST 상권 일괄 등록 ===\n");

  // 기존 데이터 조회 (중복 체크용)
  const { data: existingAreas } = await supabase.from("areas").select("district_id");
  const existingIds = new Set(existingAreas.map((a) => a.district_id));

  const { data: existingAliases } = await supabase.from("area_aliases").select("alias");
  const existingAliasSet = new Set(existingAliases.map((a) => a.alias));

  let addedAreas = 0;
  let skippedAreas = 0;
  let addedAliases = 0;
  let skippedAliases = 0;

  for (const area of NEW_AREAS) {
    const { aliases, ...areaData } = area;

    // 상권 중복 체크
    if (existingIds.has(areaData.district_id)) {
      console.log(`⏭️  ${areaData.district_name} (${areaData.district_id}) — 이미 존재, 스킵`);
      skippedAreas++;
    } else {
      const { error } = await supabase.from("areas").insert(areaData);
      if (error) {
        console.error(`❌ ${areaData.district_name} 실패:`, error.message);
      } else {
        console.log(`✅ ${areaData.district_name} (${areaData.city}) — ${areaData.tourist_rank}등급 추가`);
        existingIds.add(areaData.district_id);
        addedAreas++;
      }
    }

    // 별칭 중복 체크 후 등록
    if (aliases && aliases.length > 0) {
      const newAliases = aliases.filter((a) => !existingAliasSet.has(a));
      const dupAliases = aliases.filter((a) => existingAliasSet.has(a));

      if (dupAliases.length > 0) {
        skippedAliases += dupAliases.length;
      }

      if (newAliases.length > 0) {
        const rows = newAliases.map((alias) => ({ alias, district_id: areaData.district_id }));
        const { error } = await supabase.from("area_aliases").insert(rows);
        if (error) {
          console.error(`  별칭 실패:`, error.message);
        } else {
          addedAliases += newAliases.length;
          newAliases.forEach((a) => existingAliasSet.add(a));
        }
      }
    }
  }

  console.log("\n=== 결과 ===");
  console.log(`상권: ${addedAreas}개 추가 / ${skippedAreas}개 스킵 (중복)`);
  console.log(`별칭: ${addedAliases}개 추가 / ${skippedAliases}개 스킵 (중복)`);

  // 최종 현황
  const { count: totalAreas } = await supabase.from("areas").select("*", { count: "exact", head: true });
  const { count: totalAliases } = await supabase.from("area_aliases").select("*", { count: "exact", head: true });
  console.log(`\n현재 DB 총계: 상권 ${totalAreas}개 / 별칭 ${totalAliases}개`);
}

main().catch(console.error);
