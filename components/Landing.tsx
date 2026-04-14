"use client";

import { useEffect, useState, useRef } from "react";

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
          src="/logo-w.png"
          alt="K-BOOST"
          className="h-[34px] w-auto block mx-auto object-contain"
        />
        <div className="mt-2 text-[11.5px] font-normal text-white/60 tracking-[0.5px]">
          당신의 사업에 글로벌 엔진을 달아보세요
        </div>
      </div>

      {/* Divider */}
      <div className="w-10 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent my-[28px] relative z-[2] animate-[fadeIn_1s_ease-out_0.2s_both]" />

      {/* Headline */}
      <div className="text-center relative z-[2] animate-[fadeIn_0.8s_ease-out_0.15s_both]">
        <h1 className="text-[24px] font-bold leading-[1.55] tracking-[-0.3px] text-white break-keep">
          외국인 관광객 <em className="not-italic text-[#e8254d]">1,700만</em> 돌파,<br />
          역사상 단 한 번도 없었던 매출 기회
        </h1>
      </div>

      {/* Rocket Section — smaller for small mobile */}
      <div className="relative z-[2] flex items-center justify-center flex-1 w-full my-4 animate-[fadeIn_1s_ease-out_0.3s_both]">
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Glow ring */}
          <div className="absolute top-1/2 left-1/2 w-[min(28dvh,180px)] h-[min(28dvh,180px)] rounded-full bg-[radial-gradient(circle,rgba(197,3,55,0.1)_0%,rgba(197,3,55,0.02)_45%,transparent_70%)] animate-pulse-glow" />
          {/* Orbit */}
          <div className="absolute top-1/2 left-1/2 w-[min(32dvh,200px)] h-[min(32dvh,200px)] border border-white/5 rounded-full animate-orbit-spin before:content-[''] before:absolute before:-top-1 before:left-1/2 before:w-[7px] before:h-[7px] before:bg-[#C50337] before:rounded-full before:shadow-[0_0_14px_#C50337]" />
          {/* Rocket */}
          <div className="text-[min(20dvh,130px)] leading-none animate-rocket-float relative z-[2] drop-shadow-[0_0_50px_rgba(197,3,55,0.35)] drop-shadow-[0_25px_60px_rgba(2,28,79,0.7)]">
            🚀
          </div>
          {/* Trail */}
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 flex gap-1.5">
            {[24, 34, 28, 20, 30].map((h, i) => (
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
      <div className="text-center relative z-[2] mb-8 animate-[fadeUp_0.8s_ease-out_0.45s_both]">
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
