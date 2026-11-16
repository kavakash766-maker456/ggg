"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, isVipActive } from "@/lib/userState";
import { ShieldAlert, Crown, RefreshCw, X } from "lucide-react";
import Link from "next/link";

export const AntiAdblock: React.FC = () => {
  const [adblockDetected, setAdblockDetected] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(true);
  const [isVip, setIsVip] = useState<boolean>(true);

  useEffect(() => {
    // Check if dismissed in this session
    if (typeof window !== "undefined" && sessionStorage.getItem("filmfeed_adblock_dismissed")) {
      setDismissed(true);
      return;
    } else {
      setDismissed(false);
    }

    const user = getCurrentUser();
    const vip = Boolean(user && (isVipActive(user) || user.role === "admin" || user.role === "vip"));
    setIsVip(vip);

    if (vip) return; // VIPs are never flagged for adblock

    // Accurate DOM bait element check with zero false positives on mobile Chrome
    const checkBait = () => {
      const bait = document.createElement("div");
      bait.className = "adsbox ad-placement pub_300x250 text-ad";
      bait.style.cssText = "position:fixed;bottom:-100px;left:0;width:10px;height:10px;pointer-events:none;z-index:-1;";
      document.body.appendChild(bait);

      setTimeout(() => {
        try {
          const style = window.getComputedStyle(bait);
          const isHidden =
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0" ||
            bait.clientHeight === 0;

          bait.remove();
          if (isHidden && !sessionStorage.getItem("filmfeed_adblock_dismissed")) {
            setAdblockDetected(true);
          }
        } catch {
          bait.remove();
        }
      }, 1000);
    };

    const timer = setTimeout(checkBait, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("filmfeed_adblock_dismissed", "true");
    setDismissed(true);
  };

  if (isVip || dismissed || !adblockDetected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto bg-[#131622]/95 border border-rose-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 text-white">
      <div className="flex items-start gap-3 relative">
        <button
          onClick={handleDismiss}
          className="absolute -top-1 -right-1 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss notice"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="h-9 w-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
          <ShieldAlert className="h-5 w-5 text-rose-400" />
        </div>
        <div className="flex-1 pr-6">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>AdBlocker Notice</span>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">Optional</span>
          </h4>
          <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
            FilmFeed runs on advertising to keep free 4K streaming available. Please support us or get a VIP Pass for 100% Ad-Free luxury streaming.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Dismiss</span>
            </button>
            <Link
              href="/verify"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Crown className="h-3 w-3" />
              <span>Get VIP (No Ads)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
