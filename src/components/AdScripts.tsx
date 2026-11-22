"use client";

import React, { useEffect, useState } from "react";
import { getCurrentUser, isVipActive } from "@/lib/userState";
import { getVipStatus } from "@/lib/vip";
import { Sparkles, X, Zap, ExternalLink } from "lucide-react";

const ADSTERRA_SMARTLINKS = [
  "https://directyp.org/4/19e3d997accef9e4c330f1be1284d8be",
  "https://auctionr.org/4/14476ca5217e71596abcbc486c9ef407",
  "https://asiafilm.org/4/739684d4bbb6e73705d5d7764d0734ca",
  "https://ardance.org/4/85b763851dffe3ea28b84d2372c667e8",
];

function getRandomSmartlink(): string {
  const idx = Math.floor(Math.random() * ADSTERRA_SMARTLINKS.length);
  return ADSTERRA_SMARTLINKS[idx];
}

export function AdScripts() {
  const [isVip, setIsVip] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const u = getCurrentUser();
    return Boolean((u && (isVipActive(u) || u.role === "admin" || u.role === "vip")) || getVipStatus());
  });

  const [showSocialBar, setShowSocialBar] = useState<boolean>(false);
  const [socialBarLink, setSocialBarLink] = useState<string>(ADSTERRA_SMARTLINKS[0]);

  useEffect(() => {
    const checkVip = () => {
      const user = getCurrentUser();
      const vip = Boolean((user && (isVipActive(user) || user.role === "admin" || user.role === "vip")) || getVipStatus());
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

  useEffect(() => {
    if (isVip) {
      // Remove any injected ad scripts if user becomes VIP
      const oldMonetag = document.getElementById("monetag-multitag");
      const oldPopunder = document.getElementById("adsterra-popunder-tag");
      const oldSocial = document.getElementById("adsterra-socialbar-tag");
      if (oldMonetag) oldMonetag.remove();
      if (oldPopunder) oldPopunder.remove();
      if (oldSocial) oldSocial.remove();
      setShowSocialBar(false);
      return;
    }

    // 1. Inject Live Monetag MultiTag into DOM
    if (!document.getElementById("monetag-multitag")) {
      const s = document.createElement("script");
      s.id = "monetag-multitag";
      s.src = "https://alwingulla.com/88/tag.min.js";
      s.setAttribute("data-zone", "9857973");
      s.async = true;
      s.setAttribute("data-cfasync", "false");
      document.head.appendChild(s);
    }

    // 2. Inject Adsterra Popunder Script
    if (!document.getElementById("adsterra-popunder-tag")) {
      const s1 = document.createElement("script");
      s1.id = "adsterra-popunder-tag";
      s1.src = "https://capitalhospitals.org/1/bd31c4ee769fbf5ab0800093d030f4e3";
      s1.async = true;
      s1.setAttribute("data-cfasync", "false");
      document.head.appendChild(s1);
    }

    // 3. Inject Adsterra Social Bar Script
    if (!document.getElementById("adsterra-socialbar-tag")) {
      const s2 = document.createElement("script");
      s2.id = "adsterra-socialbar-tag";
      s2.src = "https://czernik.org/14/4028d6d8bf02d5ef0e46d0542be64755";
      s2.async = true;
      s2.setAttribute("data-cfasync", "false");
      document.head.appendChild(s2);
    }

    // 4. Timer to show interactive Social Bar notification card (high CTR)
    const socialTimer = setTimeout(() => {
      setSocialBarLink(getRandomSmartlink());
      setShowSocialBar(true);
    }, 4500);

    // 5. SmartLink Popunder Trigger on non-navigation clicks
    let lastPopTime = 0;
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("a[href*='wa.me']") ||
        target.closest("a[href*='whatsapp']") ||
        target.closest("button[data-no-ad='true']") ||
        target.closest("[data-social-bar='true']")
      ) {
        return;
      }

      const now = Date.now();
      const COOLDOWN_MS = 45000; // 45 seconds cooldown between popunders
      if (now - lastPopTime > COOLDOWN_MS) {
        lastPopTime = now;
        try {
          const directLink = getRandomSmartlink();
          const pop = window.open(directLink, "_blank");
          if (pop) {
            pop.blur();
            window.focus();
          }
        } catch (_) {}
      }
    };

    document.addEventListener("click", handleDocumentClick, { passive: true });
    return () => {
      clearTimeout(socialTimer);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [isVip]);

  if (isVip) {
    return null;
  }

  // Interactive Adsterra Social Bar / In-Page Push Floating Card
  return (
    <>
      {showSocialBar && (
        <div
          data-social-bar="true"
          className="fixed bottom-20 right-4 z-[9999] max-w-sm w-[calc(100vw-2rem)] sm:w-80 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="relative rounded-2xl border border-amber-500/50 bg-[#121216]/95 p-3.5 shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setShowSocialBar(false)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>

            <a
              href={socialBarLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowSocialBar(false)}
              className="flex items-start gap-3 group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <Zap className="h-5 w-5 text-black" />
              </div>
              <div className="flex-1 pr-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Direct 4K Line
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors mt-0.5">
                  High-Speed Cloud Mirror Ready!
                </h5>
                <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                  Tap here to access 100MB/s instant mirror line with zero buffering.
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:underline">
                  <span>Open Fast Server</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
