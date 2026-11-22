"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, isVipActive } from "@/lib/userState";
import { getVipStatus } from "@/lib/vip";

export function AdScripts() {
  const [isVip, setIsVip] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const u = getCurrentUser();
    return Boolean((u && (isVipActive(u) || u.role === "admin" || u.role === "vip")) || getVipStatus());
  });

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
      return;
    }

    // 1. Inject Live Monetag MultiTag (In-Page Push / Vignette / Interstitial) into DOM
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

    // 4. SmartLink Popunder Trigger on non-navigation clicks
    let lastPopTime = 0;
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a[href*='wa.me']") || target.closest("button[data-no-ad='true']")) {
        return;
      }

      const now = Date.now();
      const COOLDOWN_MS = 60000;
      if (now - lastPopTime > COOLDOWN_MS) {
        lastPopTime = now;
        try {
          const directLink = "https://apiguinee.org/4/f4abcfe9fc0ee1440879c20c9cdee0fe";
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
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [isVip]);

  return null;
}
