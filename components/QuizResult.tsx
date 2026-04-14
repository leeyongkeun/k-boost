"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { AnalysisResult } from "@/lib/types";
import ScoreRing from "./ScoreRing";

interface QuizResultProps {
  result: AnalysisResult;
  onRestart: () => void;
  resultId?: string | null;
  onComplete?: () => void;
}

const PLATFORM_ICON_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  "네이버 지도": { bg: "bg-[#03c75a]", text: "text-white", label: "N" },
  "카카오맵": { bg: "bg-[#fee500]", text: "text-[#3c1e1e]", label: "K" },
  "Google Maps": { bg: "bg-[#4285f4]", text: "text-white", label: "G" },
};

const IMPROVEMENT_ICONS = ["🌐", "🗣️", "⭐", "📈", "💡"];

// --- Revenue boost random value ---
function useBoostValue() {
  const [boost] = useState(() => Math.floor(Math.random() * 11) + 28);
  return boost;
}

// --- Queue count fluctuation ---
function useQueueCount() {
  const [count, setCount] = useState(() => Math.floor(Math.random() * 10) + 20);
  const baseRef = useRef(count);
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 5) - 2;
      baseRef.current = Math.max(12, Math.min(39, baseRef.current + delta));
      setCount(baseRef.current);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  return count;
}

// --- Progress counter ---
function useProgressPct() {
  const [pct, setPct] = useState(0);
  const pctRef = useRef(0);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (pctRef.current < 95) {
        const inc = pctRef.current < 40 ? Math.random() * 2.5 + 0.8 : Math.random() * 1.2 + 0.3;
        pctRef.current = Math.min(95, pctRef.current + inc);
        setPct(Math.round(pctRef.current));
      }
      timeout = setTimeout(tick, 400 + Math.random() * 600);
    };
    tick();
    return () => clearTimeout(timeout);
  }, []);
  return pct;
}

