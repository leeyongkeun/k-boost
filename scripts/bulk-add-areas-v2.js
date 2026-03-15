/**
 * 전국 생활권 상권 대규모 추가 (v2)
 * - 서울 생활권 + 수도권 확대 + 지방 보강
 * - 중복 자동 스킵
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NEW_AREAS = [
  // ========== 서울 생활권 ==========
  { district_id: "seoul-wangsimni", district_name: "왕십리/행당", city: "서울", tourist_rank: "B",
    foreign_visitor_ratio: 0.08, daily_foot_traffic: 80000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["왕십리역", "비트플렉스", "행당동"],
    google_maps_search_volume: "low", avg_naver_review_count: 100, avg_google_review_count: 5, competitor_density: "medium",
    aliases: ["왕십리", "왕십리역", "행당동", "행당역", "왕십리역 2호선", "왕십리역 5호선"] },

  { district_id: "seoul-nowon", district_name: "노원", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 90000,
    popular_business_types: ["음식점", "카페", "뷰티샵", "학원"],
    nearby_landmarks: ["노원역", "노원구", "중계동"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 3, competitor_density: "high",
    aliases: ["노원", "노원역", "노원구", "중계동", "상계동", "상계역", "노원역 4호선", "노원역 7호선"] },

  { district_id: "seoul-guro", district_name: "구로/디지털단지", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.08, daily_foot_traffic: 100000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["구로디지털단지역", "구로역", "가산디지털단지역"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 5, competitor_density: "high",
    aliases: ["구로", "구로역", "구로디지털단지", "구로디지털단지역", "가산", "가산디지털단지", "가산디지털단지역", "구로구"] },

  { district_id: "seoul-mokdong", district_name: "목동", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 60000,
    popular_business_types: ["음식점", "카페", "뷰티샵", "학원"],
    nearby_landmarks: ["목동역", "오목교역", "현대백화점 목동"],
    google_maps_search_volume: "low", avg_naver_review_count: 100, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["목동", "목동역", "오목교", "오목교역", "양천구"] },

  { district_id: "seoul-cheonho", district_name: "천호/강동", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 80000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["천호역", "현대백화점 천호", "강동구"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["천호", "천호역", "천호동", "강동", "강동구", "강동역", "길동", "둔촌동", "둔촌역"] },

  { district_id: "seoul-sadang", district_name: "사당/이수", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 90000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["사당역", "이수역", "남성역"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 3, competitor_density: "high",
    aliases: ["사당", "사당역", "이수", "이수역", "남성역", "사당역 2호선", "사당역 4호선"] },

  { district_id: "seoul-yeongdeungpo", district_name: "영등포/타임스퀘어", city: "서울", tourist_rank: "B",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 100000,
    popular_business_types: ["음식점", "카페", "쇼핑"],
    nearby_landmarks: ["영등포역", "타임스퀘어", "영등포시장"],
    google_maps_search_volume: "low", avg_naver_review_count: 110, avg_google_review_count: 8, competitor_density: "high",
    aliases: ["영등포", "영등포역", "영등포구", "타임스퀘어", "영등포시장", "영등포구청역"] },

  { district_id: "seoul-suyu", district_name: "수유/미아", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 70000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["수유역", "미아역", "미아사거리역", "북한산"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["수유", "수유역", "미아", "미아역", "미아사거리", "미아사거리역", "강북구"] },

  { district_id: "seoul-changdong", district_name: "창동/도봉", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 60000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["창동역", "도봉산역", "창동아레나"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 2, competitor_density: "medium",
    aliases: ["창동", "창동역", "도봉", "도봉산", "도봉산역", "도봉구", "쌍문역", "쌍문동"] },

  { district_id: "seoul-sangbong", district_name: "상봉/중랑", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 60000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["상봉역", "망우역", "중랑구"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 2, competitor_density: "medium",
    aliases: ["상봉", "상봉역", "중랑", "중랑구", "망우역", "면목동", "면목역"] },

  { district_id: "seoul-hoegi", district_name: "회기/경희대", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 50000,
    popular_business_types: ["음식점", "카페", "주점"],
    nearby_landmarks: ["회기역", "경희대학교", "외대앞역"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["회기", "회기역", "경희대", "경희대학교", "외대앞", "외대앞역"] },

  { district_id: "seoul-sinlim", district_name: "신림/봉천", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 80000,
    popular_business_types: ["음식점", "카페", "주점"],
    nearby_landmarks: ["신림역", "서울대입구역", "관악구"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 3, competitor_density: "high",
    aliases: ["신림", "신림역", "봉천", "봉천동", "서울대입구", "서울대입구역", "관악구", "낙성대", "낙성대역"] },

  { district_id: "seoul-daerim", district_name: "대림/구로", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.15, daily_foot_traffic: 70000,
    popular_business_types: ["중식당", "음식점", "카페"],
    nearby_landmarks: ["대림역", "남구로역", "대림중앙시장"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 5, competitor_density: "medium",
    aliases: ["대림", "대림역", "남구로", "남구로역", "대림동"] },

  { district_id: "seoul-gongdeok", district_name: "공덕/마포", city: "서울", tourist_rank: "B",
    foreign_visitor_ratio: 0.08, daily_foot_traffic: 90000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["공덕역", "마포역", "마포구청"],
    google_maps_search_volume: "low", avg_naver_review_count: 110, avg_google_review_count: 5, competitor_density: "medium",
    aliases: ["공덕", "공덕역", "마포", "마포역", "마포구청", "마포구", "도화동"] },

  { district_id: "seoul-magok", district_name: "마곡/발산", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 60000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["마곡역", "발산역", "마곡나루역", "LG사이언스파크"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["마곡", "마곡역", "마곡나루", "마곡나루역", "발산", "발산역", "강서구"] },

  { district_id: "seoul-bulgwang", district_name: "불광/연신내", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 60000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["불광역", "연신내역", "은평구"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 2, competitor_density: "medium",
    aliases: ["불광", "불광역", "연신내", "연신내역", "은평구", "응암역", "응암동"] },

  { district_id: "seoul-janghanpyeong", district_name: "장한평/답십리", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 50000,
    popular_business_types: ["음식점", "카페"],
    nearby_landmarks: ["장한평역", "답십리역", "장안동"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 2, competitor_density: "low",
    aliases: ["장한평", "장한평역", "답십리", "답십리역", "장안동", "동대문구"] },

  { district_id: "seoul-sinseol", district_name: "신설동/동묘", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 50000,
    popular_business_types: ["음식점", "카페", "빈티지"],
    nearby_landmarks: ["신설동역", "동묘앞역", "동묘시장"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 3, competitor_density: "low",
    aliases: ["신설동", "신설동역", "동묘", "동묘앞역", "동묘앞", "동묘시장"] },

  { district_id: "seoul-guui", district_name: "구의/광진", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 60000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["구의역", "광나루역", "아차산"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["구의", "구의역", "광진구", "광나루", "광나루역", "아차산", "아차산역"] },

  { district_id: "seoul-bangbae", district_name: "방배/서초", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 60000,
    popular_business_types: ["카페", "음식점", "뷰티샵"],
    nearby_landmarks: ["방배역", "서초역", "방배카페골목"],
    google_maps_search_volume: "low", avg_naver_review_count: 100, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["방배", "방배역", "방배동", "서초역", "서초동", "서초구"] },

  { district_id: "seoul-jamsilsaenae", district_name: "잠실새내/방이", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 60000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["잠실새내역", "방이동먹자골목", "올림픽공원"],
    google_maps_search_volume: "low", avg_naver_review_count: 100, avg_google_review_count: 5, competitor_density: "medium",
    aliases: ["잠실새내", "잠실새내역", "방이동", "방이역", "올림픽공원", "올림픽공원역", "몽촌토성역"] },

  { district_id: "seoul-gangdong-ogeum", district_name: "오금/개롱", city: "서울", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 40000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["오금역", "개롱역", "거여역"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 2, competitor_density: "low",
    aliases: ["오금", "오금역", "개롱", "개롱역", "거여", "거여역", "문정동", "문정역"] },

  // ========== 경기 수도권 확대 ==========
  { district_id: "bundang", district_name: "분당/정자", city: "성남", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 80000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["정자역", "서현역", "분당구청"],
    google_maps_search_volume: "low", avg_naver_review_count: 120, avg_google_review_count: 5, competitor_density: "high",
    aliases: ["분당", "분당구", "정자역", "정자동", "서현", "서현역", "수내역", "야탑역", "야탑", "이매역"] },

  { district_id: "anyang", district_name: "안양", city: "안양", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 70000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["안양역", "범계역", "평촌"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["안양", "안양역", "안양시", "범계", "범계역", "평촌", "평촌역", "인덕원", "인덕원역"] },

  { district_id: "bucheon", district_name: "부천", city: "부천", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 70000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["부천역", "중동역", "상동역"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["부천", "부천역", "부천시", "중동", "중동역", "상동", "상동역", "소사역", "소사"] },

  { district_id: "uijeongbu", district_name: "의정부", city: "의정부", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 60000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["의정부역", "의정부부대찌개골목", "신세계백화점"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["의정부", "의정부역", "의정부시", "의정부경전철"] },

  { district_id: "gwangmyeong", district_name: "광명", city: "광명", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 50000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["광명역", "광명사거리역", "이케아 광명", "코스트코 광명"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["광명", "광명역", "광명시", "광명사거리", "광명사거리역", "철산역", "철산동"] },

  { district_id: "gimpo", district_name: "김포", city: "김포", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 50000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["김포공항", "김포한강신도시", "구래역"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 2, competitor_density: "medium",
    aliases: ["김포", "김포시", "김포공항역", "구래역", "장기역", "김포한강신도시"] },

  { district_id: "pyeongtaek", district_name: "평택/송탄", city: "평택", tourist_rank: "C",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 50000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["평택역", "송탄", "평택미군기지"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 5, competitor_density: "low",
    aliases: ["평택", "평택역", "평택시", "송탄", "송탄역"] },

  { district_id: "hwaseong-dongtan", district_name: "동탄", city: "화성", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 60000,
    popular_business_types: ["카페", "음식점", "뷰티샵"],
    nearby_landmarks: ["동탄역", "동탄호수공원", "메타폴리스"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["동탄", "동탄역", "동탄신도시", "동탄2신도시", "화성시", "화성"] },

  { district_id: "yongin-suji", district_name: "용인/수지", city: "용인", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 60000,
    popular_business_types: ["카페", "음식점", "뷰티샵"],
    nearby_landmarks: ["수지구", "죽전역", "성복역", "에버랜드"],
    google_maps_search_volume: "low", avg_naver_review_count: 90, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["용인", "용인시", "수지", "수지구", "죽전", "죽전역", "성복역", "광교", "광교역", "광교중앙역"] },

  { district_id: "hanam", district_name: "하남/미사", city: "하남", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 50000,
    popular_business_types: ["카페", "음식점", "뷰티샵"],
    nearby_landmarks: ["하남스타필드", "미사역", "미사강변도시"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["하남", "하남시", "미사", "미사역", "하남스타필드", "스타필드 하남", "감일동"] },

  { district_id: "namyangju", district_name: "남양주/다산", city: "남양주", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 40000,
    popular_business_types: ["카페", "음식점", "뷰티샵"],
    nearby_landmarks: ["다산신도시", "도농역", "별내역"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 2, competitor_density: "low",
    aliases: ["남양주", "남양주시", "다산", "다산신도시", "도농역", "별내", "별내역"] },

  { district_id: "goyang-daeghwa", district_name: "고양/화정", city: "고양", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 50000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["화정역", "행신역", "스타필드 고양"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 2, competitor_density: "medium",
    aliases: ["화정", "화정역", "행신", "행신역", "고양시", "스타필드 고양", "덕양구"] },

  { district_id: "siheung-wolgot", district_name: "시흥/월곶", city: "시흥", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 30000,
    popular_business_types: ["음식점", "카페"],
    nearby_landmarks: ["시흥시", "월곶역", "시흥프리미엄아울렛"],
    google_maps_search_volume: "low", avg_naver_review_count: 60, avg_google_review_count: 2, competitor_density: "low",
    aliases: ["시흥", "시흥시", "월곶", "월곶역", "정왕역", "정왕동"] },

  { district_id: "gunpo", district_name: "군포/산본", city: "군포", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 40000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["산본역", "군포역"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 2, competitor_density: "low",
    aliases: ["군포", "군포시", "산본", "산본역", "군포역"] },

  { district_id: "gwacheon", district_name: "과천", city: "과천", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 30000,
    popular_business_types: ["카페", "음식점"],
    nearby_landmarks: ["과천역", "서울대공원", "렛츠런파크"],
    google_maps_search_volume: "low", avg_naver_review_count: 60, avg_google_review_count: 3, competitor_density: "low",
    aliases: ["과천", "과천역", "과천시", "서울대공원"] },

  { district_id: "osan", district_name: "오산", city: "오산", tourist_rank: "C",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 30000,
    popular_business_types: ["음식점", "카페"],
    nearby_landmarks: ["오산역", "오산대역", "오산미군기지"],
    google_maps_search_volume: "low", avg_naver_review_count: 60, avg_google_review_count: 3, competitor_density: "low",
    aliases: ["오산", "오산역", "오산시"] },

  { district_id: "icheon", district_name: "이천", city: "이천", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 30000,
    popular_business_types: ["음식점", "카페", "도자기"],
    nearby_landmarks: ["이천시", "이천도자기마을", "이천프리미엄아울렛"],
    google_maps_search_volume: "low", avg_naver_review_count: 60, avg_google_review_count: 3, competitor_density: "low",
    aliases: ["이천", "이천시", "이천도자기마을"] },

  { district_id: "yangpyeong", district_name: "양평", city: "양평", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 20000,
    popular_business_types: ["카페", "음식점", "펜션"],
    nearby_landmarks: ["양평역", "두물머리", "양평5일장"],
    google_maps_search_volume: "low", avg_naver_review_count: 60, avg_google_review_count: 3, competitor_density: "low",
    aliases: ["양평", "양평역", "양평군", "두물머리"] },

  { district_id: "gapyeong", district_name: "가평", city: "가평", tourist_rank: "B",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 25000,
    popular_business_types: ["카페", "펜션", "음식점"],
    nearby_landmarks: ["가평역", "남이섬", "자라섬", "쁘띠프랑스"],
    google_maps_search_volume: "medium", avg_naver_review_count: 80, avg_google_review_count: 8, competitor_density: "low",
    aliases: ["가평", "가평역", "가평군", "자라섬", "쁘띠프랑스", "남이섬 가평"] },

  // ========== 지방 보강 ==========
  // 울산
  { district_id: "ulsan-jungang", district_name: "울산 중구", city: "울산", tourist_rank: "C",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 50000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["울산역", "태화강공원", "울산중앙시장"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 5, competitor_density: "medium",
    aliases: ["울산", "울산역", "울산시", "울산중구", "태화강"] },

  // 창원/마산/진해
  { district_id: "changwon", district_name: "창원", city: "창원", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 50000,
    popular_business_types: ["음식점", "카페", "뷰티샵"],
    nearby_landmarks: ["창원역", "상남동", "진해 벚꽃"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 3, competitor_density: "medium",
    aliases: ["창원", "창원역", "창원시", "상남동", "마산", "마산역", "진해"] },

  // 김해
  { district_id: "gimhae", district_name: "김해", city: "김해", tourist_rank: "C",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 40000,
    popular_business_types: ["음식점", "카페"],
    nearby_landmarks: ["김해공항", "김해시", "수로왕릉"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 3, competitor_density: "low",
    aliases: ["김해", "김해시", "김해공항"] },

  // 안동
  { district_id: "andong", district_name: "안동", city: "안동", tourist_rank: "B",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 25000,
    popular_business_types: ["한식당", "카페", "기념품샵"],
    nearby_landmarks: ["안동하회마을", "안동찜닭골목", "월영교"],
    google_maps_search_volume: "medium", avg_naver_review_count: 80, avg_google_review_count: 10, competitor_density: "low",
    aliases: ["안동", "안동시", "하회마을", "안동하회마을", "안동찜닭"] },

  // 군산
  { district_id: "gunsan", district_name: "군산", city: "군산", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 25000,
    popular_business_types: ["카페", "빵집", "음식점"],
    nearby_landmarks: ["군산근대문화거리", "이성당", "경암동철길마을"],
    google_maps_search_volume: "low", avg_naver_review_count: 80, avg_google_review_count: 5, competitor_density: "low",
    aliases: ["군산", "군산시", "군산근대문화거리", "이성당"] },

  // 목포
  { district_id: "mokpo", district_name: "목포", city: "목포", tourist_rank: "B",
    foreign_visitor_ratio: 0.05, daily_foot_traffic: 25000,
    popular_business_types: ["횟집", "음식점", "카페"],
    nearby_landmarks: ["목포역", "유달산", "목포근대역사관"],
    google_maps_search_volume: "low", avg_naver_review_count: 70, avg_google_review_count: 5, competitor_density: "low",
    aliases: ["목포", "목포역", "목포시"] },

  // 제천
  { district_id: "jecheon", district_name: "제천", city: "제천", tourist_rank: "C",
    foreign_visitor_ratio: 0.03, daily_foot_traffic: 20000,
    popular_business_types: ["한식당", "카페"],
    nearby_landmarks: ["제천역", "청풍호", "의림지"],
    google_maps_search_volume: "low", avg_naver_review_count: 50, avg_google_review_count: 2, competitor_density: "low",
    aliases: ["제천", "제천역", "제천시", "청풍호"] },

  // 충주
  { district_id: "chungju", district_name: "충주", city: "충주", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 20000,
    popular_business_types: ["한식당", "카페"],
    nearby_landmarks: ["충주역", "충주호", "수안보온천"],
    google_maps_search_volume: "low", avg_naver_review_count: 50, avg_google_review_count: 2, competitor_density: "low",
    aliases: ["충주", "충주역", "충주시", "수안보"] },

  // 원주
  { district_id: "wonju", district_name: "원주", city: "원주", tourist_rank: "C",
    foreign_visitor_ratio: 0.02, daily_foot_traffic: 30000,
    popular_business_types: ["음식점", "카페"],
    nearby_landmarks: ["원주역", "치악산", "뮤지엄산"],
    google_maps_search_volume: "low", avg_naver_review_count: 60, avg_google_review_count: 2, competitor_density: "low",
    aliases: ["원주", "원주역", "원주시"] },

  // 양양
  { district_id: "yangyang", district_name: "양양", city: "양양", tourist_rank: "B",
    foreign_visitor_ratio: 0.10, daily_foot_traffic: 20000,
    popular_business_types: ["카페", "서핑샵", "음식점"],
    nearby_landmarks: ["양양공항", "서피비치", "낙산해수욕장"],
    google_maps_search_volume: "medium", avg_naver_review_count: 70, avg_google_review_count: 8, competitor_density: "low",
    aliases: ["양양", "양양군", "서피비치", "낙산해수욕장", "양양공항"] },
];

async function main() {
  console.log("\n=== K-BOOST 생활권/수도권 상권 일괄 등록 (v2) ===\n");

  const { data: existingAreas } = await supabase.from("areas").select("district_id");
  const existingIds = new Set(existingAreas.map(a => a.district_id));

  const { data: existingAliases } = await supabase.from("area_aliases").select("alias");
  const existingAliasSet = new Set(existingAliases.map(a => a.alias));

  let addedAreas = 0, skippedAreas = 0, addedAliases = 0, skippedAliases = 0;

  for (const area of NEW_AREAS) {
    const { aliases, ...areaData } = area;

    if (existingIds.has(areaData.district_id)) {
      console.log("  ⏭️  " + areaData.district_name + " — 이미 존재, 스킵");
      skippedAreas++;
    } else {
      const { error } = await supabase.from("areas").insert(areaData);
      if (error) {
        console.error("  ❌ " + areaData.district_name + ":", error.message);
      } else {
        console.log("  ✅ " + areaData.district_name + " (" + areaData.city + ") — " + areaData.tourist_rank + "등급");
        existingIds.add(areaData.district_id);
        addedAreas++;
      }
    }

    if (aliases && aliases.length > 0) {
      const newOnes = aliases.filter(a => !existingAliasSet.has(a));
      skippedAliases += aliases.length - newOnes.length;
      if (newOnes.length > 0) {
        const { error } = await supabase.from("area_aliases").insert(
          newOnes.map(alias => ({ alias, district_id: areaData.district_id }))
        );
        if (error) console.error("    별칭 실패:", error.message);
        else { addedAliases += newOnes.length; newOnes.forEach(a => existingAliasSet.add(a)); }
      }
    }
  }

  const { count: totalAreas } = await supabase.from("areas").select("*", { count: "exact", head: true });
  const { count: totalAliases } = await supabase.from("area_aliases").select("*", { count: "exact", head: true });

  console.log("\n=== 결과 ===");
  console.log("상권: +" + addedAreas + " 추가 / " + skippedAreas + " 스킵");
  console.log("별칭: +" + addedAliases + " 추가 / " + skippedAliases + " 스킵");
  console.log("\n현재 DB 총계: 상권 " + totalAreas + "개 / 별칭 " + totalAliases + "개");
}

main().catch(console.error);
