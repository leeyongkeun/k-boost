"use client";

import { useEffect, useState, useRef } from "react";

const LOGO_BASE64 = "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";

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  const [countdown, setCountdown] = useState("");
  const endTimeRef = useRef(Date.now() + 2 * 86400000 + 3 * 3600000 + 11 * 60000 + 32 * 1000);

  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const diff = Math.max(0, endTimeRef.current - Date.now());
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${pad(d)}일 ${pad(h)}시간 ${pad(m)}분 ${pad(s)}초`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center px-6 py-10 relative overflow-hidden">
      {/* Background effects */}
      <div className="grid-overlay" />
      <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[320px] h-[320px] rounded-full bg-[radial-gradient(circle,rgba(197,3,55,0.07)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-[60px] -right-[60px] w-[250px] h-[250px] rounded-full bg-[radial-gradient(circle,rgba(10,42,107,0.4)_0%,transparent_70%)] pointer-events-none" />

      {/* Particles */}
      {[
        "top-[12%] left-[10%] w-[3px] h-[3px] duration-[7s]",
        "top-[22%] right-[15%] w-[2px] h-[2px] duration-[9s] delay-[1.5s]",
        "top-[65%] left-[6%] w-[3px] h-[3px] duration-[6s] delay-[3s]",
        "top-[75%] right-[8%] w-[2px] h-[2px] duration-[10s] delay-[2s]",
        "top-[45%] left-[85%] w-[2px] h-[2px] delay-[4s]",
      ].map((cls, i) => (
        <div key={i} className={`absolute rounded-full bg-white/[0.12] animate-[floatParticle_8s_ease-in-out_infinite] ${cls}`} />
      ))}

      {/* Stars */}
      {[
        "top-[6%] left-[18%] w-[2px] h-[2px]",
        "top-[4%] right-[22%] w-[1.5px] h-[1.5px] delay-[1s]",
        "top-[10%] right-[12%] w-[2px] h-[2px] delay-[2s]",
        "top-[2%] left-[45%] w-[1px] h-[1px] delay-[0.5s]",
      ].map((cls, i) => (
        <div key={i} className={`absolute rounded-full bg-white animate-twinkle ${cls}`} />
      ))}

      {/* Logo Section */}
      <div className="text-center relative z-[2] animate-fade-down">
        <img
          src={`data:image/jpeg;base64,${LOGO_BASE64}`}
          alt="K-BOOST"
          className="h-[34px] w-auto block mx-auto object-contain"
        />
        <div className="mt-2 text-[11.5px] font-normal text-white/60 tracking-[0.5px]">
          당신의 사업에 글로벌 엔진을 달아보세요
        </div>
      </div>

      {/* Divider */}
      <div className="w-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-[22px] relative z-[2] animate-[fadeIn_1s_ease-out_0.2s_both]" />

      {/* Headline */}
      <div className="text-center relative z-[2] animate-[fadeIn_0.8s_ease-out_0.15s_both]">
        <h1 className="text-[24px] font-bold leading-[1.55] tracking-[-0.3px] text-white break-keep">
          외국인 관광객 <em className="not-italic text-[#e8254d]">1,700만</em> 돌파,<br />
          역사상 단 한 번도 없었던 매출 기회
        </h1>
      </div>

      {/* Rocket Section */}
      <div className="relative z-[2] flex items-center justify-center flex-1 w-full animate-[fadeIn_1s_ease-out_0.3s_both]">
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Glow ring */}
          <div className="absolute top-1/2 left-1/2 w-[min(36dvh,230px)] h-[min(36dvh,230px)] rounded-full bg-[radial-gradient(circle,rgba(197,3,55,0.1)_0%,rgba(197,3,55,0.02)_45%,transparent_70%)] animate-pulse-glow" />
          {/* Orbit */}
          <div className="absolute top-1/2 left-1/2 w-[min(40dvh,250px)] h-[min(40dvh,250px)] border border-white/5 rounded-full animate-orbit-spin before:content-[''] before:absolute before:-top-1 before:left-1/2 before:w-[7px] before:h-[7px] before:bg-[#C50337] before:rounded-full before:shadow-[0_0_14px_#C50337]" />
          {/* Rocket */}
          <div className="text-[min(26dvh,170px)] leading-none animate-rocket-float relative z-[2] drop-shadow-[0_0_50px_rgba(197,3,55,0.35)] drop-shadow-[0_25px_60px_rgba(2,28,79,0.7)]">
            🚀
          </div>
          {/* Trail */}
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex gap-1.5">
            {[32, 44, 38, 28, 40].map((h, i) => (
              <span
                key={i}
                className="w-[3px] rounded-[3px] bg-gradient-to-b from-[rgba(197,3,55,0.35)] to-transparent animate-exhaust"
                style={{
                  height: `${h}px`,
                  animationDelay: `${[0, 0.2, 0.4, 0.15, 0.35][i]}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Test description */}
      <div className="text-center relative z-[2] mb-6 animate-[fadeUp_0.8s_ease-out_0.45s_both]">
        <p className="text-[18px] font-medium text-white/70 leading-[1.6] tracking-[-0.2px] break-keep">
          내 매장의 <span className="text-white font-extrabold relative inline bg-[linear-gradient(transparent_60%,rgba(197,3,55,0.35)_60%)]">글로벌 잠재력</span>을<br />
          지금 바로 테스트 해보세요!
        </p>
      </div>

      {/* Bottom Section */}
      <div className="w-full max-w-[340px] relative z-[2] animate-[fadeUp_0.8s_ease-out_0.5s_both]">
        {/* Countdown bar */}
        <div className="flex items-center justify-center gap-[7px] mb-3.5 py-2.5 px-4 bg-[rgba(197,3,55,0.06)] border border-[rgba(197,3,55,0.12)] rounded-xl backdrop-blur-[10px]">
          <div className="flex items-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" />
              <line x1="10" y1="5.5" x2="10" y2="10" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="10" y1="10" x2="13" y2="12" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[12.5px] font-medium text-white/75 tracking-[-0.1px]">
            무료 테스트 <span className="font-outfit font-bold text-[#e8254d] tabular-nums">{countdown}</span> 남음
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          className="flex items-center justify-center gap-0.5 w-full py-[18px] px-8 border-none rounded-2xl font-noto text-[17px] font-bold tracking-[0.3px] text-white cursor-pointer relative overflow-hidden bg-gradient-to-br from-[#C50337] via-[#e8254d] to-[#C50337] bg-[length:200%_200%] animate-shimmer-btn shadow-[0_4px_20px_rgba(197,3,55,0.45),0_10px_40px_rgba(197,3,55,0.18),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-2px_0_rgba(0,0,0,0.12)] active:scale-[0.97] transition-transform"
        >
          <span className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sheen" />
          <span className="text-[19px] mr-1">🚀</span>
          테스트 시작
          <span className="ml-1.5 font-normal opacity-75">→</span>
        </button>

        {/* Sub text */}
        <div className="mt-3 text-center text-[11px] font-normal text-white/[0.38] tracking-[0.3px]">
          K-BOOST 공식프로그램<span className="inline-block w-[3px] h-[3px] bg-white/[0.38] rounded-full mx-1.5 align-middle" />10초 정밀진단
        </div>
      </div>
    </div>
  );
}
