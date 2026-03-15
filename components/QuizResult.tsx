"use client";

import { AnalysisResult } from "@/lib/types";
import GradeBadge from "./GradeBadge";
import ScoreRing from "./ScoreRing";

interface QuizResultProps {
  result: AnalysisResult;
  onRestart: () => void;
  resultId?: string | null;
}

const PLATFORM_ICONS: Record<string, string> = {
  "네이버 지도": "/icons/naver-map.svg",
  "카카오맵": "/icons/kakao-map.svg",
  "Google Maps": "/icons/google-maps.svg",
};

function getPlatformLink(p: { name: string; link?: string; registered: boolean }, storeName: string): string | null {
  if (!p.registered) return null;
  if (p.name === "네이버 지도") {
    // link가 네이버 도메인이 아니면(인스타 등) 네이버 지도 검색 URL 생성
    if (p.link && /naver\.com|naver\.me/.test(p.link)) return p.link;
    return `https://map.naver.com/v5/search/${encodeURIComponent(storeName)}`;
  }
  if (p.name === "카카오맵") {
    if (p.link) return p.link;
    return `https://map.kakao.com/?q=${encodeURIComponent(storeName)}`;
  }
  if (p.name === "Google Maps") {
    return `https://www.google.com/maps/search/${encodeURIComponent(storeName)}`;
  }
  return null;
}

const STATUS_STYLES = {
  good: { bg: "bg-emerald-500/15", border: "border-emerald-500/25", text: "text-emerald-400" },
  warning: { bg: "bg-yellow-500/15", border: "border-yellow-500/25", text: "text-yellow-400" },
  critical: { bg: "bg-red-500/15", border: "border-red-500/25", text: "text-red-400" },
};

