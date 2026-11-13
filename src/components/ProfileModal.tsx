"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Crown,
  Smartphone,
  Copy,
  Check,
  Clock,
  Film,
  Tv,
  Sparkles,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  UserProfile,
  getCurrentUser,
  setCurrentUser,
  getDailyUsage,
  getUserRequestHistory,
  UserRequestHistoryItem,
  VIP_PACKAGES,
  isVipActive,
} from "@/lib/userState";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVipModal?: () => void;
  onSignOut?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenVipModal,
  onSignOut,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [copiedDevice, setCopiedDevice] = useState(false);
  const [requests, setRequests] = useState<UserRequestHistoryItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [usage, setUsage] = useState(getDailyUsage());

  const loadData = () => {
    const current = getCurrentUser();
    setUser(current);
    setUsage(getDailyUsage());

    // 1. Get from local storage
    const local = getUserRequestHistory();
    setRequests(local);

    // 2. Fetch from server to supplement
    if (current?.id || current?.phone || current?.name) {
      setLoadingRequests(true);
      const params = new URLSearchParams();
      if (current.id) params.set("userId", current.id);
      if (current.phone) params.set("userPhone", current.phone);
      if (current.name) params.set("userName", current.name);

      fetch(`/api/user/requests?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.requests)) {
            // Merge deduplicated
            const map = new Map<string, UserRequestHistoryItem>();
            for (const r of data.requests) {
              map.set(r.token || r.id, {
                id: r.id,
                title: r.title,
                poster: r.poster,
                type: r.type || "movie",
                season: r.season,
                quality: r.quality || "720p",
                token: r.token,
                timestamp: r.timestamp || new Date().toISOString(),
                status: r.status || "pending",
              });
            }
            for (const r of local) {
              if (!map.has(r.token || r.id)) {
                map.set(r.token || r.id, r);
              }
            }
            setRequests(Array.from(map.values()));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingRequests(false));
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isVip = isVipActive(user);
  const userPkg = VIP_PACKAGES.find((p) => p.id === user?.vipPackage);

  // Expiry calculation
  let expiryCountdown = "";
  let isExpired = false;
  if (user?.vipExpiresAt) {
    const diff = new Date(user.vipExpiresAt).getTime() - Date.now();
    if (diff <= 0) {
      isExpired = true;
      expiryCountdown = "Expired";
    } else {
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (days > 0) {
        expiryCountdown = `${days} Days, ${hours} Hours Remaining`;
      } else if (hours > 0) {
        expiryCountdown = `${hours} Hours, ${mins} Mins Remaining`;
      } else {
        expiryCountdown = `${mins} Minutes Remaining`;
      }
    }
  }

  const copyDeviceId = () => {
    if (!user?.deviceId) return;
    navigator.clipboard.writeText(user.deviceId);
    setCopiedDevice(true);
    setTimeout(() => setCopiedDevice(false), 2000);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    if (onSignOut) onSignOut();
    onClose();
    window.location.reload();
  };

  // Limits
  const movieLimit = isVip ? 20 : 2;
  const seriesLimit = isVip ? 5 : 0;
  const animeLimit = isVip ? 5 : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0B0D14] p-5 sm:p-7 text-white shadow-2xl space-y-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Profile Header */}
          <div className="flex items-center gap-4 pt-2">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-16 w-16 rounded-full border-2 border-amber-400/40 object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 text-white font-black text-2xl border-2 border-white/20 shadow-lg">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white truncate">
                  {user?.name || "FilmFeed User"}
                </h2>
                {isVip && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-2 py-0.5 text-[10px] font-black text-black shadow-sm">
                    <Crown className="w-3 h-3 fill-black" />
                    <span>VIP</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-mono truncate">{user?.email || "Signed In Account"}</p>
              {user?.phone && (
                <p className="text-[11px] text-emerald-400 font-mono mt-0.5">WA: {user.phone}</p>
              )}
            </div>
          </div>

          {/* Device ID Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Device ID</div>
                <div className="text-xs font-mono text-gray-200 truncate">{user?.deviceId || "dev_unbound"}</div>
              </div>
            </div>
            <button
              onClick={copyDeviceId}
              className="flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/20 transition-all shrink-0"
              title="Copy Device ID"
            >
              {copiedDevice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDevice ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* VIP Status Card */}
          {isVip ? (
            <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-[#131118] to-[#0A0910] p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                    <Crown className="w-3 h-3 fill-amber-400" />
                    <span>Active VIP Premiere</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-amber-300">
                    {userPkg ? userPkg.name : "VIP Premiere Member"}
                  </h3>
                  <p className="text-xs text-gray-300">
                    {userPkg ? userPkg.description : "High-speed 4K master dispatches & priority queue"}
                  </p>
                </div>

                {userPkg && (
                  <span className="text-sm font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl px-2.5 py-1 shrink-0">
                    {userPkg.label}
                  </span>
                )}
              </div>

              {expiryCountdown && (
                <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>VIP Expiry:</span>
                  </span>
                  <span className={`font-mono font-bold ${isExpired ? "text-red-400" : "text-amber-300"}`}>
                    {expiryCountdown}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-400">Current Plan</div>
                  <div className="text-base font-black text-white">Free Tier Account</div>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-gray-300">
                  Standard Access
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                You can request up to 2 movies (720p/480p) every 24 hours. TV series & Anime batches require a VIP pass.
              </p>
              {onOpenVipModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenVipModal();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 py-3 text-xs font-black text-black hover:brightness-110 active:scale-[0.99] transition shadow-lg shadow-amber-500/20"
                >
                  <Crown className="w-4 h-4 fill-black" />
                  <span>Upgrade to VIP Premiere (From Rs. 50)</span>
                </button>
              )}
            </div>
          )}

          {/* Daily Quotas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Today's Daily Quotas</h4>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Movies */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <Film className="w-4 h-4 mx-auto text-indigo-400 mb-1" />
                <div className="text-[10px] text-gray-400 font-bold">Movies</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {usage.moviesRequested} / {movieLimit}
                </div>
              </div>

              {/* TV Series */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <Tv className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <div className="text-[10px] text-gray-400 font-bold">TV Series</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {usage.seriesRequested} / {seriesLimit}
                </div>
              </div>

              {/* Anime */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <Sparkles className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                <div className="text-[10px] text-gray-400 font-bold">Anime</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {usage.animeRequested} / {animeLimit}
                </div>
              </div>
            </div>
          </div>

          {/* Request History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Your Request History ({requests.length})
              </h4>
              <button
                onClick={loadData}
                className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition"
                title="Refresh requests"
              >
                <RefreshCw className={`w-3 h-3 ${loadingRequests ? "animate-spin" : ""}`} />
                <span>Sync</span>
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-gray-500">
                <Film className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p>No movie or series requests recorded yet.</p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Explore our catalog and click Request to send films directly to the WhatsApp Bot!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {requests.slice(0, 15).map((req, idx) => (
                  <div
                    key={req.id || idx}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white truncate">{req.title}</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span className="capitalize text-indigo-400 font-semibold">
                          {req.type === "series" ? `Series S${req.season || 1}` : req.type}
                        </span>
                        <span>•</span>
                        <span>{req.quality}</span>
                        <span>•</span>
                        <span className="text-gray-500">#{req.token}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold shrink-0">
                      Dispatched
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
