import type { Metadata, Viewport } from "next";
import { Outfit, Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { META_PIXEL_ID } from "@/lib/pixel";

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
      <head>
        {/* Meta Pixel Code — 기본 코드 + PageView (가이드 1단계) */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}
      </head>
      <body className={`${outfit.variable} ${notoSansKR.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