export default function QuizResult({ result, onRestart, resultId }: QuizResultProps) {
  const shareUrl = resultId ? `${window.location.origin}/result/${resultId}` : window.location.href;
  return (
    <div className="pt-6 sm:pt-8 pb-10 sm:pb-12 safe-bottom">
      {/* Grade + Score */}
      <div className="text-center mb-6 sm:mb-8">
        <GradeBadge grade={result.grade} animate />
        <div className="mt-5 sm:mt-6">
          <ScoreRing score={result.score} breakdown={result.score_breakdown} />
        </div>
      </div>

      {/* Title + Summary */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-[20px] sm:text-[22px] font-black leading-snug mb-2.5 sm:mb-3 bg-gradient-to-br from-purple-200 via-pink-300 to-yellow-400 bg-clip-text text-transparent px-1">
          {result.title}
        </h2>
        <p className="text-[13px] sm:text-[14px] text-white/55 leading-[1.7] px-1">{result.summary}</p>
      </div>

      {/* Store Profile Card */}
      {(result.store_address || result.store_phone) && (
        <div className="p-4 sm:p-5 rounded-2xl mb-2.5 sm:mb-3 bg-white/[0.04] border border-white/[0.08]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-[18px] sm:text-[20px] shrink-0">📍</div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] sm:text-[16px] font-bold text-white/90 mb-0.5">{result.store_name}</div>
              <div className="text-[11px] sm:text-[12px] text-purple-300/70 font-medium mb-1.5">{result.business_type}</div>
              {result.store_address && (
                <div className="text-[12px] sm:text-[13px] text-white/45 leading-snug mb-0.5">{result.store_address}</div>
              )}
              {result.store_phone && (
                <div className="text-[12px] sm:text-[13px] text-white/45">{result.store_phone}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Platform Analysis */}
      {result.platforms && result.platforms.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl mb-2.5 sm:mb-3 bg-white/[0.03] border border-white/[0.06]">
          <div className="text-[12px] sm:text-[13px] font-bold text-white/60 mb-3 sm:mb-3.5">플랫폼 등록 현황</div>
          <div className="space-y-2.5 sm:space-y-3">
            {result.platforms.map((p) => {
              const icon = PLATFORM_ICONS[p.name];
              const link = getPlatformLink(p, result.store_name);
              return (
                <div key={p.name} className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {icon ? (
                        <img src={icon} alt={p.name} className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg shrink-0" />
                      ) : (
                        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${p.registered ? "bg-emerald-400" : "bg-red-400"}`} />
                      )}
                      <span className="text-[13px] sm:text-[14px] text-white/80 font-semibold">{p.name}</span>
                    </div>
                    {!p.registered && (
                      <span className="text-red-400/70 text-[10px] sm:text-[11px] font-medium bg-red-400/10 px-2 py-0.5 rounded-full">미등록</span>
                    )}
                  </div>
                  {p.registered && (
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 ml-8 sm:ml-9">
                      {p.score !== undefined && p.score > 0 && (
                        <span className="text-yellow-400 text-[11px] sm:text-[12px] font-semibold bg-yellow-400/10 px-2 py-0.5 rounded-full">⭐ {p.score.toFixed(1)}</span>
                      )}
                      {p.reviewCount !== undefined && p.reviewCount > 0 && (
                        <span className="text-white/50 text-[11px] sm:text-[12px] bg-white/[0.04] px-2 py-0.5 rounded-full">리뷰 {p.reviewCount}건</span>
                      )}
                      {p.hasPhotos && (
                        <span className="text-white/40 text-[11px] sm:text-[12px] bg-white/[0.04] px-2 py-0.5 rounded-full">📷 사진</span>
                      )}
                      {p.hasEnglish && (
                        <span className="text-purple-400 text-[10px] sm:text-[11px] font-semibold bg-purple-400/10 px-2 py-0.5 rounded-full">🌍 영어</span>
                      )}
                      {!p.hasEnglish && p.name === "Google Maps" && (
                        <span className="text-white/25 text-[10px] sm:text-[11px] bg-white/[0.03] px-2 py-0.5 rounded-full">영어리뷰 없음</span>
                      )}
                      {p.category && (
                        <span className="text-white/30 text-[10px] sm:text-[11px]">{p.category}</span>
                      )}
                    </div>
                  )}
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 ml-8 sm:ml-9 text-[11px] sm:text-[12px] text-purple-400/70 hover:text-purple-300 transition-colors no-underline"
                    >
                      {p.name}에서 보기 →
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* Instagram Link */}
          {result.instagram_url && (
            <div className="mt-2.5 p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <img src="/icons/instagram.svg" alt="Instagram" className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg shrink-0" />
                <span className="text-[13px] sm:text-[14px] text-white/80 font-semibold">Instagram</span>
              </div>
              <a
                href={result.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 ml-8 sm:ml-9 text-[11px] sm:text-[12px] text-purple-400/70 hover:text-purple-300 transition-colors no-underline"
              >
                Instagram에서 보기 →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      {result.key_metrics && result.key_metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-2.5 sm:mb-3">
          {result.key_metrics.map((metric, i) => {
            const s = STATUS_STYLES[metric.status];
            return (
              <div
                key={i}
                className={`p-3 sm:p-4 rounded-2xl ${s.bg} border ${s.border}`}
              >
                <div className="text-[10px] sm:text-[11px] text-white/40 mb-1 sm:mb-1.5 font-medium">{metric.label}</div>
                <div className={`text-[18px] sm:text-[22px] font-black font-outfit leading-none ${s.text}`}>
                  {metric.value}
                </div>
                <div className="text-[9px] sm:text-[10px] text-white/30 mt-1 sm:mt-1.5 leading-snug">{metric.detail}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Improvements */}
      <div className="p-4 sm:p-5 rounded-2xl mb-2.5 sm:mb-3 bg-pink-500/[0.06] border border-pink-500/[0.12]">
        <div className="text-[12px] sm:text-[13px] font-bold text-pink-300 mb-2.5 sm:mb-3">개선 포인트</div>
        {result.improvements?.map((s, i) => (
          <div key={i} className="text-[13px] sm:text-[14px] text-white/70 mb-1.5 sm:mb-2 pl-1 leading-[1.6]">{i + 1}. {s}</div>
        ))}
      </div>

      {/* Action Plan */}
      <div className="p-4 sm:p-5 rounded-2xl mb-2.5 sm:mb-3 bg-gradient-to-br from-purple-600/10 to-yellow-400/[0.06] border border-purple-600/15">
        <div className="text-[12px] sm:text-[13px] font-bold text-yellow-400 mb-2 sm:mb-2.5">이번 주 바로 실행!</div>
        <div className="text-[14px] sm:text-[15px] font-semibold text-white leading-[1.6]">{result.action_plan}</div>
      </div>

      {/* Potential */}
      <div className="py-4 sm:py-5 px-4 sm:px-5 rounded-2xl mb-6 sm:mb-8 bg-white/[0.03] border border-white/[0.05] text-center">
        <div className="text-[11px] sm:text-[12px] text-white/35 mb-1.5 sm:mb-2">3개월 후 기대 효과</div>
        <div className="text-[13px] sm:text-[14px] font-semibold text-white/75 leading-[1.6]">{result.potential}</div>
      </div>

      {/* CTAs */}
      <div className="space-y-2.5 sm:space-y-3">
        <a
          href="https://kboost.imweb.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 sm:py-[18px] rounded-2xl border-none bg-gradient-to-br from-purple-600 to-pink-500 text-white text-[16px] sm:text-[17px] font-bold text-center shadow-[0_4px_30px_rgba(124,58,237,0.4)] hover:shadow-[0_4px_40px_rgba(124,58,237,0.6)] transition-shadow no-underline active:scale-[0.98]"
        >
          {result.cta_message || "K-BOOST 자세히 알아보기"}
        </a>

        <button
          onClick={() => {
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
          className="w-full py-3.5 sm:py-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/[0.06] text-yellow-400 text-[13px] sm:text-[14px] font-semibold cursor-pointer hover:bg-yellow-400/10 transition-colors active:scale-[0.98]"
        >
          내 결과 공유하기
        </button>

        <button
          onClick={onRestart}
          className="w-full py-3 sm:py-3.5 rounded-2xl border border-white/[0.06] bg-transparent text-white/35 text-[12px] sm:text-[13px] cursor-pointer hover:bg-white/[0.03] transition-colors active:scale-[0.98]"
        >
          다시 테스트하기
        </button>
      </div>
    </div>
  );
}
