"use client";

import { forwardRef } from "react";
import { CardNewsItem } from "@/lib/cardnews-types";
import { GRADIENTS } from "@/lib/cardnews-gradients";

interface CardRendererProps {
  card: CardNewsItem;
  scale?: number;
}

const CardRenderer = forwardRef<HTMLDivElement, CardRendererProps>(
  ({ card, scale }, ref) => {
    const gradient = GRADIENTS[card.gradientKey] || GRADIENTS.navy_red;
    const s = scale || 1;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1080,
          background: gradient.background,
          color: gradient.textColor,
          transform: `scale(${s})`,
          transformOrigin: "top left",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}
        className="relative overflow-hidden flex flex-col"
      >
        {/* Decorative circles */}
        <div
          className="absolute rounded-full opacity-[0.06]"
          style={{
            width: 500,
            height: 500,
            background: gradient.accentColor,
            top: -120,
            right: -120,
          }}
        />
        <div
          className="absolute rounded-full opacity-[0.04]"
          style={{
            width: 350,
            height: 350,
            background: gradient.accentColor,
            bottom: -80,
            left: -80,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-[80px] py-[70px]">
          {card.type === "cover" && <CoverLayout card={card} accent={gradient.accentColor} />}
          {card.type === "content" && <ContentLayout card={card} accent={gradient.accentColor} />}
          {card.type === "cta" && <CtaLayout card={card} accent={gradient.accentColor} />}

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between">
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>
              K-BOOST
            </div>
            {card.source && (
              <div style={{ fontSize: 22, opacity: 0.4 }}>
                {card.source}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CardRenderer.displayName = "CardRenderer";
export default CardRenderer;

function CoverLayout({ card, accent }: { card: CardNewsItem; accent: string }) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center">
      <div
        style={{
          fontSize: 30,
          fontWeight: 500,
          opacity: 0.5,
          marginBottom: 24,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        K-Tourism Trend
      </div>
      <div
        style={{
          fontSize: 58,
          fontWeight: 900,
          lineHeight: 1.3,
          marginBottom: 32,
          maxWidth: 800,
        }}
      >
        {card.headline}
      </div>
      {card.subHeadline && (
        <div style={{ fontSize: 30, opacity: 0.7, marginBottom: 40 }}>
          {card.subHeadline}
        </div>
      )}
      <div className="flex gap-[16px] flex-wrap justify-center">
        {card.bodyPoints.map((point, i) => (
          <div
            key={i}
            style={{
              background: accent,
              color: "#fff",
              padding: "12px 28px",
              borderRadius: 50,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            #{point}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentLayout({ card, accent }: { card: CardNewsItem; accent: string }) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Stat */}
      {card.statValue && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: accent,
              lineHeight: 1.1,
            }}
          >
            {card.statValue}
          </div>
          {card.statLabel && (
            <div style={{ fontSize: 26, opacity: 0.5, marginTop: 8 }}>
              {card.statLabel}
            </div>
          )}
        </div>
      )}

      {/* Headline */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 900,
          lineHeight: 1.35,
          marginBottom: 16,
        }}
      >
        {card.headline}
      </div>

      {card.subHeadline && (
        <div style={{ fontSize: 28, opacity: 0.6, marginBottom: 32 }}>
          {card.subHeadline}
        </div>
      )}

      {/* Body Points */}
      <div className="flex-1 flex flex-col justify-center" style={{ gap: 20 }}>
        {card.bodyPoints.map((point, i) => (
          <div key={i} className="flex items-start" style={{ gap: 16 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: accent,
                marginTop: 14,
                flexShrink: 0,
              }}
            />
            <div style={{ fontSize: 30, lineHeight: 1.6, opacity: 0.9 }}>
              {point}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaLayout({ card, accent }: { card: CardNewsItem; accent: string }) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center">
      <div style={{ fontSize: 64, marginBottom: 32 }}>🚀</div>
      <div
        style={{
          fontSize: 48,
          fontWeight: 900,
          lineHeight: 1.35,
          marginBottom: 40,
          maxWidth: 800,
        }}
      >
        {card.headline}
      </div>

      <div className="flex flex-col" style={{ gap: 16, marginBottom: 48 }}>
        {card.bodyPoints.map((point, i) => (
          <div
            key={i}
            style={{ fontSize: 28, opacity: 0.8, lineHeight: 1.6 }}
          >
            {point}
          </div>
        ))}
      </div>

      <div
        style={{
          background: accent,
          color: "#fff",
          padding: "20px 56px",
          borderRadius: 60,
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        무료 매장 진단 받기 →
      </div>
      <div style={{ fontSize: 24, opacity: 0.4, marginTop: 20 }}>
        kboost.imweb.me
      </div>
    </div>
  );
}
