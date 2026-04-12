import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

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
    <html lang="zh-CN" className={cn("dark font-sans", geist.variable)} suppressHydrationWarning>
      <body className="h-full overflow-hidden">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("pokeshrimp-theme");if(t==="light")document.documentElement.classList.remove("dark");else if(t==="system"&&!window.matchMedia("(prefers-color-scheme: dark)").matches)document.documentElement.classList.remove("dark")}catch(e){}})()`,
          }}
        />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
