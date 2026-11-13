import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { WelcomeModal } from "@/components/WelcomeModal";
import { HowToUseModal } from "@/components/HowToUseModal";
import { AdScripts } from "@/components/AdScripts";
import { BottomNav } from "@/components/BottomNav";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "FilmFeed - 4K UHD Movies & TV Series Direct WhatsApp Request",
  description:
    "FilmFeed - Request 4K Movies & Full TV Series seasons with Sinhala Subtitles directly to WhatsApp Group.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head />
      <body className="min-h-screen flex flex-col bg-[#0A0B10] text-white antialiased selection:bg-white selection:text-black">
        <Suspense fallback={null}>
          <WelcomeModal />
          <HowToUseModal />
        </Suspense>
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/[0.06] bg-[#0E1018]/60 py-8 mb-20 lg:mb-0 text-center text-xs text-gray-500">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-white">FILMFEED</span>
              <span className="rounded bg-red-600 px-1.5 py-0.2 text-[9px] font-bold text-white">4K</span>
              <span>• Powered by CineSubz &amp; Auto-Bot Engine</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://wa.me/94782088603" className="text-gray-300 hover:text-white font-mono">
                Movie Bot: +94 78 208 8603
              </a>
              <span>•</span>
              <a href="https://wa.me/94782088603" className="text-gray-300 hover:text-white font-mono">
                TV Bot: +94 78 208 8603
              </a>
              <span>•</span>
              <span className="text-gray-500">Black &amp; White Luxury Edition</span>
            </div>
          </div>
        </footer>
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
