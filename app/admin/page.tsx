"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardSection from "./DashboardSection";

interface SearchResult {
  id: string;
  created_at: string;
  store_name: string | null;
  business_type: string | null;
  address: string | null;
  score: number | null;
  grade: string | null;
  customer_phone: string | null;
  pdf_sent: boolean | null;
  inbound: string | null;
}

interface DetailData {
  [key: string]: unknown;
}

type SortField =
  | "created_at"
  | "store_name"
  | "business_type"
  | "score"
  | "grade";

export default function AdminPage() {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [data, setData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterGrade, setFilterGrade] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterPdfSent, setFilterPdfSent] = useState("");

  // Sort
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 페이지 로드 시 sessionStorage에서 토큰 복원
  useEffect(() => {
    const savedToken = sessionStorage.getItem("admin_token");
    if (savedToken) {
      setToken(savedToken);
      setAuthenticated(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    if (filterGrade) params.set("grade", filterGrade);
    if (filterPhone) params.set("hasPhone", filterPhone);
    if (filterPdfSent) params.set("pdfSent", filterPdfSent);

    try {
      const res = await fetch(`/api/admin?${params.toString()}`, {
        headers: { "x-admin-token": token },
      });

      if (res.status === 401) {
        setAuthenticated(false);
        setToken("");
        sessionStorage.removeItem("admin_token");
        setAuthError("세션이 만료되었습니다. 다시 로그인해주세요.");
        return;
      }

      const json = await res.json();
      setData(json.data || []);
    } catch {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [token, sortBy, sortOrder, filterGrade, filterPhone, filterPdfSent]);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated, fetchData]);

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

  const togglePdfSent = async (id: string, currentValue: boolean | null) => {
    const newValue = !currentValue;

    // Optimistic update
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, pdf_sent: newValue } : row))
    );

    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": token,
      },
      body: JSON.stringify({ id, pdf_sent: newValue }),
    });

    if (!res.ok) {
      // Revert on failure
      setData((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, pdf_sent: currentValue } : row
        )
      );
    }
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const sortArrow = (field: SortField) => {
    if (sortBy !== field) return "";
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const gradeColor = (grade: string | null) => {
    switch (grade) {
      case "S":
        return "text-yellow-400 font-bold";
      case "A":
        return "text-green-400 font-bold";
      case "B":
        return "text-blue-400 font-bold";
      case "C":
        return "text-orange-400 font-bold";
      case "D":
        return "text-red-400 font-bold";
      default:
        return "text-gray-400";
    }
  };

  // Detail modal
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const openDetail = async (id: string) => {
    setShowDetail(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await fetch(`/api/admin?id=${id}`, {
        headers: { "x-admin-token": token },
      });
      const json = await res.json();
      setDetailData(json.data || null);
    } catch {
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setToken("");
    setAdminId("");
    setData([]);
    sessionStorage.removeItem("admin_token");
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#010e2a] via-[#021C4F] to-[#0a2a6b] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 w-full max-w-sm"
        >
          <div className="flex flex-col items-center mb-6">
            <span className="text-[48px] mb-2">🚀</span>
            <h1 className="text-xl font-bold text-white">K-BOOST 관리자페이지</h1>
          </div>
          <input
            type="text"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            placeholder="아이디"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#C50337] mb-3"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#C50337] mb-4"
          />
          {authError && (
            <p className="text-[#e8254d] text-sm mb-4">{authError}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#C50337] hover:bg-[#e8254d] text-white font-bold transition-colors cursor-pointer"
          >
            로그인
          </button>
        </form>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010e2a] via-[#021C4F] to-[#0a2a6b] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[28px]">🚀</span>
            <h1 className="text-xl font-bold text-white">K-BOOST 관리자페이지</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-sm">
              총 {data.length}건
            </span>
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors cursor-pointer"
            >
              새로고침
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-sm transition-colors cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* Dashboard */}
        <DashboardSection token={token} />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-[#021C4F]">
              등급 전체
            </option>
            <option value="S" className="bg-[#021C4F]">
              S등급
            </option>
            <option value="A" className="bg-[#021C4F]">
              A등급
            </option>
            <option value="B" className="bg-[#021C4F]">
              B등급
            </option>
            <option value="C" className="bg-[#021C4F]">
              C등급
            </option>
            <option value="D" className="bg-[#021C4F]">
              D등급
            </option>
          </select>

          <select
            value={filterPhone}
            onChange={(e) => setFilterPhone(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-[#021C4F]">
              연락처 전체
            </option>
            <option value="yes" className="bg-[#021C4F]">
              연락처 있음
            </option>
            <option value="no" className="bg-[#021C4F]">
              연락처 없음
            </option>
          </select>

          <select
            value={filterPdfSent}
            onChange={(e) => setFilterPdfSent(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-[#021C4F]">
              PDF 전체
            </option>
            <option value="true" className="bg-[#021C4F]">
              발송 완료
            </option>
            <option value="false" className="bg-[#021C4F]">
              미발송
            </option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th
                    onClick={() => handleSort("created_at")}
                    className="px-4 py-3 text-white/70 font-medium cursor-pointer hover:text-white whitespace-nowrap"
                  >
                    일시{sortArrow("created_at")}
                  </th>
                  <th
                    onClick={() => handleSort("store_name")}
                    className="px-4 py-3 text-white/70 font-medium cursor-pointer hover:text-white whitespace-nowrap"
                  >
                    매장명{sortArrow("store_name")}
                  </th>
                  <th
                    onClick={() => handleSort("business_type")}
                    className="px-4 py-3 text-white/70 font-medium cursor-pointer hover:text-white whitespace-nowrap"
                  >
                    업종{sortArrow("business_type")}
                  </th>
                  <th className="px-4 py-3 text-white/70 font-medium whitespace-nowrap">
                    주소
                  </th>
                  <th
                    onClick={() => handleSort("score")}
                    className="px-4 py-3 text-white/70 font-medium cursor-pointer hover:text-white whitespace-nowrap text-center"
                  >
                    점수{sortArrow("score")}
                  </th>
                  <th
                    onClick={() => handleSort("grade")}
                    className="px-4 py-3 text-white/70 font-medium cursor-pointer hover:text-white whitespace-nowrap text-center"
                  >
                    등급{sortArrow("grade")}
                  </th>
                  <th className="px-4 py-3 text-white/70 font-medium whitespace-nowrap">
                    고객 연락처
                  </th>
                  <th className="px-4 py-3 text-white/70 font-medium whitespace-nowrap text-center">
                    PDF 발송
                  </th>
                  <th className="px-4 py-3 text-white/70 font-medium whitespace-nowrap">
                    유입경로
                  </th>
                  <th className="px-4 py-3 text-white/70 font-medium whitespace-nowrap text-center">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-white/40">
                      로딩 중...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-white/40">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">
                        {row.store_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {row.business_type || "-"}
                      </td>
                      <td className="px-4 py-3 text-white/60 max-w-[200px] truncate">
                        {row.address || "-"}
                      </td>
                      <td className="px-4 py-3 text-white text-center font-mono">
                        {row.score ?? "-"}
                      </td>
                      <td
                        className={`px-4 py-3 text-center ${gradeColor(row.grade)}`}
                      >
                        {row.grade || "-"}
                      </td>
                      <td className="px-4 py-3 text-white/80 font-mono">
                        {row.customer_phone || (
                          <span className="text-white/30">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!row.pdf_sent}
                          onChange={() => togglePdfSent(row.id, row.pdf_sent)}
                          className="w-4 h-4 rounded accent-[#C50337] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-white/60 text-sm">
                        {row.inbound || <span className="text-white/20">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openDetail(row.id)}
                          className="text-white/30 hover:text-white/70 cursor-pointer transition-colors"
                          title="상세보기"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-[5vh] px-4 overflow-y-auto"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-gradient-to-b from-[#0a1a3a] to-[#091530] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl mb-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-[16px] font-bold text-white">
                {detailData ? (detailData.store_name as string) || "상세 내역" : "상세 내역"}
              </h2>
              <button
                onClick={() => setShowDetail(false)}
                className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center text-white/50 text-[16px] cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 max-h-[75vh] overflow-y-auto space-y-5">
              {detailLoading ? (
                <div className="py-12 text-center text-white/40">로딩 중...</div>
              ) : !detailData ? (
                <div className="py-12 text-center text-white/40">데이터를 찾을 수 없습니다.</div>
              ) : (
                <>
                  {/* 매장 + 등급 */}
                  <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-white/60">매장 정보</span>
                      <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-md border ${
                        { S: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
                          A: "text-green-400 bg-green-500/10 border-green-500/20",
                          B: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                          C: "text-orange-400 bg-orange-500/10 border-orange-500/20",
                          D: "text-red-400 bg-red-500/10 border-red-500/20",
                        }[detailData.grade as string] || "text-white/30 bg-white/5 border-white/10"
                      }`}>
                        {(detailData.grade as string) || "-"}등급 · {(detailData.score as number) ?? "-"}점
                      </span>
                    </div>
                    <DetailRow label="매장명" value={detailData.store_name as string} />
                    <DetailRow label="업종" value={detailData.business_type as string} />
                    <DetailRow label="주소" value={detailData.address as string} />
                    <DetailRow label="매장 전화" value={detailData.phone as string} />
                    <DetailRow label="Instagram" value={detailData.instagram_url as string} link />
                    <DetailRow label="검색 키워드" value={detailData.search_keyword as string} />
                    <DetailRow label="분석 일시" value={
                      detailData.created_at
                        ? new Date(detailData.created_at as string).toLocaleString("ko-KR")
                        : null
                    } />
                  </div>

                  {/* 사용자 입력 */}
                  <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2.5">
                    <span className="text-[13px] font-bold text-white/60">사용자 입력</span>
                    <DetailRow label="외국인 비율" value={detailData.foreign_ratio as string} />
                    <DetailRow label="변경 의향" value={detailData.change_willingness as string} />
                    <DetailRow label="유입경로" value={detailData.inbound as string} />
                  </div>

                  {/* 플랫폼 */}
                  <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2.5">
                    <span className="text-[13px] font-bold text-white/60">플랫폼 등록</span>
                    <DetailRow label="네이버 지도" value={detailData.naver_registered ? "등록" : "미등록"} badge={detailData.naver_registered as boolean} />
                    <DetailRow label="네이버 카테고리" value={detailData.naver_category as string} />
                    <DetailRow label="네이버 주소" value={detailData.naver_road_address as string || detailData.naver_address as string} />
                    <DetailRow label="네이버 링크" value={detailData.naver_link as string} link />
                    <div className="border-t border-white/5 my-2" />
                    <DetailRow label="카카오맵" value={detailData.kakao_registered ? "등록" : "미등록"} badge={detailData.kakao_registered as boolean} />
                    <DetailRow label="카카오 카테고리" value={detailData.kakao_category as string} />
                    <DetailRow label="카카오 주소" value={detailData.kakao_road_address as string || detailData.kakao_address as string} />
                    <DetailRow label="카카오 링크" value={detailData.kakao_place_url as string} link />
                    <div className="border-t border-white/5 my-2" />
                    <DetailRow label="Google Maps" value={detailData.google_registered ? "등록" : "미등록"} badge={detailData.google_registered as boolean} />
                    <DetailRow label="Google 평점" value={detailData.google_rating != null ? `⭐ ${detailData.google_rating}` : null} />
                    <DetailRow label="Google 리뷰" value={detailData.google_review_count != null ? `${detailData.google_review_count}건` : null} />
                    <DetailRow label="사진 여부" value={detailData.google_has_photos ? "있음" : "없음"} badge={detailData.google_has_photos as boolean} />
                    <DetailRow label="영어 지원" value={detailData.google_has_english ? "있음" : "없음"} badge={detailData.google_has_english as boolean} />
                  </div>

                  {/* 고객 */}
                  <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2.5">
                    <span className="text-[13px] font-bold text-white/60">고객 정보</span>
                    <DetailRow label="고객 연락처" value={detailData.customer_phone as string} bold />
                    <DetailRow label="PDF 발송" value={detailData.pdf_sent ? "발송 완료" : "미발송"} badge={detailData.pdf_sent as boolean} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, link, badge, bold }: {
  label: string;
  value: unknown;
  link?: boolean;
  badge?: boolean;
  bold?: boolean;
}) {
  const display = value as string | null;
  return (
    <div className="flex items-start gap-3">
      <span className="text-[12px] text-white/35 w-[110px] shrink-0 pt-0.5">{label}</span>
      {!display ? (
        <span className="text-[13px] text-white/20">-</span>
      ) : link ? (
        <a href={display} target="_blank" rel="noopener noreferrer" className="text-[13px] text-blue-400 underline break-all">{display}</a>
      ) : badge !== undefined ? (
        <span className={`text-[13px] font-semibold ${badge ? "text-green-400" : "text-red-400"}`}>{display}</span>
      ) : (
        <span className={`text-[13px] text-white ${bold ? "font-bold font-mono" : ""}`}>{display}</span>
      )}
    </div>
  );
}
