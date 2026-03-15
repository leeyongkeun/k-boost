"use client";

import { useEffect, useState } from "react";
import { Grade } from "@/lib/types";

const GRADE_CONFIG = {
  S: { bg: "from-yellow-400 to-orange-500", text: "text-gray-900", glow: "shadow-[0_0_60px_rgba(255,215,0,0.6),0_0_120px_rgba(255,215,0,0.3)]", label: "K-글로벌 황금 매장", pct: "상위 5%" },
  A: { bg: "from-purple-600 to-purple-500", text: "text-white", glow: "shadow-[0_0_60px_rgba(124,58,237,0.5),0_0_120px_rgba(124,58,237,0.3)]", label: "K-글로벌 유망 매장", pct: "상위 20%" },
  B: { bg: "from-blue-500 to-blue-400", text: "text-white", glow: "shadow-[0_0_50px_rgba(59,130,246,0.4),0_0_100px_rgba(59,130,246,0.2)]", label: "K-글로벌 가능 매장", pct: "상위 50%" },
  C: { bg: "from-gray-500 to-gray-400", text: "text-white", glow: "shadow-[0_0_40px_rgba(107,114,128,0.3)]", label: "K-글로벌 준비 단계", pct: "" },
  D: { bg: "from-gray-600 to-gray-500", text: "text-white", glow: "shadow-[0_0_40px_rgba(75,85,99,0.3)]", label: "재검토 필요", pct: "" },
};

interface GradeBadgeProps {
  grade: Grade;
  animate?: boolean;
}

export default function GradeBadge({ grade, animate }: GradeBadgeProps) {
  const c = GRADE_CONFIG[grade] || GRADE_CONFIG.C;
  const [show, setShow] = useState(!animate);
  const [showLabel, setShowLabel] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const t1 = setTimeout(() => setShow(true), 200);
    const t2 = setTimeout(() => setShowLabel(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [animate]);

  return (
    <div className="text-center">
      {/* 등급 원형 배지 */}
      <div className="relative inline-block">
        {/* 뒤쪽 글로우 */}
        {show && (
          <div className={`absolute inset-[-20px] rounded-full bg-gradient-to-br ${c.bg} opacity-20 blur-2xl animate-glow-pulse`} />
        )}
        <div
          className={`
            w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] rounded-full bg-gradient-to-br ${c.bg} ${c.text} ${c.glow}
            flex items-center justify-center text-[56px] sm:text-[60px] font-black font-outfit
            tracking-tight mx-auto relative
            ${show ? "animate-grade-enter" : "opacity-0 scale-0"}
          `}
        >
          {grade}
        </div>
      </div>

      {/* 라벨 + 상위 % */}
      <div className={`transition-all duration-500 ${showLabel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        <div className="mt-3 text-[13px] sm:text-[14px] text-white/50 font-semibold tracking-wide">
          {c.label}
        </div>
        {c.pct && (
          <div className="inline-block mt-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[11px] text-yellow-400 font-semibold">
            {c.pct} K-글로벌 잠재력
          </div>
        )}
      </div>
    </div>
  );
}
