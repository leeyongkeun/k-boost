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
}

export interface CardNewsSet {
  generatedAt: string;
  cards: CardNewsItem[];
}
