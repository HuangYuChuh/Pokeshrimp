import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokeshrimp",
  description: "AI-powered image & video creative workstation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
