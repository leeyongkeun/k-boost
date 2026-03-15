import type { Metadata, Viewport } from "next";
import { Outfit, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "K-BOOST | 우리 매장의 K-글로벌 잠재력 분석",
  description:
    "AI가 분석하는 우리 매장의 K-글로벌 잠재력! 3가지 질문, 30초만에 수치 기반 분석 결과를 무료로 받아보세요.",
  openGraph: {
    title: "K-BOOST | K-글로벌 잠재력 분석",
    description: "우리 매장, K-글로벌화하면 어떻게 될까? 30초 무료 AI 분석",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${outfit.variable} ${notoSansKR.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
