import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ETRI 언어분석 API 테스터",
  description: "ETRI 언어분석 기술 6종 API를 테스트하는 웹 인터페이스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
