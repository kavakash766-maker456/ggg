"use client";

import React, { useState } from "react";
import { getVipBuyWhatsAppUrl, ADMIN_BUY_PHONE } from "@/lib/vip";
import { getCurrentUser, VIP_PACKAGES, VipPackage } from "@/lib/userState";
import {
  Crown,
  CheckCircle,
  X,
  ShieldCheck,
  Sparkles,
  Zap,
  Film,
  Tv,
  MessageSquare,
  ArrowRight,
  Check,
  Inbox,
  Flame,
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
}) => {
  const [activeTab, setActiveTab] = useState<"monthly" | "longterm">("monthly");
  const [selectedPkgId, setSelectedPkgId] = useState<string>("gold_300");

  if (!isOpen) return null;

  const user = getCurrentUser();
  const selectedPkg = VIP_PACKAGES.find((p) => p.id === selectedPkgId) || VIP_PACKAGES[0];
  const buyUrl = getVipBuyWhatsAppUrl(user, selectedPkg);

  const monthlyPackages = VIP_PACKAGES.filter((p) => p.days === 30);
  const longTermPackages = VIP_PACKAGES.filter((p) => p.days > 30);
  const currentList = activeTab === "monthly" ? monthlyPackages : longTermPackages;

  const handleBuyClick = () => {
    window.open(buyUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#18151f] via-[#100e18] to-[#0a0910] p-5 sm:p-7 shadow-2xl text-white overflow-hidden max-h-[94vh] flex flex-col">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-lg shadow-amber-500/30">
            <Crown className="h-6 w-6" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              <span>Official Membership</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              FilmFeed VIP Premiere
            </h2>
            <p className="text-[11px] sm:text-xs text-gray-400 max-w-sm mx-auto">
              Choose your quota-based VIP pass for full TV series, anime batches, and priority WhatsApp dispatch.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-white/[0.04] p-1 border border-white/10 mt-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("monthly");
                if (longTermPackages.some((p) => p.id === selectedPkgId)) {
                  setSelectedPkgId("gold_300");
                }
              }}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                activeTab === "monthly"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly Passes (Rs. 50 - 500)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("longterm");
                setSelectedPkgId("unlimited_3months");
              }}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition flex items-center gap-1 ${
                activeTab === "longterm"
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Flame className="h-3 w-3 text-red-500" />
              <span>Long-Term Unlimited</span>
            </button>
          </div>
        </div>

        {/* Scrollable Package List */}
        <div className="relative z-10 my-3 overflow-y-auto pr-1 space-y-2 flex-1 max-h-[38vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentList.map((pkg) => {
              const isSelected = selectedPkgId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`relative cursor-pointer rounded-2xl border p-3 transition-all ${
                    isSelected
                      ? "border-amber-400 bg-amber-500/15 shadow-[0_0_15px_rgba(251,191,36,0.2)] scale-[1.01]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-2 right-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[9px] font-black uppercase text-black shadow">
                      {pkg.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{pkg.name}</span>
                    {isSelected && (
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-black">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-black text-amber-300">Rs. {pkg.price}</span>
                    <span className="text-[10px] text-gray-400">/ {pkg.days}d</span>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1 line-clamp-2">
                    {pkg.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Package Benefits Summary */}
        <div className="relative z-10 shrink-0 space-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-xs mb-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px]">
            <span className="text-gray-400">Selected Plan:</span>
            <span className="font-bold text-amber-300">{selectedPkg.name} • Rs. {selectedPkg.price}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-200">
            <div className="flex items-center gap-2">
              <Film className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span><b>{selectedPkg.dailyMovies >= 9999 ? "UNLIMITED" : selectedPkg.dailyMovies}</b> Movies / Day</span>
            </div>
            <div className="flex items-center gap-2">
              <Tv className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span><b>{selectedPkg.monthlySeries >= 9999 ? "UNLIMITED" : selectedPkg.monthlySeries}</b> TV Series</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-pink-400 shrink-0" />
              <span><b>{selectedPkg.monthlyAnime >= 9999 ? "UNLIMITED" : selectedPkg.monthlyAnime}</b> Anime Seasons</span>
            </div>
            <div className="flex items-center gap-2">
              <Inbox className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>{selectedPkg.inboxDelivery ? "Inbox Delivery 📥" : "Group Delivery 👥"}</span>
            </div>
          </div>
        </div>

        {/* Action Button & Payment Notice */}
        <div className="relative z-10 shrink-0 space-y-2">
          <button
            onClick={handleBuyClick}
            type="button"
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-3.5 px-4 text-xs sm:text-sm font-black text-black shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:brightness-105 active:scale-98 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Order {selectedPkg.name} (Rs. {selectedPkg.price}) on WhatsApp</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
            <span>Admin: 078 773 2040</span>
            <button
              onClick={onClose}
              type="button"
              className="hover:text-gray-200 transition"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VipBuyModal = VipShareModal;
