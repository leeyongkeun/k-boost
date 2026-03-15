"use client";

import { useEffect, useState, useRef } from "react";
import { ScoreBreakdown } from "@/lib/types";

const DIMENSIONS = [
  { label: "온라인 존재감", key: "online_presence" as const, max: 20, color: "#a78bfa" },
  { label: "리뷰 현황", key: "review_status" as const, max: 20, color: "#c084fc" },
  { label: "비주얼 콘텐츠", key: "visual_content" as const, max: 15, color: "#f0abfc" },
  { label: "위치/접근성", key: "accessibility" as const, max: 20, color: "#ec4899" },
  { label: "K-화 잠재력", key: "k_potential" as const, max: 15, color: "#f472b6" },
  { label: "대표자 준비도", key: "owner_readiness" as const, max: 10, color: "#FFD700" },
];

interface ScoreRingProps {
  score: number;
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

export default function ScoreRing({ score, breakdown, onAnimationDone }: ScoreRingProps) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const displayScore = useCountUp(score, 1400, 500);
  const [ringReady, setRingReady] = useState(false);
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setRingReady(true), 400);
    const t2 = setTimeout(() => setBarsReady(true), 900);
    // 바 애니메이션 완료 시점 콜백
    const t3 = setTimeout(() => onAnimationDone?.(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onAnimationDone]);

  return (
    <div className="text-center">
      {/* 링 컨테이너 */}
      <div className={`relative inline-block transition-opacity duration-500 ${ringReady ? "opacity-100" : "opacity-0"}`}>
        {/* 스코어 글로우 */}
        {ringReady && score >= 65 && (
          <div className="absolute inset-[-10px] rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl animate-glow-pulse" />
        )}
        <svg width="160" height="160" className="block mx-auto relative">
          {/* 배경 링 */}
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          {/* 점수 링 */}
          <circle
            cx="80" cy="80" r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={ringReady ? offset : circ}
            transform="rotate(-90 80 80)"
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
          {/* 점수 숫자 + "점" */}
          <text x="80" y="78" textAnchor="middle" fill="#fff" fontSize="42" fontWeight="900" className="font-outfit">
            {displayScore}
          </text>
          <text x="80" y="100" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="13" fontWeight="600">점</text>
        </svg>
      </div>

      {/* Breakdown 바 — 순차 등장 */}
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
