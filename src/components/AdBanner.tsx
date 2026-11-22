"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, isVipActive } from "@/lib/userState";
import { Sparkles, Zap, DownloadCloud, ShieldCheck, Play, ExternalLink } from "lucide-react";

interface AdBannerProps {
  className?: string;
  position?: "top" | "middle" | "bottom" | "sidebar" | "verify";
  label?: string;
}

// Active verified Adsterra Smartlinks from account
const ADSTERRA_SMARTLINKS = [
  "https://directyp.org/4/19e3d997accef9e4c330f1be1284d8be", // Primary placement 31620509 for web-umber-six-e1un7z6257.vercel.app
  "https://auctionr.org/4/14476ca5217e71596abcbc486c9ef407", // Active high-CPM Smartlink
  "https://asiafilm.org/4/739684d4bbb6e73705d5d7764d0734ca",  // Active Cinema Smartlink
  "https://ardance.org/4/85b763851dffe3ea28b84d2372c667e8",   // Active Direct Smartlink
];

export const AdBanner: React.FC<AdBannerProps> = ({
  className = "",
  position = "top",
  label = "Sponsored 4K Mirror",
}) => {
  const [isVip, setIsVip] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const user = getCurrentUser();
    return Boolean(user && (isVipActive(user) || user.role === "admin" || user.role === "vip"));
  });

  const [activeLink, setActiveLink] = useState<string>(ADSTERRA_SMARTLINKS[0]);

  useEffect(() => {
    const checkVip = () => {
      const user = getCurrentUser();
      const vip = Boolean(user && (isVipActive(user) || user.role === "admin" || user.role === "vip"));
      setIsVip(vip);
    };

    checkVip();
    window.addEventListener("filmfeed-user-change", checkVip);
    window.addEventListener("storage", checkVip);

    // Randomize / rotate smartlink for maximum CPM & diversity
    const idx = Math.floor(Math.random() * ADSTERRA_SMARTLINKS.length);
    setActiveLink(ADSTERRA_SMARTLINKS[idx]);

    return () => {
      window.removeEventListener("filmfeed-user-change", checkVip);
      window.removeEventListener("storage", checkVip);
    };
  }, []);

  // 100% Ad-Free for VIPs
  if (isVip) {
    return null;
  }

  // Position: Middle In-Feed Native Card
  if (position === "middle") {
    return (
      <div className={`w-full max-w-5xl mx-auto my-4 px-2 ${className}`}>
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-[#111116] via-[#1a140f] to-[#111116] p-4 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    {label}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Ultra Fast Line Active
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">
                  High-Speed 4K Cinema Cloud Mirror • Direct Download
                </h4>
                <p className="text-xs text-gray-400">
                  Zero buffering • Unlimited high-speed bandwidth • Multi-thread download
                </p>
              </div>
            </div>

            <a
              href={activeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 shrink-0"
            >
              <DownloadCloud className="h-4 w-4" />
              <span>Instant Download ⚡</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Default & Top / Bottom Banner
  return (
    <div className={`w-full max-w-5xl mx-auto my-3 px-2 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/90 p-3 sm:p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {label}
                </span>
                <span className="text-[10px] text-gray-400">High-Speed Cloud Mirror</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                Fast Direct Mirror • Unlimited 4K Bandwidth & Direct Stream
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={activeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Access Fast Server ⚡</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* High-CTR Sponsored Banner Container */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-center min-h-[50px] overflow-hidden">
          <a
            href={activeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs text-gray-300 font-medium group-hover:text-white transition-colors">
                High-Speed Cloud Mirror • 100MB/s Direct Line Active
              </span>
            </div>
            <span className="text-[11px] font-bold text-amber-400 group-hover:underline flex items-center gap-1">
              <span>Instant Mirror ⚡</span>
              <ExternalLink className="h-3 w-3" />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
