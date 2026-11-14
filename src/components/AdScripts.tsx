"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { getCurrentUser, isVipActive } from "@/lib/userState";

export function AdScripts() {
  const [isVip, setIsVip] = useState<boolean>(true); // default safe to avoid flash for VIPs

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

  // For VIP users: 100% Ad-Free experience
  if (isVip) {
    return null;
  }

  // For Normal (Free) users: Maximum Adsterra monetization
  return (
    <>
      {/* Adsterra Popunder Script */}
      <Script
        id="adsterra-popunder"
        src="https://capitalhospitals.org/1/bd31c4ee769fbf5ab0800093d030f4e3"
        strategy="afterInteractive"
        data-cfasync="false"
      />
      {/* Adsterra Social Bar / Push Notification Script */}
      <Script
        id="adsterra-socialbar"
        src="https://czernik.org/14/4028d6d8bf02d5ef0e46d0542be64755"
        strategy="afterInteractive"
        data-cfasync="false"
      />
    </>
  );
}
