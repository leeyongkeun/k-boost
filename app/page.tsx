"use client";

import { useState, useRef } from "react";
import { QUESTIONS } from "@/lib/questions";
import { QuizAnswers, AnalysisResult } from "@/lib/types";
import Landing from "@/components/Landing";
import QuizLoading from "@/components/QuizLoading";
import QuizResult from "@/components/QuizResult";
import Completion from "@/components/Completion";

export default function Home() {
  const [phase, setPhase] = useState<"landing" | "quiz" | "loading" | "result" | "completion">("landing");
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allAnswered = QUESTIONS.every((q) => {
    const val = answers[q.id];
    return val && val.trim() !== "";
  });

  const unanswered = QUESTIONS.filter((q) => {
    const val = answers[q.id];
    return !val || val.trim() === "";
  });

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!allAnswered) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setPhase("loading");
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "API 호출 실패");

      setResult(data as AnalysisResult);
      setPhase("result");
      containerRef.current?.scrollTo({ top: 0, behavior: "auto" });

      // 결과 저장 (공유용 ID 생성)
      fetch("/api/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: data }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.id) setResultId(d.id); })
        .catch(() => {});
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setPhase("quiz");
    }
  };

  const restart = () => {
    setAnswers({});
    setResult(null);
    setError(null);
    setShowValidation(false);
    setResultId(null);
    setPhase("quiz");
  };

  const goHome = () => {
    setAnswers({});
    setResult(null);
    setError(null);
    setShowValidation(false);
    setResultId(null);
    setPhase("landing");
  };

  return (
    <div
      ref={containerRef}
      className="min-h-dvh bg-[linear-gradient(172deg,#010e2a_0%,#021C4F_35%,#0a2a6b_70%,#031d52_100%)] text-white overflow-y-auto relative hide-scrollbar"
    >
      {phase === "landing" && (
        <Landing onStart={() => setPhase("quiz")} />
      )}

      {phase === "completion" && (
        <Completion onHome={goHome} />
      )}

      {/* Responsive container */}
      <div className={`w-full max-w-[540px] mx-auto px-8 sm:px-12 md:px-14 relative z-[1] safe-top ${phase === "landing" || phase === "completion" ? "hidden" : ""}`}>
        {phase === "quiz" && (
          <div className="pt-10 sm:pt-14 md:pt-20 pb-20 sm:pb-24 safe-bottom relative">
            {/* Background particles */}
            <div className="absolute top-[12%] left-[10%] w-[3px] h-[3px] rounded-full bg-white/[0.12] animate-[floatParticle_7s_ease-in-out_infinite]" />
            <div className="absolute top-[22%] right-[15%] w-[2px] h-[2px] rounded-full bg-white/[0.12] animate-[floatParticle_9s_ease-in-out_infinite_1.5s]" />

            {/* Header — matches page2.html */}
            <div className="text-center mb-6 sm:mb-8 animate-fade-down">
              <div className="text-[18px] font-medium text-white/55 leading-[1.7] tracking-[-0.2px]">매장명만 입력하세요</div>
              <div className="text-[21px] font-extrabold text-white leading-[1.7] tracking-[-0.3px]">외국인 고객이 찾아오는 K화 전략</div>
              <div className="text-[18px] font-medium text-white/55 leading-[1.7] tracking-[-0.2px]">바로 확인 가능합니다</div>
            </div>

            {/* All Questions Inline */}
            <div className="space-y-6 sm:space-y-7">
              {/* Q1: Store Info */}
              <div className="animate-[fadeUp_0.6s_ease-out_0.15s_both]">
                <div className="text-[16px] font-bold text-white mb-[5px] tracking-[-0.3px]">
                  {QUESTIONS[0].question}
                </div>
                {QUESTIONS[0].sub && (
                  <div className="text-[12px] font-normal text-white/[0.38] mb-2.5 tracking-[-0.1px]">{QUESTIONS[0].sub}</div>
                )}
                <input
                  type="text"
                  placeholder={QUESTIONS[0].placeholder}
                  value={answers.store_info || ""}
                  onChange={(e) => handleAnswer("store_info", e.target.value)}
                  className="w-full py-[15px] px-4 rounded-[14px] border border-white/[0.08] bg-white/[0.04] text-white text-[14px] font-normal outline-none transition-all focus:border-white/40 focus:bg-white/[0.06] placeholder:text-white/[0.38]"
                />
              </div>

              {/* Q2: Foreign Ratio */}
              <div className="animate-[fadeUp_0.6s_ease-out_0.3s_both]">
                <div className="text-[16px] font-bold text-white mb-2.5 tracking-[-0.3px]">
                  {QUESTIONS[1].question}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {QUESTIONS[1].options?.map((opt) => {
                    const selected = answers.foreign_ratio === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer("foreign_ratio", opt.value)}
                        className={`
                          flex flex-col items-center justify-center gap-[7px] py-4 px-1.5 rounded-[14px] cursor-pointer transition-all active:scale-[0.96] select-none
                          ${selected
                            ? "border border-white/45 bg-white/[0.07] shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                            : "border border-white/[0.08] bg-white/[0.04]"
                          }
                        `}
                      >
                        <span className="text-[26px] leading-none">{opt.emoji}</span>
                        <span className={`text-[12.5px] font-semibold tracking-[-0.2px] whitespace-nowrap transition-colors ${selected ? "text-white" : "text-white/65"}`}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q3: Willingness */}
              <div className="animate-[fadeUp_0.6s_ease-out_0.45s_both]">
                <div className="text-[16px] font-bold text-white mb-2.5 tracking-[-0.3px]">
                  {QUESTIONS[2].question}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {QUESTIONS[2].options?.map((opt) => {
                    const selected = answers.change_willingness === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer("change_willingness", opt.value)}
                        className={`
                          flex flex-col items-center justify-center gap-[7px] py-4 px-1.5 rounded-[14px] cursor-pointer transition-all active:scale-[0.96] select-none
                          ${selected
                            ? "border border-white/45 bg-white/[0.07] shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                            : "border border-white/[0.08] bg-white/[0.04]"
                          }
                        `}
                      >
                        <span className="text-[26px] leading-none">{opt.emoji}</span>
                        <span className={`text-[12.5px] font-semibold tracking-[-0.2px] whitespace-nowrap transition-colors ${selected ? "text-white" : "text-white/65"}`}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 p-4 rounded-2xl bg-red-500/[0.12] border border-red-500/25 text-[13px] text-red-300 leading-relaxed">
                {error}
              </div>
            )}

            {/* Validation message */}
            {showValidation && !allAnswered && (
              <div className="mt-5 p-4 rounded-2xl bg-yellow-500/[0.1] border border-yellow-500/20 text-[13px] text-yellow-300/90 leading-relaxed">
                아래 항목을 입력해주세요:
                <ul className="mt-1.5 ml-4 list-disc space-y-0.5">
                  {unanswered.map((q) => (
                    <li key={q.id}>{q.question}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit — matches page2.html CTA */}
            <div className="w-full max-w-[340px] mx-auto mt-8 sm:mt-10 mb-8 sm:mb-10 animate-[fadeUp_0.6s_ease-out_0.55s_both]">
              <button
                onClick={handleSubmit}
                className={`
                  flex items-center justify-center gap-0.5 w-full py-[18px] px-8 rounded-2xl border-none text-[17px] font-bold tracking-[0.3px] cursor-pointer relative overflow-hidden transition-all active:scale-[0.97]
                  ${allAnswered
                    ? "text-white bg-gradient-to-br from-[#C50337] via-[#e8254d] to-[#C50337] bg-[length:200%_200%] animate-shimmer-btn shadow-[0_4px_20px_rgba(197,3,55,0.45),0_10px_40px_rgba(197,3,55,0.18),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-2px_0_rgba(0,0,0,0.12)]"
                    : "text-white/30 bg-white/[0.06] cursor-not-allowed shadow-none"
                  }
                `}
              >
                {allAnswered && <span className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sheen" />}
                <span className="text-[19px] mr-1">📊</span>
                결과 확인
                <span className="ml-1.5 font-normal opacity-75">→</span>
              </button>
              <div className="mt-3 text-center text-[11px] font-normal text-white/[0.38] tracking-[0.3px]">
                K-BOOST 공식프로그램<span className="inline-block w-[3px] h-[3px] bg-white/[0.38] rounded-full mx-1.5 align-middle" />10초 정밀진단
              </div>
            </div>
          </div>
        )}

        {phase === "loading" && <QuizLoading />}

        {phase === "result" && result && (
          <QuizResult result={result} onRestart={restart} resultId={resultId} onComplete={() => setPhase("completion")} />
        )}
      </div>
    </div>
  );
}
