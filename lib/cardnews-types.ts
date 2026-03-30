export interface CardNewsItem {
  index: number;
  type: "cover" | "content" | "cta";
  headline: string;
  subHeadline?: string;
  bodyPoints: string[];
  statValue?: string;
  statLabel?: string;
  source?: string;
  gradientKey: string;
  imageKeyword?: string;
  imageUrl?: string;
}

export interface CardNewsSet {
  generatedAt: string;
  cards: CardNewsItem[];
  setId?: string | null;
  saved?: boolean;
  saveError?: string | null;
}
