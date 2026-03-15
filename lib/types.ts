export interface QuestionOption {
  label: string;
  value: string;
  emoji: string;
}

export interface Question {
  id: string;
  type: "text" | "radio";
  question: string;
  placeholder?: string;
  sub?: string;
  options?: QuestionOption[];
}

export interface ScoreBreakdown {
  online_presence: number;   // 온라인 존재감 (0-20)
  review_status: number;     // 리뷰 현황 (0-20)
  visual_content: number;    // 비주얼 콘텐츠 (0-15)
  accessibility: number;     // 위치/접근성 (0-20)
  k_potential: number;       // K-화 잠재력 (0-15)
  owner_readiness: number;   // 대표자 준비도 (0-10)
}

export type Grade = "S" | "A" | "B" | "C" | "D";

export interface PlatformInfo {
  name: string;
  registered: boolean;
  score?: number;
  reviewCount?: number;
  hasPhotos?: boolean;
  hasEnglish?: boolean;
  link?: string;
  category?: string;
}

export interface KeyMetric {
  label: string;
  value: string;
  status: "good" | "warning" | "critical";
  detail: string;
}

export interface AnalysisResult {
  grade: Grade;
  score: number;
  score_breakdown: ScoreBreakdown;
  store_name: string;
  business_type: string;
  store_address?: string;
  store_phone?: string;
  platforms: PlatformInfo[];
  title: string;
  summary: string;
  key_metrics: KeyMetric[];
  improvements: string[];
  action_plan: string;
  potential: string;
  cta_message: string;
}

export interface QuizAnswers {
  store_info?: string;
  foreign_ratio?: string;
  change_willingness?: string;
  [key: string]: string | undefined;
}

// --- 사전 수집 데이터 타입 ---

export interface AreaData {
  district_id: string;
  district_name: string;
  city: string;
  tourist_rank: "S" | "A" | "B" | "C";
  foreign_visitor_ratio: number;
  daily_foot_traffic: number;
  popular_business_types: string[];
  nearby_landmarks: string[];
  google_maps_search_volume: "high" | "medium" | "low";
  avg_naver_review_count: number;
  avg_google_review_count: number;
  competitor_density: "high" | "medium" | "low";
}

export interface StoreData {
  store_id: string;
  store_name: string;
  store_name_en?: string;
  district_id: string;
  address: string;
  business_type: string;
  platforms: {
    naver_map: { registered: boolean; score?: number; review_count?: number; photo_count?: number; has_english: boolean };
    kakao_map: { registered: boolean; score?: number; review_count?: number };
    google_maps: { registered: boolean; score?: number; review_count?: number; has_english_reviews: boolean; has_english_info: boolean };
    tripadvisor: { registered: boolean; score?: number; review_count?: number };
    instagram: { hashtag_count: number; has_official_account: boolean };
  };
  last_updated: string;
}

export interface BenchmarkTierData {
  avg_naver_score: number;
  avg_naver_reviews: number;
  avg_google_score: number;
  avg_google_reviews: number;
  avg_instagram_hashtags: number;
  google_registration_rate: number;
  tripadvisor_registration_rate: number;
  english_support_rate: number;
}

export interface BenchmarkData {
  business_type: string;
  tiers: Record<string, BenchmarkTierData>;
}

export interface LookupResult {
  matchType: "exact_store" | "area_benchmark" | "mock";
  store?: StoreData;
  area?: AreaData;
  benchmark?: BenchmarkTierData;
  businessType: string;
  confidence: number;
}
