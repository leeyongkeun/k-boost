"use client";

import { Grade } from "@/lib/types";

const GRADE_CONFIG = {
  S: { bg: "from-yellow-400 to-orange-500", text: "text-gray-900", glow: "shadow-[0_0_40px_rgba(255,215,0,0.5),0_0_80px_rgba(255,215,0,0.3)]", label: "K-글로벌 황금 매장", pct: "상위 5%" },
  A: { bg: "from-purple-600 to-purple-500", text: "text-white", glow: "shadow-[0_0_40px_rgba(124,58,237,0.5),0_0_80px_rgba(124,58,237,0.3)]", label: "K-글로벌 유망 매장", pct: "상위 20%" },
  B: { bg: "from-blue-500 to-blue-400", text: "text-white", glow: "shadow-[0_0_40px_rgba(59,130,246,0.4),0_0_80px_rgba(59,130,246,0.2)]", label: "K-글로벌 가능 매장", pct: "상위 50%" },
  C: { bg: "from-gray-500 to-gray-400", text: "text-white", glow: "shadow-[0_0_40px_rgba(107,114,128,0.3)]", label: "K-글로벌 준비 단계", pct: "" },
  D: { bg: "from-gray-600 to-gray-500", text: "text-white", glow: "shadow-[0_0_40px_rgba(75,85,99,0.3)]", label: "재검토 필요", pct: "" },
};

interface GradeBadgeProps {
  grade: Grade;
  animate?: boolean;
}

export default function GradeBadge({ grade, animate }: GradeBadgeProps) {
  const c = GRADE_CONFIG[grade] || GRADE_CONFIG.C;

  return (
    <div className="text-center">
      <div
        className={`
          w-[110px] h-[110px] rounded-full bg-gradient-to-br ${c.bg} ${c.text} ${c.glow}
          flex items-center justify-center text-[52px] font-black font-outfit
          tracking-tight mx-auto
          ${animate ? "animate-pop-in" : ""}
        `}
      >
        {grade}
      </div>
      <div className="mt-2.5 text-[13px] text-white/50 font-semibold tracking-wide">
        {c.label}
      </div>
      {c.pct && (
        <div className="inline-block mt-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[11px] text-yellow-400 font-semibold">
          {c.pct} K-글로벌 잠재력
        </div>
      )}
    </div>
  );
}
