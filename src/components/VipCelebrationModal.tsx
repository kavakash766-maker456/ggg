"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, CheckCircle2, Film, Tv, Zap, X } from "lucide-react";
import { VIP_PACKAGES, UserProfile } from "@/lib/userState";

interface VipCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | null;
}

export const VipCelebrationModal: React.FC<VipCelebrationModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen) return null;

  const pkg = VIP_PACKAGES.find((p) => p.id === user?.vipPackage);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative w-full max-w-md rounded-3xl border border-amber-500/50 bg-gradient-to-b from-[#1C1726] via-[#100D18] to-[#0A0812] p-6 sm:p-8 text-center text-white shadow-2xl shadow-amber-500/20 space-y-6 overflow-hidden"
        >
          {/* Top Decorative Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Close celebration popup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Golden Crown Icon with Pulsing Halo */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 opacity-25 blur-lg"
            />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-black shadow-xl shadow-amber-500/30">
              <Crown className="w-10 h-10 fill-black stroke-black" />
            </div>
          </div>

          {/* Title & Badge */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-300 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>VIP PREMIERE ACTIVATED</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome to VIP!
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 max-w-sm mx-auto leading-relaxed">
              Your account has been promoted to <b className="text-amber-400 font-bold">{pkg ? pkg.name : "VIP Premiere"}</b>! You now have full priority speed and exclusive perks.
            </p>
          </div>

          {/* Feature List */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Film className="w-4 h-4" />
              </div>
              <div className="text-gray-200">
                <b className="text-white font-bold">20 Daily 4K Movies:</b> Ultra HD downloads without daily wait limits.
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                <Tv className="w-4 h-4" />
              </div>
              <div className="text-gray-200">
                <b className="text-white font-bold">5 TV & Anime Packs Daily:</b> Full batch season downloads.
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-gray-200">
                <b className="text-white font-bold">1-Click Bot Dispatch:</b> Skip all ad countdowns & captcha checks.
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 py-3.5 text-sm font-black text-black hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-amber-500/30"
          >
            Start Enjoying VIP Cinema! 🍿
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
