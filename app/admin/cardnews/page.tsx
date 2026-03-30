"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CardNewsSet, CardNewsItem } from "@/lib/cardnews-types";
import CardRenderer from "./CardRenderer";
import html2canvas from "html2canvas";
import JSZip from "jszip";

export default function CardNewsPage() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [newsSet, setNewsSet] = useState<CardNewsSet | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<number | "all" | null>(null);
  const [previewCard, setPreviewCard] = useState<CardNewsItem | null>(null);
  const [tab, setTab] = useState<"generate" | "history">("generate");

  // History state
  interface HistorySet {
    id: string;
    created_at: string;
    card_count: number;
    coverHeadline: string | null;
    coverImage: string | null;
  }
  interface HistoryCard {
    card_index: number;
    card_type: string;
    headline: string;
    sub_headline: string | null;
    body_points: string[];
    stat_value: string | null;
    stat_label: string | null;
    source: string | null;
    image_url: string | null;
    gradient_key: string;
  }
  const [historySets, setHistorySets] = useState<HistorySet[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<HistoryCard[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hiddenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem("admin_token");
    if (savedToken) {
      setToken(savedToken);
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: adminId, password }),
    });
    const json = await res.json();
    if (res.status === 401 || res.status === 429) {
      setAuthError(json.error);
      return;
    }
    if (json.token) {
      setToken(json.token);
      setAuthenticated(true);
      setPassword("");
      sessionStorage.setItem("admin_token", json.token);
    }
  };

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/cardnews/history", {
        headers: { "x-admin-token": token },
      });
      if (res.ok) {
        const json = await res.json();
        setHistorySets(json.sets || []);
      }
    } catch {
      console.error("History fetch failed");
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  const fetchSetDetail = useCallback(async (setId: string) => {
    setSelectedSetId(setId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/cardnews/history?setId=${setId}`, {
        headers: { "x-admin-token": token },
      });
      if (res.ok) {
        const json = await res.json();
        setSelectedCards(json.cards || []);
      }
    } catch {
      console.error("Detail fetch failed");
    } finally {
      setDetailLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authenticated && tab === "history") {
      fetchHistory();
    }
  }, [authenticated, tab, fetchHistory]);

  const generateCards = useCallback(async () => {
    setGenerating(true);
    setError("");
    setNewsSet(null);
    try {
      const res = await fetch("/api/admin/cardnews", {
        method: "POST",
        headers: { "x-admin-token": token },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        setToken("");
        sessionStorage.removeItem("admin_token");
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNewsSet(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setGenerating(false);
    }
  }, [token]);

  const captureCard = async (index: number): Promise<Blob | null> => {
    // 히든 영역에 풀사이즈 카드를 렌더링하고 캡처
    const container = hiddenRef.current;
    if (!container || !newsSet) return null;

    const card = newsSet.cards[index];
    if (!card) return null;

    // 임시 div 생성
    const wrapper = document.createElement("div");
    wrapper.style.width = "1080px";
    wrapper.style.height = "1080px";
    wrapper.style.position = "absolute";
    wrapper.style.left = "0";
    wrapper.style.top = "0";
    container.appendChild(wrapper);

    // React root 대신 innerHTML로 렌더링하기 위해, 기존 ref에서 clone
    const sourceEl = cardRefs.current[index];
    if (!sourceEl) {
      container.removeChild(wrapper);
      return null;
    }

    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.style.transform = "none";
    clone.style.width = "1080px";
    clone.style.height = "1080px";
    wrapper.appendChild(clone);

    await document.fonts.ready;

    try {
      const canvas = await html2canvas(clone, {
        scale: 1,
        width: 1080,
        height: 1080,
        useCORS: true,
        backgroundColor: null,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1);
      });
    } finally {
      container.removeChild(wrapper);
    }
  };

  const downloadSingle = async (index: number) => {
    setDownloading(index);
    try {
      const blob = await captureCard(index);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `kboost-cardnews-${dateStr}-${String(index + 1).padStart(2, "0")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  const downloadAll = async () => {
    if (!newsSet) return;
    setDownloading("all");
    try {
      const zip = new JSZip();
      const dateStr = new Date().toISOString().slice(0, 10);

      for (let i = 0; i < newsSet.cards.length; i++) {
        const blob = await captureCard(i);
        if (blob) {
          zip.file(`kboost-cardnews-${dateStr}-${String(i + 1).padStart(2, "0")}.png`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kboost-cardnews-${dateStr}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  };

  // Login
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#010e2a] via-[#021C4F] to-[#0a2a6b] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <span className="text-[48px] mb-2">📰</span>
            <h1 className="text-xl font-bold text-white">K-BOOST 카드뉴스</h1>
          </div>
          <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="아이디" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#C50337] mb-3" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#C50337] mb-4" />
          {authError && <p className="text-[#e8254d] text-sm mb-4">{authError}</p>}
          <button type="submit" className="w-full py-3 rounded-lg bg-[#C50337] hover:bg-[#e8254d] text-white font-bold transition-colors cursor-pointer">로그인</button>
        </form>
      </div>
    );
  }

  const PREVIEW_SCALE = 0.25;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010e2a] via-[#021C4F] to-[#0a2a6b] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-white/40 hover:text-white/70 transition-colors text-sm">← 관리자</a>
            <span className="text-[28px]">📰</span>
            <h1 className="text-xl font-bold text-white">카드뉴스 생성기</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex gap-1 mr-2">
              <button
                onClick={() => setTab("generate")}
                className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors ${tab === "generate" ? "bg-white/15 text-white font-semibold" : "bg-white/5 text-white/40 hover:bg-white/10"}`}
              >
                생성
              </button>
              <button
                onClick={() => setTab("history")}
                className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors ${tab === "history" ? "bg-white/15 text-white font-semibold" : "bg-white/5 text-white/40 hover:bg-white/10"}`}
              >
                이력
              </button>
            </div>
            <button
              onClick={generateCards}
              disabled={generating || tab === "history"}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-colors cursor-pointer ${
                generating
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-[#C50337] hover:bg-[#e8254d] text-white"
              }`}
            >
              {generating ? "생성 중..." : newsSet ? "다시 생성" : "오늘의 카드뉴스 생성"}
            </button>
            {newsSet && (
              <button
                onClick={downloadAll}
                disabled={downloading !== null}
                className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-30"
              >
                {downloading === "all" ? "ZIP 생성 중..." : "전체 다운로드 (ZIP)"}
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {tab === "generate" && generating && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-[48px] mb-4 animate-bounce">🔍</div>
            <div className="text-white font-bold text-lg mb-2">관광 뉴스를 수집하고 있습니다</div>
            <div className="text-white/40 text-sm">Gemini가 최신 뉴스를 검색하고 카드를 생성합니다 (약 15초)</div>
          </div>
        )}

        {/* Error */}
        {tab === "generate" && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-red-300 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Card Grid */}
        {tab === "generate" && newsSet && !generating && (
          <>
            <div className="text-white/40 text-sm mb-4">
              {new Date(newsSet.generatedAt).toLocaleString("ko-KR")} 생성 · 카드를 클릭하면 미리보기, 다운로드 버튼으로 개별 저장
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {newsSet.cards.map((card, i) => (
                <div key={i} className="group relative">
                  <div
                    className="rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-white/30 transition-all"
                    style={{ width: 1080 * PREVIEW_SCALE, height: 1080 * PREVIEW_SCALE }}
                    onClick={() => setPreviewCard(card)}
                  >
                    <CardRenderer
                      card={card}
                      scale={PREVIEW_SCALE}
                      ref={(el) => { cardRefs.current[i] = el; }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-white/40">
                      {i + 1}/10 · {card.type === "cover" ? "커버" : card.type === "cta" ? "CTA" : "콘텐츠"}
                    </span>
                    <button
                      onClick={() => downloadSingle(i)}
                      disabled={downloading !== null}
                      className="text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                    >
                      {downloading === i ? "저장 중..." : "PNG ↓"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {tab === "generate" && !newsSet && !generating && !error && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-[48px] mb-4">📰</div>
            <div className="text-white font-bold text-lg mb-2">카드뉴스를 생성해보세요</div>
            <div className="text-white/40 text-sm">최신 관광 뉴스를 AI가 수집하여 인스타그램용 카드뉴스 10장을 만들어드립니다</div>
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div>
            {historyLoading ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/40">이력 로딩 중...</div>
            ) : selectedSetId ? (
              /* 세트 상세 보기 */
              <div>
                <button
                  onClick={() => { setSelectedSetId(null); setSelectedCards([]); }}
                  className="text-white/40 hover:text-white text-sm mb-4 cursor-pointer"
                >
                  ← 목록으로
                </button>
                {detailLoading ? (
                  <div className="text-white/40 text-center py-12">로딩 중...</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {selectedCards.map((card) => (
                      <div key={card.card_index} className="group">
                        {card.image_url ? (
                          <img
                            src={card.image_url}
                            alt={card.headline || ""}
                            className="w-full aspect-square object-cover rounded-xl border border-white/10"
                          />
                        ) : (
                          <div className="w-full aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 text-sm">
                            이미지 없음
                          </div>
                        )}
                        <div className="mt-2">
                          <div className="text-[12px] text-white font-semibold truncate">{card.headline}</div>
                          <div className="text-[11px] text-white/40">
                            {card.card_index + 1}/10 · {card.card_type === "cover" ? "커버" : card.card_type === "cta" ? "CTA" : "콘텐츠"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : historySets.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-[48px] mb-4">📂</div>
                <div className="text-white font-bold text-lg mb-2">아직 생성 이력이 없습니다</div>
                <div className="text-white/40 text-sm">카드뉴스를 생성하면 자동으로 저장됩니다</div>
              </div>
            ) : (
              /* 세트 목록 (사진첩) */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {historySets.map((set) => (
                  <div
                    key={set.id}
                    onClick={() => fetchSetDetail(set.id)}
                    className="cursor-pointer group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-white/30 transition-all relative">
                      {set.coverImage ? (
                        <img src={set.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-[48px]">📰</div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="text-[12px] text-white font-semibold truncate">{set.coverHeadline || "카드뉴스"}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-white/40">
                      {new Date(set.created_at).toLocaleString("ko-KR")} · {set.card_count}장
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewCard && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewCard(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewCard(null)}
              className="absolute -top-10 right-0 text-white/50 hover:text-white text-sm cursor-pointer"
            >
              닫기 ✕
            </button>
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                width: Math.min(540, window.innerWidth - 32),
                height: Math.min(540, window.innerWidth - 32),
              }}
            >
              <CardRenderer
                card={previewCard}
                scale={Math.min(540, window.innerWidth - 32) / 1080}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden render area for html2canvas capture */}
      <div
        ref={hiddenRef}
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          width: 1080,
          height: 1080,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