export default function QuizResult({ result, onRestart, resultId, onComplete }: QuizResultProps) {
  const [showTitle, setShowTitle] = useState(false);
  const [showBody, setShowBody] = useState(false);

  // CTA section state
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const ctaActive = phone.replace(/[^0-9]/g, "").length >= 10 && agreed;

  const formatPhone = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const boostPct = useBoostValue();
  const queueCount = useQueueCount();
  const genPct = useProgressPct();

  const boostWidth = Math.round(boostPct * 0.6);
  const baseWidth = 100 - boostWidth;

  const handleScoreAnimDone = useCallback(() => {
    setTimeout(() => setShowTitle(true), 200);
    setTimeout(() => setShowBody(true), 700);
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const handleCtaSubmit = async () => {
    if (!ctaActive || submitting) return;
    setSubmitting(true);
    try {
      // Save lead to API
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/[^0-9]/g, ""),
          resultId,
          storeName: result.store_name,
          score: result.score,
          grade: result.grade,
        }),
      });
    } catch {
      // fire-and-forget — proceed to completion even on error
    }
    onComplete?.();
  };

  return (
    <div className="pt-6 sm:pt-8 pb-10 sm:pb-12 safe-bottom relative">
      {/* Background particles */}
      <div className="absolute top-[8%] left-[10%] w-[3px] h-[3px] rounded-full bg-white/[0.12] animate-[floatParticle_7s_ease-in-out_infinite]" />
      <div className="absolute top-[18%] right-[15%] w-[2px] h-[2px] rounded-full bg-white/[0.12] animate-[floatParticle_9s_ease-in-out_infinite_1.5s]" />
      <div className="absolute top-[55%] left-[6%] w-[3px] h-[3px] rounded-full bg-white/[0.12] animate-[floatParticle_6s_ease-in-out_infinite_3s]" />

      {/* ━━━ Store Info ━━━ */}
      <div className="flex items-center gap-3 p-3.5 px-4 bg-white/[0.04] border border-white/[0.08] rounded-[14px] mb-1 animate-[fadeUp_0.6s_ease-out_0.1s_both]">
        <div className="w-10 h-10 shrink-0 bg-[rgba(197,3,55,0.1)] border border-[rgba(197,3,55,0.15)] rounded-[10px] flex items-center justify-center text-[20px]">
          ☕
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[15px] font-bold text-white">{result.store_name}</span>
            <span className="text-[11px] font-medium text-white/[0.38] bg-white/[0.06] py-0.5 px-2 rounded">{result.business_type}</span>
          </div>
          {result.store_address && (
            <div className="text-[11px] font-normal text-white/[0.38]">{result.store_address}</div>
          )}
        </div>
      </div>

      {/* ━━━ Score Ring + Category Bars ━━━ */}
      <div className="mb-7 animate-[fadeUp_0.6s_ease-out_0.2s_both]">
        <ScoreRing score={result.score} grade={result.grade} breakdown={result.score_breakdown} onAnimationDone={handleScoreAnimDone} />
      </div>

      {/* ━━━ Summary ━━━ */}
      <div
        className="text-center p-5 bg-white/[0.04] border border-white/[0.08] rounded-[14px] mb-7"
        style={{
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <div className="text-[16px] font-bold text-white mb-2.5 leading-[1.5]">
          <em className="not-italic text-[#e8254d] font-extrabold">{result.store_name}</em>, {result.title}
        </div>
        <div className="text-[12px] font-normal text-white/45 leading-[1.65]">
          {result.summary}
        </div>
      </div>

      {/* ━━━ Body sections — appear after score animation ━━━ */}
      <div
        style={{
          opacity: showBody ? 1 : 0,
          transform: showBody ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >

      {/* ━━━ 지도 등록 현황 (Platform Registration) ━━━ */}
      {result.platforms && result.platforms.length > 0 && (() => {
        return (
          <div className="p-[18px] bg-white/[0.04] border border-white/[0.08] rounded-[14px] mb-7">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[14px] font-bold text-white tracking-[-0.2px]">지도 등록 현황</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {result.platforms.map((p) => {
                const iconCfg = PLATFORM_ICON_CONFIG[p.name];
                return (
                  <div
                    key={p.name}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-[10px] border ${
                      p.registered
                        ? "bg-white/[0.03] border-white/[0.08]"
                        : "bg-[rgba(197,3,55,0.03)] border-[rgba(197,3,55,0.15)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center text-[14px] font-extrabold shrink-0 ${iconCfg?.bg || "bg-white/[0.08]"} ${iconCfg?.text || "text-white/40"}`}>
                        {iconCfg?.label || p.name[0]}
                      </div>
                      <span className={`text-[11px] font-bold py-0.5 px-2 rounded-[6px] shrink-0 ml-auto ${
                        p.registered
                          ? "text-[#4ade80] bg-[rgba(74,222,128,0.08)]"
                          : "text-[#e8254d] bg-[rgba(197,3,55,0.08)]"
                      }`}>
                        {p.registered ? "등록" : "미등록"}
                      </span>
                    </div>
                    <div className="text-[12px] font-semibold text-white/75 tracking-[-0.2px] w-full">{p.name}</div>
                  </div>
                );
              })}
              {/* Instagram */}
              {result.instagram_url && (
                <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-[10px] border bg-white/[0.03] border-white/[0.08]">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[14px] shrink-0 bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]">
                      📷
                    </div>
                    <span className="text-[11px] font-bold text-[#60a5fa] bg-[rgba(96,165,250,0.08)] py-0.5 px-2 rounded-[6px] shrink-0 ml-auto">연결됨</span>
                  </div>
                  <div className="text-[12px] font-semibold text-white/75 w-full">Instagram</div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ━━━ Key Metrics — diagnostic cards ━━━ */}
      {result.key_metrics && result.key_metrics.length > 0 && (() => {
        // 지도 플랫폼 관련 항목 숨김 (이미 위 플랫폼 섹션에 표시)
        const HIDE_KEYWORDS = ["네이버", "카카오", "구글", "google", "naver", "kakao", "지도"];
        // 외국어지원/온라인 존재감 → '외국인 유입 플랫폼'으로 합침
        const MERGE_KEYWORDS = ["외국어", "외국인", "온라인 존재"];

        const filtered = result.key_metrics.filter((m) => {
          const lower = m.label.toLowerCase();
          if (HIDE_KEYWORDS.some(k => lower.includes(k.toLowerCase()))) return false;
          return true;
        });

        // 합칠 항목과 나머지 분리
        const mergeTargets = filtered.filter((m) =>
          MERGE_KEYWORDS.some(k => m.label.includes(k))
        );
        const rest = filtered.filter((m) =>
          !MERGE_KEYWORDS.some(k => m.label.includes(k))
        );

        // 합친 항목의 detail을 결합
        const mergedDetail = mergeTargets.map(m => m.detail).filter(Boolean).join(" ");

        return (
          <div className="space-y-3 mb-7">
            {/* 외국인 유입 플랫폼 (합친 항목) */}
            {mergeTargets.length > 0 && (
              <div className="p-3.5 px-[18px] rounded-[14px] border bg-[rgba(197,3,55,0.04)] border-[rgba(197,3,55,0.2)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-bold text-white tracking-[-0.2px]">외국인 유입 플랫폼</span>
                  <span className="text-[11px] font-bold py-0.5 px-2.5 rounded-[10px] border text-[#e8254d] bg-[rgba(197,3,55,0.1)] border-[rgba(197,3,55,0.2)]">
                    3/20 등록됨
                  </span>
                </div>
                {mergedDetail && (
                  <div className="text-[12px] font-normal text-white/45 leading-[1.55] text-center">
                    {mergedDetail}
                  </div>
                )}
              </div>
            )}

            {/* 나머지 항목 */}
            {rest.map((metric, i) => {
              const badgeColor = {
                good: "text-[#4ade80] bg-[rgba(74,222,128,0.1)] border-[rgba(74,222,128,0.2)]",
                warning: "text-[#fbbf24] bg-[rgba(251,191,36,0.1)] border-[rgba(251,191,36,0.2)]",
                critical: "text-[#e8254d] bg-[rgba(197,3,55,0.1)] border-[rgba(197,3,55,0.2)]",
              }[metric.status];
              const isDanger = metric.status === "critical";
              return (
                <div
                  key={i}
                  className={`p-3.5 px-[18px] rounded-[14px] border ${
                    isDanger
                      ? "bg-[rgba(197,3,55,0.04)] border-[rgba(197,3,55,0.2)]"
                      : "bg-white/[0.04] border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-bold text-white tracking-[-0.2px]">{metric.label}</span>
                    <span className={`text-[11px] font-bold py-0.5 px-2.5 rounded-[10px] border ${badgeColor}`}>
                      {metric.value}
                    </span>
                  </div>
                  <div className="text-[12px] font-normal text-white/45 leading-[1.55] text-center">
                    {metric.detail}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ━━━ Improvements ━━━ */}
      {result.improvements && result.improvements.length > 0 && (
        <div className="mb-7">
          <div className="text-[15px] font-bold text-white mb-3 tracking-[-0.2px]">📋 개선 방향</div>
          <div className="flex flex-col gap-2.5">
            {result.improvements.map((s, i) => (
              <div key={i} className="flex gap-2.5 p-3.5 bg-[rgba(197,3,55,0.04)] border border-[rgba(197,3,55,0.15)] rounded-[12px]">
                <span className="text-[20px] shrink-0 leading-[1.4]">{IMPROVEMENT_ICONS[i] || "📌"}</span>
                <span className="text-[13px] font-normal text-white/60 leading-[1.6] tracking-[-0.2px]"
                  dangerouslySetInnerHTML={{
                    __html: s.replace(/^([^:：]+[:：])\s*/, '<strong class="font-bold text-white/85">$1</strong> ')
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━ Section Divider ━━━ */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent my-1" />

      {/* ━━━ Revenue Boost Bar ━━━ */}
      <div className="w-full py-8 px-6 mt-7 rounded-[20px] relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] border border-[rgba(197,3,55,0.18)] bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(197,3,55,0.1)_0%,transparent_70%),linear-gradient(160deg,rgba(8,18,50,0.95)_0%,rgba(12,24,65,0.95)_50%,rgba(8,18,50,0.95)_100%)]">
        {/* Corner glow */}
        <div className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(197,3,55,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-[30px] w-[100px] h-[100px] rounded-full bg-[radial-gradient(circle,rgba(197,3,55,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="text-center relative z-[1]">
          <div className="text-[20px] font-bold text-white/80 leading-[1.5] tracking-[-0.3px] mb-0">
            <strong className="font-black text-white bg-[linear-gradient(transparent_58%,rgba(197,3,55,0.35)_58%)]">{result.store_name}</strong>, 맞춤 솔루션 적용 시
          </div>

          {/* Bar unit */}
          <div className="flex flex-col items-center py-9 pb-8">
            <div className="relative w-full">
              {/* Badge above boost */}
              <div className="flex items-baseline gap-px py-[5px] px-3.5 bg-gradient-to-br from-[#C50337] to-[#e8254d] rounded-[9px] shadow-[0_4px_20px_rgba(197,3,55,0.5),inset_0_0_0_1px_rgba(255,255,255,0.08)] absolute -top-[34px] z-[3] animate-[badgeDrop_0.5s_cubic-bezier(0.34,1.4,0.64,1)_2s_both]"
                style={{ left: `${baseWidth + boostWidth / 2}%`, transform: "translateX(-50%)" }}
              >
                <span className="font-outfit text-[20px] font-black text-white tracking-[-0.5px] drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
                  +{boostPct}%
                </span>
                <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#C50337]" />
              </div>

              {/* Track */}
              <div className="w-full h-[52px] bg-[rgba(0,0,0,0.25)] border border-white/[0.06] rounded-[14px] flex items-stretch overflow-hidden relative shadow-[inset_0_2px_6px_rgba(0,0,0,0.15)]">
                {/* Base */}
                <div
                  className="shrink-0 rounded-l-[13px] flex items-center justify-center border-r-2 border-white/15 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] animate-[hbarBase_0.8s_ease-out_0.5s_both] origin-left"
                  style={{
                    width: `${baseWidth}%`,
                    background: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 4px, rgba(255,255,255,0.18) 4px, rgba(255,255,255,0.18) 8px)",
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent rounded-tl-[13px] pointer-events-none" />
                  <span className="text-[12.5px] font-bold text-white/65 tracking-[0.3px] relative z-[1] animate-[fadeIn_0.3s_ease-out_1.4s_both] opacity-0">현재 매출</span>
                </div>
                {/* Boost */}
                <div
                  className="shrink-0 bg-gradient-to-b from-[#e8254d] to-[#C50337] flex items-center justify-center relative shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_16px_rgba(197,3,55,0.3)] overflow-hidden rounded-r-[13px] animate-[hbarGrow_0.8s_cubic-bezier(0.34,1.4,0.64,1)_1.4s_both] origin-left"
                  style={{ width: `${boostWidth}%` }}
                >
                  <div className="absolute top-0 -left-full w-[60%] h-full bg-gradient-to-r from-transparent via-white/[0.14] to-transparent animate-[hShimmer_3s_ease-in-out_2.8s_infinite]" />
                </div>
              </div>

              {/* Labels */}
              <div className="flex justify-between mt-2.5 px-0.5">
                <span className="text-[11px] font-medium text-white/[0.38]">기존 100%</span>
                <span className="text-[11px] font-medium text-white/[0.38]">→ {100 + boostPct}%</span>
              </div>
            </div>
          </div>

          <div className="text-[20px] font-bold text-white/80 tracking-[-0.3px]">
            <em className="not-italic font-black text-[#e8254d]">{boostPct}%</em>의 추가 매출이 예상돼요 🚀
          </div>
        </div>
      </div>

      {/* ━━━ CTA Section — phone input ━━━ */}
      <div className="w-full py-7 px-6 mt-7 rounded-[20px] text-center relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] border border-[rgba(197,3,55,0.18)] bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(197,3,55,0.1)_0%,transparent_70%),linear-gradient(160deg,rgba(8,18,50,0.95)_0%,rgba(12,24,65,0.95)_50%,rgba(8,18,50,0.95)_100%)]">
        <div className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full bg-[radial-gradient(circle,rgba(197,3,55,0.15)_0%,transparent_70%)] pointer-events-none" />
        <div className="absolute -bottom-[30px] -left-[30px] w-[100px] h-[100px] rounded-full bg-[radial-gradient(circle,rgba(197,3,55,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-[1]">
          {/* Gear + progress */}
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-[30px] leading-none animate-[gearSpin_3s_linear_infinite] inline-block">⚙️</span>
              <span className="text-[22px] leading-none animate-[gearSpin_3s_linear_infinite_reverse] inline-block -ml-1">⚙️</span>
            </div>
            <div className="w-[120px] h-1.5 bg-white/[0.06] rounded-[3px] overflow-hidden mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-[#C50337] to-[#e8254d] rounded-[3px] transition-[width] duration-1000 ease-in-out"
                style={{ width: `${genPct}%` }}
              />
            </div>
            <span className="font-outfit text-[11px] font-bold text-[#e8254d] tabular-nums">{genPct}%</span>
          </div>

          <div className="text-[16px] font-bold text-white leading-[1.5] mb-1.5 tracking-[-0.3px]">
            <strong className="font-extrabold bg-[linear-gradient(transparent_58%,rgba(197,3,55,0.25)_58%)]">{result.store_name}</strong> 맞춤 솔루션 생성 중
          </div>
          <div className="text-[13px] font-normal text-white/60 leading-[1.55] mb-5">
            완성 시 아래 연락처로 바로 보내드리겠습니다.
          </div>

          {/* Phone input */}
          <div className="mb-1.5">
            <input
              type="tel"
              className="w-full py-[15px] px-4 bg-white/[0.04] border border-white/[0.08] rounded-[14px] text-[14px] font-normal text-white text-center outline-none transition-all focus:border-white/40 focus:bg-white/[0.06] placeholder:text-white/[0.38]"
              placeholder="연락처 (예: 010-1234-5678)"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-center gap-1 mt-2 mb-[18px] text-[11px] font-normal text-white/[0.38]">
            🔒 전화 연락은 하지 않습니다. PDF 발송 용도로만 사용돼요.
          </div>

          {/* Checkbox */}
          <div
            className="flex items-center justify-center gap-2 mb-[22px] cursor-pointer select-none"
            onClick={() => setAgreed(!agreed)}
          >
            <div className={`w-5 h-5 shrink-0 border-[1.5px] rounded-[6px] flex items-center justify-center transition-all ${
              agreed ? "border-[#e8254d] bg-[#C50337]" : "border-white/20 bg-transparent"
            }`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-opacity ${agreed ? "opacity-100" : "opacity-0"}`}>
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[12.5px] font-normal text-white/55">개인정보 수집 및 이용에 동의합니다</span>
            <span
              className="text-[11.5px] font-medium text-white/35 underline underline-offset-2 cursor-pointer ml-1"
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            >
              전문보기
            </span>
          </div>

          {/* Submit button */}
          <div className="relative mb-2.5">
            <button
              onClick={handleCtaSubmit}
              className={`flex items-center justify-center gap-0.5 w-full py-[18px] px-8 border-none rounded-2xl text-[17px] font-bold tracking-[0.3px] relative overflow-hidden transition-all active:scale-[0.97] ${
                ctaActive
                  ? "text-white cursor-pointer bg-gradient-to-br from-[#C50337] via-[#e8254d] to-[#C50337] bg-[length:200%_200%] animate-shimmer-btn shadow-[0_4px_20px_rgba(197,3,55,0.45),0_10px_40px_rgba(197,3,55,0.18),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-2px_0_rgba(0,0,0,0.12)]"
                  : "text-white/30 cursor-not-allowed bg-white/[0.06] shadow-none"
              }`}
            >
              {ctaActive && <span className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sheen" />}
              <span className="text-[18px] mr-1">📄</span>
              리포트 받기
              <span className="ml-1.5 font-normal opacity-75">→</span>
            </button>
          </div>

          <div className="text-center mt-3.5 text-[12px] font-medium text-white/[0.38]">
            현재 대기 <span className="font-outfit font-bold text-white/55 tabular-nums">{queueCount}</span>명
          </div>
        </div>
      </div>

      </div>{/* showBody wrapper */}

      {/* ━━━ Bottom buttons ━━━ */}
      <div
        className="mt-8 sm:mt-10 space-y-2.5"
        style={{
          opacity: showBody ? 1 : 0,
          transition: "opacity 0.7s ease 0.3s",
        }}
      >
        <button
          onClick={() => {
            const shareUrl = resultId ? `${window.location.origin}/result/${resultId}` : window.location.href;
            if (navigator.share) {
              navigator.share({
                title: `K-BOOST 분석 결과: ${result.grade}등급 (${result.score}점)`,
                text: result.title,
                url: shareUrl,
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(shareUrl).then(() => {
                alert("링크가 복사되었습니다!");
              }).catch(() => {});
            }
          }}
          className="w-full py-3.5 rounded-2xl border border-white/[0.1] bg-white/[0.04] text-white/60 text-[13px] font-semibold cursor-pointer hover:bg-white/[0.06] transition-colors active:scale-[0.98]"
        >
          내 결과 공유하기
        </button>

        <button
          onClick={onRestart}
          className="w-full py-3 rounded-2xl border border-white/[0.06] bg-transparent text-white/35 text-[12px] cursor-pointer hover:bg-white/[0.03] transition-colors active:scale-[0.98]"
        >
          다른 매장도 진단해보기
        </button>
      </div>

      {/* ━━━ Privacy Modal ━━━ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-[4px] z-[999] flex items-center justify-center p-6 animate-[fadeIn_0.3s_ease]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-[360px] max-h-[80vh] bg-gradient-to-br from-[rgba(8,18,50,0.98)] to-[rgba(12,24,65,0.98)] border border-white/10 rounded-[20px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-white/[0.06]">
              <span className="text-[15px] font-bold text-white">개인정보 수집 및 이용 동의</span>
              <div
                className="w-7 h-7 bg-white/[0.06] border border-white/[0.08] rounded-lg flex items-center justify-center cursor-pointer text-white/50 text-[16px] leading-none active:bg-white/10"
                onClick={() => setShowModal(false)}
              >
                ✕
              </div>
            </div>
            <div className="px-5 pt-[18px] pb-6 overflow-y-auto max-h-[calc(80vh-60px)]">
              <table className="w-full border-collapse mb-4">
                <tbody>
                  {[
                    ["수집 주체", "오호트립 (K-BOOST)"],
                    ["수집 항목", "휴대폰 번호"],
                    ["수집 목적", "맞춤 솔루션 리포트 발송, 서비스 안내 및 마케팅 정보 제공"],
                    ["보유 기간", "수집일로부터 1년 (이후 지체 없이 파기)"],
                    ["동의 거부", "동의를 거부하실 수 있으며, 거부 시 리포트 수신 및 서비스 안내가 제한됩니다."],
                  ].map(([th, td]) => (
                    <tr key={th}>
                      <th className="py-2.5 px-3 text-[12px] font-semibold text-white/60 text-left border-b border-white/[0.05] w-[90px] whitespace-nowrap align-top leading-[1.5]">{th}</th>
                      <td className="py-2.5 px-3 text-[12px] font-normal text-white/45 text-left border-b border-white/[0.05] align-top leading-[1.5]">{td}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[11px] font-normal text-white/30 leading-[1.6]">
                * 위 동의는 K-BOOST 서비스 이용을 위해 필요한 최소한의 개인정보이며, 동의 철회 시 보유 중인 정보는 즉시 파기됩니다.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
