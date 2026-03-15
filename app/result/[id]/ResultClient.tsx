"use client";

import { AnalysisResult } from "@/lib/types";
import QuizResult from "@/components/QuizResult";

export default function ResultClient({ result }: { result: AnalysisResult }) {
  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#0c0818] via-[#160f30] via-[70%] to-[#291660] text-white overflow-y-auto relative hide-scrollbar">
      <div className="fixed -top-[100px] -right-[100px] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.15)_0%,transparent_65%)] pointer-events-none" />
      <div className="fixed -bottom-[80px] -left-[80px] w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.1)_0%,transparent_65%)] pointer-events-none" />
      <div className="w-full max-w-[540px] mx-auto px-8 sm:px-12 md:px-14 relative z-[1] safe-top">
        <QuizResult result={result} onRestart={() => window.location.href = "/"} />
      </div>
    </div>
  );
}
