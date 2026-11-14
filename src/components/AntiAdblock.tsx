"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, isVipActive } from "@/lib/userState";
import { ShieldAlert, Crown, RefreshCw } from "lucide-react";
import Link from "next/link";

export const AntiAdblock: React.FC = () => {
  const [adblockDetected, setAdblockDetected] = useState<boolean>(false);
  const [isVip, setIsVip] = useState<boolean>(true);

  useEffect(() => {
    const user = getCurrentUser();
    const vip = Boolean(user && (isVipActive(user) || user.role === "admin" || user.role === "vip"));
    setIsVip(vip);

    if (vip) return; // VIPs are never flagged for adblock

    // Test ad network domain accessibility
    const testAdblock = async () => {
      try {
        const res = await fetch("https://czernik.org/21/dbc73422ecb8c31a10672cc9ba7eae8a", {
          method: "HEAD",
          mode: "no-cors",
        });
      } catch (err) {
        // Failed network fetch indicates AdBlock extension interference
        setAdblockDetected(true);
      }
    };

    const timer = setTimeout(testAdblock, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isVip || !adblockDetected) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto bg-[#131622]/95 border border-rose-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
          <ShieldAlert className="h-5 w-5 text-rose-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>AdBlocker Detected</span>
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono">Notice</span>
          </h4>
          <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
            FilmFeed runs on advertising to keep free 4K streaming available. Please disable AdBlock or get a VIP Pass for 100% Ad-Free luxury streaming.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="h-3 w-3" />
              <span>I Disabled It</span>
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
