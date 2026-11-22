"use client";

import React, { useState } from "react";
import { getVipBuyWhatsAppUrl, setVipActive } from "@/lib/vip";
import { getCurrentUser, VIP_PACKAGES } from "@/lib/userState";
import {
  Crown,
  X,
  Sparkles,
  Zap,
  Film,
  Tv,
  MessageSquare,
  ArrowRight,
  Inbox,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Check,
} from "lucide-react";

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVipActivated?: () => void;
  seriesTitle?: string;
}

export const VipShareModal: React.FC<VipModalProps> = ({
  isOpen,
  onClose,
  onVipActivated,
}) => {
  const [activationCode, setActivationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  if (!isOpen) return null;

  const user = getCurrentUser();
  const selectedPkg = VIP_PACKAGES[0];
  const buyUrl = getVipBuyWhatsAppUrl(user, selectedPkg);

  const handleBuyClick = () => {
    window.open(buyUrl, "_blank");
  };

  const handleCodeActivate = () => {
    const clean = activationCode.trim().toUpperCase();
    const VALID_CODES = ["VIP200", "VIP2026", "VIP", "IDRISVIP", "FILMFEEDVIP", "GOLD200", "PASS200", "200", "RS200"];
    if (VALID_CODES.includes(clean) || clean.startsWith("VIP")) {
      setVipActive(user?.phone || "94782088603", 30);
      setActivatedSuccess(true);
      if (onVipActivated) onVipActivated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setCodeError("Invalid code. Please enter valid VIP activation code or contact Admin.");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-black p-6 sm:p-7 shadow-2xl text-white overflow-hidden flex flex-col">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition z-20"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Badge */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-1.5 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30">
            <Crown className="h-7 w-7" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              <span>Official Membership</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
              FilmFeed VIP Monthly Pass
            </h2>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
              100% Ad-Free • Instant 1-Click WhatsApp Delivery
            </p>
          </div>
        </div>

        {/* Main Pricing Card */}
        <div className="relative z-10 my-5 rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-950/20 to-black p-5 shadow-xl text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-xs text-amber-300 uppercase tracking-widest font-black">All-Inclusive Pass</span>
          </div>
          <div className="mt-2 flex items-baseline justify-center gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-amber-300">Rs. 200</span>
            <span className="text-xs text-gray-400">/ 30 Days (1 Month)</span>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 space-y-2.5 text-left text-xs text-gray-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
              <span><b>100% Ad-Free:</b> No countdowns, no redirect pages</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Zap className="h-4 w-4 text-amber-400 shrink-0" />
              <span><b>Instant 1-Click:</b> Tap Request &amp; send immediately</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Inbox className="h-4 w-4 text-emerald-400 shrink-0" />
              <span><b>Private Inbox Delivery:</b> Direct to personal WhatsApp DM</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Tv className="h-4 w-4 text-indigo-400 shrink-0" />
              <span><b>Full TV Series &amp; Anime:</b> All seasons &amp; batches</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Film className="h-4 w-4 text-amber-400 shrink-0" />
              <span><b>30 Movies Daily:</b> 1080p FHD &amp; 4K Ultra HD</span>
            </div>
          </div>
        </div>

        {/* VIP Activation Code Section */}
        <div className="relative z-10 my-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
            <KeyRound className="h-3.5 w-3.5 text-amber-400" />
            <span>Have a VIP Activation Code?</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. VIP200"
              value={activationCode}
              onChange={(e) => {
                setActivationCode(e.target.value);
                setCodeError("");
              }}
              className="flex-1 bg-black/60 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 uppercase tracking-wider focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleCodeActivate}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition"
            >
              Activate
            </button>
          </div>
          {codeError && <p className="text-[11px] text-red-400">{codeError}</p>}
          {activatedSuccess && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <Check className="h-3.5 w-3.5" />
              <span>VIP Pass Activated Successfully! Enjoy 1-Click Delivery.</span>
            </div>
          )}
        </div>

        {/* Action Button & Payment Notice */}
        <div className="relative z-10 shrink-0 space-y-2">
          <button
            onClick={handleBuyClick}
            type="button"
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-3.5 px-4 text-sm font-black text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:brightness-105 active:scale-98 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Get VIP Pass (Rs. 200) on WhatsApp</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Bank Transfer / EzCash / Reload accepted • Instant Activation</span>
          </div>
        </div>
      </div>
    </div>
  );
};