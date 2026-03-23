"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ScoreBreakdown, Grade } from "@/lib/types";

const DIMENSIONS = [
  { label: "온라인 존재 현황", key: "online_presence" as const, max: 20 },
  { label: "리뷰 현황", key: "review_status" as const, max: 20 },
  { label: "비주얼 콘텐츠", key: "visual_content" as const, max: 15 },
  { label: "위치/접근성", key: "accessibility" as const, max: 20 },
  { label: "K-화 잠재력", key: "k_potential" as const, max: 15 },
  { label: "대표자 준비도", key: "owner_readiness" as const, max: 10 },
];

const GRADE_CONFIG = {
  S: { label: "K-글로벌 황금 매장", rank: "상위 5%" },
  A: { label: "K-글로벌 유망 매장", rank: "상위 20%" },
  B: { label: "K-글로벌 가능 매장", rank: "상위 50%" },
  C: { label: "K-글로벌 준비 단계", rank: "" },
  D: { label: "재검토 필요", rank: "" },
};

interface ScoreRingProps {
  score: number;
  grade: Grade;
  breakdown?: ScoreBreakdown;
  onAnimationDone?: () => void;
}

function useCountUp(target: number, duration: number, delay: number): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}

export default function ScoreRing({ score, grade, breakdown, onAnimationDone }: ScoreRingProps) {
  const r = 65;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = GRADE_CONFIG[grade] || GRADE_CONFIG.C;

  const displayScore = useCountUp(score, 1400, 400);
  const [ringReady, setRingReady] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [barsReady, setBarsReady] = useState(false);

  const stableCallback = useCallback(() => onAnimationDone?.(), [onAnimationDone]);

  useEffect(() => {
    const t1 = setTimeout(() => setRingReady(true), 300);
    const t2 = setTimeout(() => setShowBadge(true), 1200);
    const t3 = setTimeout(() => setBarsReady(true), 1000);
    const t4 = setTimeout(() => stableCallback(), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [stableCallback]);

  return (
    <div>
      {/* Score Ring Card */}
      <div className="text-center py-7 px-5 bg-white/[0.04] border border-white/[0.08] rounded-[14px]">
        {/* Ring */}
        <div className="relative w-[160px] h-[160px] mx-auto mb-4">
          <svg width="160" height="160" viewBox="0 0 160 160" className="block rotate-[-90deg]">
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b81" />
                <stop offset="50%" stopColor="#e8254d" />
                <stop offset="100%" stopColor="#C50337" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
            <circle
              cx="80" cy="80" r={r} fill="none"
              stroke="url(#scoreGrad)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={ringReady ? offset : circ}
              style={{
                transition: "stroke-dashoffset 1.5s ease-out",
                filter: "drop-shadow(0 0 6px rgba(232,37,77,0.4))",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-outfit text-[48px] font-black leading-none text-white">
              {displayScore}
            </span>
            <span className="text-[18px] font-bold text-white/50 mt-0.5">점</span>
          </div>
        </div>

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 py-1.5 px-3.5 bg-[rgba(197,3,55,0.08)] border border-[rgba(197,3,55,0.15)] rounded-[20px]"
          style={{
            opacity: showBadge ? 1 : 0,
            transform: showBadge ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <span className="text-[12px] font-bold text-white flex items-center gap-1">
            <span className="w-[18px] h-[18px] bg-[#C50337] rounded flex items-center justify-center text-[10px] font-black text-white font-outfit">
              {grade}
            </span>
            {c.label}
          </span>
          {c.rank && (
            <span className="text-[11px] font-semibold text-[#e8254d] bg-[rgba(197,3,55,0.12)] py-0.5 px-2 rounded-[10px]">
              {c.rank}
            </span>
          )}
        </div>
      </div>

      {/* Category Bars Card */}
      {breakdown && (
        <div className="mt-7 flex flex-col gap-3 p-5 bg-white/[0.04] border border-white/[0.08] rounded-[14px]">
          {DIMENSIONS.map((d, i) => {
            const val = breakdown[d.key] || 0;
            const pct = Math.round((val / d.max) * 100);
            const delayMs = i * 120;
            return (
              <div
                key={d.key}
                className="flex items-center gap-3"
                style={{
                  opacity: barsReady ? 1 : 0,
                  transform: barsReady ? "translateX(0)" : "translateX(-12px)",
                  transition: `opacity 0.4s ease ${delayMs}ms, transform 0.4s ease ${delayMs}ms`,
                }}
              >
                <span className="w-[100px] text-[12.5px] font-medium text-white/60 tracking-[-0.2px] shrink-0">
                  {d.label}
                </span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded overflow-hidden">
                  <div
                    className="h-full rounded bg-gradient-to-r from-[#e8254d] to-[#ff6b81]"
                    style={{
                      width: barsReady ? `${pct}%` : "0%",
                      transition: `width 1s ease-out ${delayMs + 100}ms`,
                      transformOrigin: "left",
                    }}
                  />
                </div>
                <span className="w-[42px] text-right text-[13px] font-bold text-white/55 font-outfit shrink-0">
                  {val} / {d.max}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
