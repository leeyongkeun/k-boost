"use client";

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
}

export default function ScoreRing({ score, breakdown }: ScoreRingProps) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="text-center">
      <svg width="150" height="150" className="block mx-auto">
        <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="75" cy="75" r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 75 75)"
          className="transition-[stroke-dashoffset] duration-[1800ms] ease-out"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>
        <text x="75" y="68" textAnchor="middle" fill="#fff" fontSize="36" fontWeight="900" className="font-outfit">{score}</text>
        <text x="75" y="92" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12">/ 100점</text>
      </svg>

      {breakdown && (
        <div className="mt-5 space-y-2.5 px-1">
          {DIMENSIONS.map((d) => {
            const val = breakdown[d.key] || 0;
            const pct = Math.round((val / d.max) * 100);
            return (
              <div key={d.key} className="flex items-center gap-2.5">
                <div className="w-[76px] text-[11px] sm:text-[12px] text-white/45 text-right shrink-0 font-medium">{d.label}</div>
                <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-[1200ms] ease-out"
                    style={{ width: `${pct}%`, background: d.color }}
                  />
                </div>
                <div className="w-[52px] text-[11px] sm:text-[12px] text-white/50 font-semibold text-right shrink-0">
                  {val}<span className="text-[9px] sm:text-[10px] text-white/25">/{d.max}</span>
                  <span className="text-[9px] text-white/20 ml-0.5">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
