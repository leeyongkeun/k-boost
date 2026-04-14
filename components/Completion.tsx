"use client";

import { useEffect, useState } from "react";

interface CompletionProps {
  onHome: () => void;
}

export default function Completion({ onHome }: CompletionProps) {
  const [showCheck, setShowCheck] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupTime, setPopupTime] = useState("");
  const [queueNum, setQueueNum] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setShowCheck(true), 800);
    const t2 = setTimeout(() => setShowConfetti(true), 1000);
    const t3 = setTimeout(() => setShowPopup(true), 2800);

    // Generate popup time and queue number
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const ampm = h >= 12 ? "오후" : "오전";
    h = h % 12;
    if (h === 0) h = 12;
    const mm = m < 10 ? "0" + m : String(m);
    setPopupTime(`${ampm} ${h}:${mm}`);
    setQueueNum(Math.floor(Math.random() * 80) + 240);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center px-6 py-10 relative overflow-hidden">
      {/* Background effects */}
      <div className="grid-overlay" />
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(197,3,55,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-[60px] -right-[60px] w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,rgba(10,42,107,0.4)_0%,transparent_70%)] pointer-events-none" />

      {/* Particles */}
      {[
        "top-[12%] left-[10%] w-[3px] h-[3px] duration-[7s]",
        "top-[22%] right-[15%] w-[2px] h-[2px] duration-[9s] delay-[1.5s]",
        "top-[65%] left-[6%] w-[3px] h-[3px] duration-[6s] delay-[3s]",
        "top-[75%] right-[8%] w-[2px] h-[2px] duration-[10s] delay-[2s]",
      ].map((cls, i) => (
        <div key={i} className={`absolute rounded-full bg-white/[0.12] animate-[floatParticle_8s_ease-in-out_infinite] ${cls}`} />
      ))}

      {/* Logo Section */}
      <div className="text-center relative z-[2] animate-fade-down">
        <img
          src="/logo-w.png"
          alt="K-BOOST"
          className="h-[30px] w-auto block mx-auto object-contain"
        />
        <div className="mt-2 text-[11.5px] font-normal text-white/60 tracking-[0.5px]">
          당신의 사업에 글로벌 엔진을 달아보세요
        </div>
      </div>

      {/* Divider */}
      <div className="w-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-5 relative z-[2]" />

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-[2] max-w-[380px] w-full pt-5">
        {/* Check circle */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[rgba(197,3,55,0.12)] to-[rgba(197,3,55,0.04)] border-2 border-[rgba(197,3,55,0.25)] flex items-center justify-center mb-7 relative animate-[circleIn_0.6s_cubic-bezier(0.34,1.4,0.64,1)_0.3s_both]">
          {/* Ring fade */}
          <div className="absolute -inset-2.5 rounded-full border border-[rgba(197,3,55,0.1)] animate-[ringFade_2s_ease-in-out_1s_infinite]" />

          {/* Confetti dots */}
          {showConfetti && (
            <>
              <div className="absolute -top-2 left-[20%] w-1.5 h-1.5 rounded-full bg-[#e8254d] animate-[confettiPop_0.5s_ease-out_forwards]" />
              <div className="absolute top-[10%] -right-1.5 w-[5px] h-[5px] rounded-full bg-white/50 animate-[confettiPop_0.5s_ease-out_0.1s_forwards]" />
              <div className="absolute bottom-[5%] right-[10%] w-1 h-1 rounded-full bg-[#e8254d] animate-[confettiPop_0.5s_ease-out_0.2s_forwards]" />
              <div className="absolute -bottom-1 left-[30%] w-[5px] h-[5px] rounded-full bg-white/40 animate-[confettiPop_0.5s_ease-out_0.15s_forwards]" />
              <div className="absolute top-[15%] -left-1 w-1 h-1 rounded-full bg-[#C50337] animate-[confettiPop_0.5s_ease-out_0.05s_forwards]" />
            </>
          )}

          {/* Check icon */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            className={`transition-all duration-400 ${showCheck ? "opacity-100 scale-100" : "opacity-0 scale-[0.3]"}`}
          >
            <path
              d="M10 20.5L17 27.5L30 13.5"
              stroke="#e8254d"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="text-[18px] font-extrabold text-white text-center mb-2.5 tracking-[-0.3px] animate-[fadeUp_0.6s_ease-out_0.5s_both]">
          신청이 완료되었습니다!
        </div>
        <div className="text-[12.5px] font-normal text-white/60 text-center leading-[1.6] animate-[fadeUp_0.6s_ease-out_0.7s_both]">
          완성되는 대로 입력하신 연락처로<br />
          맞춤 솔루션 리포트를 보내드릴게요.
        </div>

        {/* Bottom area */}
        <div className="w-full max-w-[380px] mt-[72px] animate-[fadeUp_0.6s_ease-out_0.9s_both]">
          <a
            href="https://kboost.co.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-[18px] px-5 border-none rounded-2xl text-[14px] font-bold tracking-[0.2px] text-white cursor-pointer relative overflow-hidden bg-gradient-to-br from-[#C50337] via-[#e8254d] to-[#C50337] bg-[length:200%_200%] animate-shimmer-btn shadow-[0_4px_20px_rgba(197,3,55,0.45),0_10px_40px_rgba(197,3,55,0.18),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-2px_0_rgba(0,0,0,0.12)] active:scale-[0.97] transition-transform whitespace-nowrap no-underline"
          >
            <span className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sheen" />
            🔍 1,700만 외국인 관광객이 돈을 쓰는 곳은? →
          </a>
          <div className="mt-3 text-center text-[11.5px] font-normal text-white/[0.38] tracking-[0.2px]">
            K-BOOST · 모르면 뒤처지는 글로벌 매출 트렌드
          </div>
        </div>
      </div>

      {/* URGENT POPUP */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center px-5 animate-[fadeIn_0.3s_ease-out]">
          <div className="w-full max-w-[340px] bg-white border-[3px] border-[#dd0000] shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
            {/* Popup Header */}
            <div className="bg-[#dd0000] px-3 py-2 flex items-center gap-[5px]">
              <span className="text-[13px] leading-none">🚨</span>
              <span className="text-[12px] font-black text-white">[긴급] 리포트 발송 지연 안내</span>
            </div>

            {/* Popup Body */}
            <div className="px-3.5 pt-3.5 pb-2.5 bg-white">
              <div className="text-[12px] font-normal text-[#222] leading-[1.85] break-keep" style={{ fontFamily: "'Dotum', 'Gulim', '돋움', '굴림', 'Apple SD Gothic Neo', sans-serif" }}>
                현재 신청이 폭주하고 있어 맞춤 리포트(PDF) 발송이{" "}
                <span className="text-[#d00] font-black">정상 소요시간보다 지연</span>되고 있습니다.
                <br /><br />
                순서대로 제작 진행 중이오니 조금만 기다려주세요.
              </div>

              <div className="mt-2.5 bg-[#f5f5f5] border border-[#ddd] px-2.5 py-2 text-[11px] text-[#555] leading-[1.7]" style={{ fontFamily: "'Dotum', 'Gulim', '돋움', sans-serif" }}>
                현재 대기열 :{" "}
                <span className="font-outfit font-extrabold text-[#d00] text-[13px]">{queueNum}</span>건 처리중
                <br />
                ※ 이미 접수된 건은 <b className="text-black">재신청 불필요</b> (순번 유지)
              </div>

              <div className="mt-2 text-[10px] text-[#aaa] text-right" style={{ fontFamily: "'Dotum', 'Gulim', '돋움', sans-serif" }}>
                <span className="inline-block w-1 h-1 bg-[#d00] rounded-full mr-[3px] align-middle animate-[blink_0.8s_step-end_infinite]" />
                {popupTime} 기준
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowPopup(false)}
              className="block mx-3 mb-3 mt-1 w-[calc(100%-24px)] py-[9px] border border-[#ccc] bg-[#f0f0f0] text-[11px] font-bold text-[#333] cursor-pointer active:bg-[#e0e0e0]"
              style={{ fontFamily: "'Dotum', 'Gulim', '돋움', sans-serif" }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
