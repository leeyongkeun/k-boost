"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MapSection = lazy(() => import("./MapSection"));

interface DailyRow {
  date: string;
  total: number;
  S: number;
  A: number;
  B: number;
  C: number;
  D: number;
}

interface Summary {
  totalAllTime: number;
  today: number;
  withPhone: number;
  pdfSent: number;
  leadRate: number;
  pdfRate: number;
}

interface Pin {
  id: string;
  storeName: string | null;
  grade: string | null;
  score: number | null;
  address: string | null;
  lat: number;
  lng: number;
}

interface StatsData {
  daily: DailyRow[];
  pins: Pin[];
  summary: Summary;
}

const GRADE_COLORS: Record<string, string> = {
  S: "#facc15", // yellow-400
  A: "#4ade80", // green-400
  B: "#60a5fa", // blue-400
  C: "#fb923c", // orange-400
  D: "#f87171", // red-400
};

function formatDateLabel(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum: number, p: { value: number }) => sum + p.value, 0);
  return (
    <div className="bg-[#0a1a3a] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <div className="text-white/50 text-[11px] mb-1.5">{label}</div>
      <div className="text-white font-bold text-[15px] mb-2">총 {total}건</div>
      <div className="space-y-0.5">
        {payload.filter((p: { value: number }) => p.value > 0).map((p: { dataKey: string; color: string; value: number }) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-[12px]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-white/70">{p.dataKey}등급</span>
            <span className="text-white font-semibold ml-auto">{p.value}건</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardSection({ token }: { token: string }) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?days=${days}`, {
        headers: { "x-admin-token": token },
      });
      if (res.ok) {
        const json = await res.json();
        setStats(json);
      }
    } catch {
      console.error("Stats fetch failed");
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="mb-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center text-white/40">
        대시보드 로딩 중...
      </div>
    );
  }

  if (!stats) return null;

  const { summary, daily, pins } = stats;

  const kpiCards = [
    { label: "총 등록 수", value: summary.totalAllTime.toLocaleString(), sub: "전체", color: "text-white" },
    { label: "오늘 등록", value: summary.today.toString(), sub: "건", color: summary.today > 0 ? "text-[#e8254d]" : "text-white/40" },
    { label: "리드 수집률", value: `${summary.leadRate}%`, sub: `${summary.withPhone}건`, color: summary.leadRate >= 30 ? "text-emerald-400" : "text-white" },
    { label: "PDF 발송률", value: `${summary.pdfRate}%`, sub: `${summary.pdfSent}건`, color: "text-blue-400" },
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
          >
            <div className="text-[11px] text-white/40 mb-1">{card.label}</div>
            <div className={`text-[24px] font-bold ${card.color} leading-tight`}>
              {card.value}
            </div>
            <div className="text-[11px] text-white/30 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart Container */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-white/80">일별 등록 통계</h3>
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded-lg text-[12px] cursor-pointer transition-colors ${
                  days === d
                    ? "bg-white/15 text-white font-semibold"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                }`}
              >
                {d}일
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={daily} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
              interval={days <= 7 ? 0 : days <= 14 ? 1 : "preserveStartEnd"}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value: string) => <span style={{ color: "rgba(255,255,255,0.5)" }}>{value}</span>}
            />
            {Object.entries(GRADE_COLORS).map(([grade, color]) => (
              <Bar
                key={grade}
                dataKey={grade}
                stackId="grade"
                fill={color}
                radius={grade === "S" ? [3, 3, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Map */}
      <Suspense fallback={
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center text-white/40">
          지도 로딩 중...
        </div>
      }>
        <MapSection pins={pins} />
      </Suspense>
    </div>
  );
}
