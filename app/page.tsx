"use client";

import { useState, useRef } from "react";
import { QUESTIONS } from "@/lib/questions";
import { QuizAnswers, AnalysisResult } from "@/lib/types";
import QuizLoading from "@/components/QuizLoading";
import QuizResult from "@/components/QuizResult";

export default function Home() {
  const [phase, setPhase] = useState<"quiz" | "loading" | "result">("quiz");
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

  return (
    <div
      ref={containerRef}
      className="min-h-dvh bg-gradient-to-br from-[#0c0818] via-[#160f30] via-[70%] to-[#291660] text-white overflow-y-auto relative hide-scrollbar"
    >
      {/* Background orbs */}
      <div className="fixed -top-[100px] -right-[100px] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,transparent_65%)] pointer-events-none" />
      <div className="fixed -bottom-[80px] -left-[80px] w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.1)_0%,transparent_65%)] pointer-events-none" />

      {/* Responsive container */}
      <div className="w-full max-w-[540px] mx-auto px-8 sm:px-12 md:px-14 relative z-[1] safe-top">
        {phase === "quiz" && (
          <div className="pt-10 sm:pt-14 md:pt-20 pb-20 sm:pb-24 safe-bottom">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-10">
              <div className="text-[40px] sm:text-[48px] mb-3 animate-float">🚀</div>
              <h1 className="font-outfit text-[26px] sm:text-[32px] font-black leading-tight mb-2 bg-gradient-to-br from-purple-300 via-pink-300 to-yellow-400 bg-clip-text text-transparent">
                K-BOOST
              </h1>
              <p className="text-white/40 text-[14px] sm:text-[15px] leading-relaxed">
                우리 매장의 K-글로벌 잠재력을 확인해보세요
              </p>
              <p className="text-white/25 text-[11px] sm:text-xs mt-1.5">
                3가지 질문 · 30초 · AI 수치 분석
              </p>
            </div>

            {/* All Questions Inline */}
            <div className="space-y-10 sm:space-y-12">
              {/* Q1: Store Info */}
              <div>
                <label className="text-[14px] sm:text-[15px] font-semibold mb-2 sm:mb-2.5 block">
                  {QUESTIONS[0].question}
                </label>
                {QUESTIONS[0].sub && (
                  <p className="text-[11px] sm:text-[12px] text-white/30 mb-2.5 sm:mb-3">{QUESTIONS[0].sub}</p>
                )}
                <input
                  type="text"
                  placeholder={QUESTIONS[0].placeholder}
                  value={answers.store_info || ""}
                  onChange={(e) => handleAnswer("store_info", e.target.value)}
                  className="w-full py-3.5 sm:py-4 px-4 rounded-2xl border border-white/10 bg-white/[0.05] text-white text-[16px] outline-none transition-colors focus:border-purple-600/50 focus:bg-purple-600/[0.08] placeholder:text-white/20"
                />
              </div>

              {/* Q2: Foreign Ratio (responsive chips) */}
              <div>
                <label className="text-[14px] sm:text-[15px] font-semibold mb-2.5 sm:mb-3 block">
                  {QUESTIONS[1].question}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {QUESTIONS[1].options?.map((opt) => {
                    const selected = answers.foreign_ratio === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer("foreign_ratio", opt.value)}
                        className={`
                          min-h-[64px] sm:min-h-[72px] py-3 sm:py-3.5 px-3 sm:px-2 rounded-2xl text-center cursor-pointer transition-all active:scale-95
                          ${selected
                            ? "border-2 border-purple-500/70 bg-purple-600/15"
                            : "border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                          }
                        `}
                      >
                        <div className="text-xl sm:text-2xl mb-1">{opt.emoji}</div>
                        <div className={`text-[12px] sm:text-[13px] font-semibold leading-tight ${selected ? "text-purple-300" : "text-white/55"}`}>
                          {opt.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Q3: Willingness (responsive chips) */}
              <div>
                <label className="text-[14px] sm:text-[15px] font-semibold mb-2.5 sm:mb-3 block">
                  {QUESTIONS[2].question}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {QUESTIONS[2].options?.map((opt) => {
                    const selected = answers.change_willingness === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer("change_willingness", opt.value)}
                        className={`
                          min-h-[64px] sm:min-h-[72px] py-3 sm:py-3.5 px-2 rounded-2xl text-center cursor-pointer transition-all active:scale-95
                          ${selected
                            ? "border-2 border-purple-500/70 bg-purple-600/15"
                            : "border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                          }
                        `}
                      >
                        <div className="text-xl sm:text-2xl mb-1">{opt.emoji}</div>
                        <div className={`text-[12px] sm:text-[13px] font-semibold leading-tight ${selected ? "text-purple-300" : "text-white/55"}`}>
                          {opt.label}
                        </div>
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

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className={`
                w-full mt-8 sm:mt-10 mb-16 sm:mb-20 py-4 sm:py-[18px] rounded-2xl border-none text-[16px] sm:text-[17px] font-bold cursor-pointer transition-all active:scale-[0.98]
                ${allAnswered
                  ? "bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-[0_4px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_4px_40px_rgba(124,58,237,0.6)]"
                  : "bg-white/[0.06] text-white/20 cursor-default"
                }
              `}
            >
              결과 확인하기
            </button>
          </div>
        )}

        {phase === "loading" && <QuizLoading />}

        {phase === "result" && result && (
          <QuizResult result={result} onRestart={restart} resultId={resultId} />
        )}
      </div>
    </div>
  );
}
