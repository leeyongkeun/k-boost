"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ScoreBreakdown, Grade } from "@/lib/types";

const DIMENSIONS = [
  { label: "온라인 존재감", key: "online_presence" as const, max: 20, color: "#a78bfa" },
  { label: "리뷰 현황", key: "review_status" as const, max: 20, color: "#c084fc" },
  { label: "비주얼 콘텐츠", key: "visual_content" as const, max: 15, color: "#f0abfc" },
  { label: "위치/접근성", key: "accessibility" as const, max: 20, color: "#ec4899" },
  { label: "K-화 잠재력", key: "k_potential" as const, max: 15, color: "#f472b6" },
  { label: "대표자 준비도", key: "owner_readiness" as const, max: 10, color: "#FFD700" },
];

const GRADE_CONFIG = {
  S: { badge: "from-yellow-400 to-orange-500", badgeText: "text-gray-900", label: "K-글로벌 황금 매장", pct: "상위 5%" },
  A: { badge: "from-purple-600 to-purple-500", badgeText: "text-white", label: "K-글로벌 유망 매장", pct: "상위 20%" },
  B: { badge: "from-blue-500 to-blue-400", badgeText: "text-white", label: "K-글로벌 가능 매장", pct: "상위 50%" },
  C: { badge: "from-gray-500 to-gray-400", badgeText: "text-white", label: "K-글로벌 준비 단계", pct: "" },
  D: { badge: "from-gray-600 to-gray-500", badgeText: "text-white", label: "재검토 필요", pct: "" },
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
  const r = 62;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = GRADE_CONFIG[grade] || GRADE_CONFIG.C;

  const displayScore = useCountUp(score, 1400, 400);
  const [ringReady, setRingReady] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [barsReady, setBarsReady] = useState(false);

  const stableCallback = useCallback(() => onAnimationDone?.(), [onAnimationDone]);

  useEffect(() => {
    const t1 = setTimeout(() => setRingReady(true), 300);
    const t2 = setTimeout(() => setShowLabel(true), 800);
    const t3 = setTimeout(() => setBarsReady(true), 1000);
    const t4 = setTimeout(() => stableCallback(), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [stableCallback]);

  return (
    <div className="text-center">
      {/* 점수 링 — 메인 */}
      <div className={`relative inline-block transition-opacity duration-500 ${ringReady ? "opacity-100" : "opacity-0"}`}>
        {ringReady && score >= 65 && (
          <div className="absolute inset-[-12px] rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl animate-glow-pulse" />
        )}
        <svg width="170" height="170" className="block mx-auto relative">
          <circle cx="85" cy="85" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="85" cy="85" r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={ringReady ? offset : circ}
            transform="rotate(-90 85 85)"
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
          <text x="85" y="85" textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="46" fontWeight="900" className="font-outfit">
            {displayScore}점
          </text>
        </svg>
      </div>

      {/* 등급 뱃지 + 라벨 */}
      <div
        className="mt-2.5"
        style={{
          opacity: showLabel ? 1 : 0,
          transform: showLabel ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br ${c.badge} ${c.badgeText} text-[12px] sm:text-[13px] font-black font-outfit`}>
            {grade}
          </span>
          <span className="text-[14px] sm:text-[15px] text-white/60 font-bold">{c.label}</span>
          {c.pct && (
            <span className="text-[10px] sm:text-[11px] text-yellow-400/80 font-semibold bg-yellow-400/10 px-1.5 py-0.5 rounded">{c.pct}</span>
          )}
        </div>
      </div>

      {/* Breakdown 바 */}
      {breakdown && (
        <div className="mt-5 space-y-2.5 px-1">
          {DIMENSIONS.map((d, i) => {
            const val = breakdown[d.key] || 0;
            const pct = Math.round((val / d.max) * 100);
            const delayMs = i * 100;
            return (
              <div
                key={d.key}
                className="flex items-center gap-2.5"
                style={{
                  opacity: barsReady ? 1 : 0,
                  transform: barsReady ? "translateX(0)" : "translateX(-12px)",
                  transition: `opacity 0.4s ease ${delayMs}ms, transform 0.4s ease ${delayMs}ms`,
                }}
              >
                <div className="w-[76px] text-[11px] sm:text-[12px] text-white/45 text-right shrink-0 font-medium">{d.label}</div>
                <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: barsReady ? `${pct}%` : "0%",
                      background: d.color,
                      transition: `width 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delayMs + 100}ms`,
                    }}
                  />
                </div>
                <div className="w-[46px] text-[11px] sm:text-[12px] text-white/50 font-semibold text-right shrink-0">
                  {val}<span className="text-[9px] sm:text-[10px] text-white/25">/{d.max}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
