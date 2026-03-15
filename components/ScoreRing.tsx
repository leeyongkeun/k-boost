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
  S: { bg: "from-yellow-400 to-orange-500", text: "text-gray-900", glow: "shadow-[0_0_50px_rgba(255,215,0,0.5)]", label: "K-글로벌 황금 매장", pct: "상위 5%" },
  A: { bg: "from-purple-600 to-purple-500", text: "text-white", glow: "shadow-[0_0_50px_rgba(124,58,237,0.4)]", label: "K-글로벌 유망 매장", pct: "상위 20%" },
  B: { bg: "from-blue-500 to-blue-400", text: "text-white", glow: "shadow-[0_0_40px_rgba(59,130,246,0.3)]", label: "K-글로벌 가능 매장", pct: "상위 50%" },
  C: { bg: "from-gray-500 to-gray-400", text: "text-white", glow: "shadow-[0_0_30px_rgba(107,114,128,0.3)]", label: "K-글로벌 준비 단계", pct: "" },
  D: { bg: "from-gray-600 to-gray-500", text: "text-white", glow: "shadow-[0_0_30px_rgba(75,85,99,0.3)]", label: "재검토 필요", pct: "" },
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
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = GRADE_CONFIG[grade] || GRADE_CONFIG.C;

  const displayScore = useCountUp(score, 1400, 500);
  const [showGrade, setShowGrade] = useState(false);
  const [ringReady, setRingReady] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [barsReady, setBarsReady] = useState(false);

  const stableCallback = useCallback(() => onAnimationDone?.(), [onAnimationDone]);

  useEffect(() => {
    const t0 = setTimeout(() => setShowGrade(true), 200);
    const t1 = setTimeout(() => setRingReady(true), 400);
    const t2 = setTimeout(() => setShowInfo(true), 900);
    const t3 = setTimeout(() => setBarsReady(true), 1100);
    const t4 = setTimeout(() => stableCallback(), 2200);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [stableCallback]);

  return (
    <div className="text-center">
      {/* 등급 + 점수 통합 영역 */}
      <div className="flex items-center justify-center gap-5 sm:gap-6">
        {/* 등급 배지 */}
        <div className="relative">
          {showGrade && (
            <div className={`absolute inset-[-14px] rounded-full bg-gradient-to-br ${c.bg} opacity-20 blur-2xl animate-glow-pulse`} />
          )}
          <div
            className={`
              w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] rounded-full bg-gradient-to-br ${c.bg} ${c.text} ${c.glow}
              flex items-center justify-center text-[38px] sm:text-[42px] font-black font-outfit
              tracking-tight relative
              ${showGrade ? "animate-grade-enter" : "opacity-0 scale-0"}
            `}
          >
            {grade}
          </div>
        </div>

        {/* 점수 링 */}
        <div className={`relative transition-opacity duration-500 ${ringReady ? "opacity-100" : "opacity-0"}`}>
          {ringReady && score >= 65 && (
            <div className="absolute inset-[-8px] rounded-full bg-gradient-to-br from-purple-500/15 to-pink-500/15 blur-xl animate-glow-pulse" />
          )}
          <svg width="130" height="130" className="block relative">
            <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
              cx="65" cy="65" r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={ringReady ? offset : circ}
              transform="rotate(-90 65 65)"
              style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#FFD700" />
              </linearGradient>
            </defs>
            <text x="65" y="72" textAnchor="middle" fill="#fff" fontSize="36" fontWeight="900" className="font-outfit">
              {displayScore}점
            </text>
          </svg>
        </div>
      </div>

      {/* 라벨 + 상위 % */}
      <div
        className="mt-3"
        style={{
          opacity: showInfo ? 1 : 0,
          transform: showInfo ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        <div className="text-[13px] sm:text-[14px] text-white/50 font-semibold tracking-wide">
          {c.label}
        </div>
        {c.pct && (
          <div className="inline-block mt-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[11px] text-yellow-400 font-semibold">
            {c.pct}
          </div>
        )}
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
