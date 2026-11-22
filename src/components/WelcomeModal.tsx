"use client";

import React, { useState, useEffect } from "react";
import { getCurrentUser, getDeviceId, setCurrentUser, UserProfile } from "@/lib/userState";
import { Check, X, Sparkles, ShieldCheck, Zap, Coins, Mail, Smartphone, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";

export const WelcomeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && pathname.startsWith("/admin")) {
      return;
    }

    const user = getCurrentUser();
    const dismissed = sessionStorage.getItem("filmfeed_welcome_seen");

    if (!user && !dismissed) {
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (pathname && pathname.startsWith("/admin")) return null;
  if (getCurrentUser()) return null;
  if (!isOpen) return null;

  const handleContinueAsGuest = () => {
    sessionStorage.setItem("filmfeed_welcome_seen", "true");
    setIsOpen(false);
  };

  const handleInstantSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = emailOrPhone.trim();
    if (!val) {
      setErrorMsg("Please enter your email or phone number.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const isEmail = val.includes("@");
      const cleanEmail = isEmail ? val.toLowerCase() : `${val.replace(/\D/g, "")}@filmfeed.lk`;
      const cleanName = isEmail ? val.split("@")[0] : `User_${val.slice(-4)}`;
      const deviceId = getDeviceId();

      const syncRes = await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: !isEmail ? val : "",
          deviceId,
        }),
      });

      const syncData = await syncRes.json();
      const userProfile: UserProfile = syncData.user || {
        id: "usr_" + Math.random().toString(36).substring(2, 10),
        name: cleanName,
        email: cleanEmail,
        phone: !isEmail ? val : "",
        role: "user" as const,
        deviceId,
        coins: 50,
        isVip: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      setCurrentUser(userProfile);
      sessionStorage.setItem("filmfeed_welcome_seen", "true");
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent("filmfeed-user-change"));
    } catch (err: any) {
      setErrorMsg(err.message || "Sign in failed. Continuing as guest...");
      setTimeout(() => {
        handleContinueAsGuest();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn text-white">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-black p-6 sm:p-7 shadow-2xl max-h-[95vh] overflow-y-auto">
        <button
          onClick={handleContinueAsGuest}
          className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-wider text-gray-300 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>Welcome to FilmFeed 4K</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Choose Your Access Level
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Free membership gives you daily movie quotas + TV series access.
          </p>
        </div>

        {/* Access Cards */}
        <div className="space-y-4">
          {/* Option A: Guest Access */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-all">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-gray-300">GUEST ACCESS</h3>
              <span className="text-[10px] rounded-md bg-white/10 px-2 py-0.5 font-bold text-gray-400 uppercase">
                Trial
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-400 mb-4">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>1 Free Movie Request</span>
              </li>
              <li className="flex items-center gap-2 text-gray-500">
                <X className="h-3.5 w-3.5 shrink-0" />
                <span>No TV Series Access</span>
              </li>
              <li className="flex items-center gap-2 text-gray-500">
                <X className="h-3.5 w-3.5 shrink-0" />
                <span>Standard Queue</span>
              </li>
            </ul>
            <button
              onClick={handleContinueAsGuest}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors"
            >
              Continue as Guest
            </button>
          </div>

          {/* Option B: Free Account (Email / WhatsApp Instant Sign In) */}
          <div className="relative rounded-2xl border-2 border-white bg-gradient-to-b from-white/10 to-transparent p-5 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-black">
              Recommended
            </div>

            <div className="flex items-center justify-between mb-3 mt-1">
              <h3 className="font-bold text-sm text-white">FREE MEMBER ACCOUNT</h3>
              <span className="text-[10px] rounded-md bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-400">
                100% FREE
              </span>
            </div>

            <ul className="space-y-2 text-xs text-gray-200 mb-4">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span><b>6 Movies / Day</b> Free</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span><b>1 TV Series Season / Day</b></span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Priority Ultra-Fast Queue</span>
              </li>
              <li className="flex items-center gap-2 text-amber-300 font-bold">
                <Coins className="h-4 w-4 text-amber-400 shrink-0" />
                <span>+50 Free Coins Bonus</span>
              </li>
            </ul>

            <form onSubmit={handleInstantSignIn} className="space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="Enter Google Email or WhatsApp Number"
                  className="w-full rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                />
              </div>

              {errorMsg && (
                <p className="text-[11px] text-rose-400 text-center">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-black text-black hover:bg-gray-200 transition-all active:scale-98 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>SIGN IN INSTANTLY</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>1 Device = 1 Account • Auto WhatsApp mention when downloaded</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
