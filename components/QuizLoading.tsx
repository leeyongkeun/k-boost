"use client";

import { useState, useEffect, useRef } from "react";

const LOADING_MESSAGES = [
  "매장 정보 수집 중...",
  "국내 플랫폼 분석 중...",
  "해외 플랫폼 조회 중...",
  "리뷰 데이터 분석 중...",
  "K-글로벌 잠재력 계산 중...",
  "맞춤 리포트 생성 중...",
];

export default function QuizLoading() {
  const [loadingIdx, setLoadingIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setLoadingIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70dvh] text-center px-6">
      <div className="relative w-[100px] h-[100px] mb-8">
        <div className="w-[100px] h-[100px] rounded-full border-[3px] border-white/[0.06] border-t-[#C50337] animate-spin" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[36px]">
          🔍
        </div>
      </div>
      <h2 className="text-xl font-bold mb-3">매장 데이터를 분석하고 있어요</h2>
      <p className="text-white/50 text-[14px] animate-pulse min-h-[24px] leading-relaxed">
        {LOADING_MESSAGES[loadingIdx]}
      </p>
      <div className="mt-10 flex justify-center gap-2">
        {LOADING_MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              i <= loadingIdx ? "bg-[#C50337]" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
