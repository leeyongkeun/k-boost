import { Question } from "./types";

export const QUESTIONS: Question[] = [
  {
    id: "store_info",
    type: "text",
    question: "매장명과 위치를 알려주세요",
    placeholder: "예: 카페모아, 서울 마포구 홍대입구역",
    sub: "정확한 매장명을 입력하면 더 정밀한 분석이 가능해요",
  },
  {
    id: "foreign_ratio",
    type: "radio",
    question: "현재 외국인 손님 비율은?",
    options: [
      { label: "거의 없음", value: "very_low", emoji: "😅" },
      { label: "~30%", value: "low", emoji: "🤔" },
      { label: "~60%", value: "medium", emoji: "😊" },
      { label: "60%+", value: "high", emoji: "🔥" },
    ],
  },
  {
    id: "change_willingness",
    type: "radio",
    question: "외국인 손님을 위해 바꿀 의향은?",
    options: [
      { label: "조금만", value: "low", emoji: "🌱" },
      { label: "절반 정도", value: "medium", emoji: "🌿" },
      { label: "전부 다!", value: "high", emoji: "🔥" },
    ],
  },
];
