"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, isVipActive } from "@/lib/userState";
import { Sparkles } from "lucide-react";

interface AdBannerProps {
  className?: string;
  position?: "top" | "middle" | "bottom" | "sidebar";
  label?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ className = "", label = "Sponsored Partner" }) => {
  const [isVip, setIsVip] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const user = getCurrentUser();
    return Boolean(user && (isVipActive(user) || user.role === "admin" || user.role === "vip"));
  });

  useEffect(() => {
    const checkVip = () => {
      const user = getCurrentUser();
      const vip = Boolean(user && (isVipActive(user) || user.role === "admin" || user.role === "vip"));
      setIsVip(vip);
    };

    checkVip();
    window.addEventListener("filmfeed-user-change", checkVip);
    window.addEventListener("storage", checkVip);
    return () => {
      window.removeEventListener("filmfeed-user-change", checkVip);
      window.removeEventListener("storage", checkVip);
    };
  }, []);

  // VIP users get NO ads
  if (isVip) {
    return null;
  }

  // Normal Free users get Adsterra banners & high-CTR smartlink
  return (
    <div className={`w-full max-w-5xl mx-auto my-4 px-2 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-black to-amber-950/30 p-3 sm:p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
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
                Fast Direct Mirror • Unlimited 4K Bandwidth
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="https://apiguinee.org/4/f4abcfe9fc0ee1440879c20c9cdee0fe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              Access Fast Server ⚡
            </a>
          </div>
        </div>

        {/* High-CTR Sponsored Banner Container */}
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-center min-h-[60px] overflow-hidden">
          <a
            href="https://apiguinee.org/4/f4abcfe9fc0ee1440879c20c9cdee0fe"
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
            <span className="text-[11px] font-bold text-amber-400 group-hover:underline">
              Instant Mirror ⚡
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
