"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Pin {
  id: string;
  storeName: string | null;
  grade: string | null;
  score: number | null;
  address: string | null;
  lat: number;
  lng: number;
}

const GRADE_COLORS: Record<string, string> = {
  S: "#facc15",
  A: "#4ade80",
  B: "#60a5fa",
  C: "#fb923c",
  D: "#f87171",
};

function gradeMarkerHtml(grade: string | null) {
  const color = (grade && GRADE_COLORS[grade]) || "#94a3b8";
  return `<div style="
    width:28px;height:28px;border-radius:50%;
    background:${color};border:2px solid rgba(255,255,255,0.9);
    display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:800;color:#000;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);
  ">${grade || "?"}</div>`;
}

export default function MapSection({ pins }: { pins: Pin[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return;

    // 이미 초기화된 맵이 있으면 제거
    if (leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([37.5665, 126.978], 11);

    leafletMap.current = map;

    // 다크 타일
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    for (const pin of pins) {
      const icon = L.divIcon({
        html: gradeMarkerHtml(pin.grade),
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:160px;">
          <div style="font-size:14px;font-weight:700;margin-bottom:4px;">${pin.storeName || "-"}</div>
          <div style="font-size:12px;color:#666;margin-bottom:6px;">${pin.address || ""}</div>
          <div style="font-size:13px;">
            <span style="color:${GRADE_COLORS[pin.grade || ""] || "#999"};font-weight:700;">${pin.grade || "-"}등급</span>
            <span style="margin-left:6px;color:#333;">${pin.score ?? "-"}점</span>
          </div>
        </div>
      `);

      bounds.extend([pin.lat, pin.lng]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
    }

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, [pins]);

  if (pins.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center text-white/30 text-sm">
        좌표 데이터가 있는 매장이 없습니다
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-bold text-white/80">매장 위치 지도</h3>
        <span className="text-[12px] text-white/40">{pins.length}개 매장</span>
      </div>
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden"
        style={{ height: 360 }}
      />
    </div>
  );
}
