"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, isVipActive } from "@/lib/userState";

export function AdScripts() {
  const [isVip, setIsVip] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const u = getCurrentUser();
    return Boolean(u && (isVipActive(u) || u.role === "admin" || u.role === "vip"));
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

  useEffect(() => {
    if (isVip) {
      // Remove any injected adsterra scripts if user becomes VIP
      const oldPopunder = document.getElementById("adsterra-popunder-tag");
      const oldSocial = document.getElementById("adsterra-socialbar-tag");
      if (oldPopunder) oldPopunder.remove();
      if (oldSocial) oldSocial.remove();
      return;
    }

    // 1. Inject Adsterra Popunder Script directly into DOM
    if (!document.getElementById("adsterra-popunder-tag")) {
      const s1 = document.createElement("script");
      s1.id = "adsterra-popunder-tag";
      s1.src = "https://capitalhospitals.org/1/bd31c4ee769fbf5ab0800093d030f4e3";
      s1.async = true;
      s1.setAttribute("data-cfasync", "false");
      document.body.appendChild(s1);
    }

    // 2. Inject Adsterra Social Bar Script directly into DOM
    if (!document.getElementById("adsterra-socialbar-tag")) {
      const s2 = document.createElement("script");
      s2.id = "adsterra-socialbar-tag";
      s2.src = "https://czernik.org/14/4028d6d8bf02d5ef0e46d0542be64755";
      s2.async = true;
      s2.setAttribute("data-cfasync", "false");
      document.body.appendChild(s2);
    }
  }, [isVip]);

  return null;
}
