import type { Metadata } from "next";
import "./globals.css";
import { Geist, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Pokeshrimp",
  description: "AI-powered image & video creative workstation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={cn("dark font-sans", geist.variable, playfair.variable)}
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
        {/* Restore theme preference before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,t=localStorage.getItem("pokeshrimp-theme"),light=t==="light"||(t==="system"&&!window.matchMedia("(prefers-color-scheme: dark)").matches);if(light){d.classList.remove("dark");d.classList.add("light")}}catch(e){}})()`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
