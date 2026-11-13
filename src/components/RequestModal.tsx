"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MovieDetail, SeriesEpisode } from "@/lib/cinesubz";
import { getVipStatus } from "@/lib/vip";
import {
  getCurrentUser,
  getDailyUsage,
  incrementUsage,
  checkRequestLimit,
  UserProfile,
  addUserRequestHistory,
  isVipActive,
} from "@/lib/userState";
import { VipShareModal } from "@/components/VipShareModal";
import { AuthModal } from "@/components/AuthModal";
import {
  Sparkles,
  X,
  Tv,
  Film,
  Crown,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertTriangle,
  LogIn,
  Inbox,
  Users,
  Layers,
} from "lucide-react";

interface RequestModalProps {
  movie: MovieDetail;
  isOpen: boolean;
  onClose: () => void;
  botPhone?: string;
  initialQuality?: string;
  initialSeason?: number;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  movie,
  isOpen,
  onClose,
  botPhone,
  initialQuality = "720p",
  initialSeason,
}) => {
  const router = useRouter();
  const isAnime = Boolean(
    (movie as any).id?.toString().startsWith("anime-") ||
    movie.url?.includes("anime") ||
    movie.url?.includes("animegg") ||
    (movie as any).category === "anime-series" ||
    (movie as any).category === "anime-movie" ||
    (movie as any).genres?.some((g: string) => /anime|animation/i.test(g))
  );
  const isSeries = movie.kind === "series" || (movie.episodes && movie.episodes.length > 0) || isAnime;
  const targetBotPhone = botPhone || "94782088603";

  // Group episodes by season
  const seasonsMap: { [key: number]: SeriesEpisode[] } = {};
  if (isSeries && movie.episodes) {
    movie.episodes.forEach((ep) => {
      if (!seasonsMap[ep.season]) seasonsMap[ep.season] = [];
      seasonsMap[ep.season].push(ep);
    });
  }
  const availableSeasons = Object.keys(seasonsMap).map(Number).sort((a, b) => a - b);
  const defaultSeason = initialSeason || (availableSeasons.length > 0 ? availableSeasons[0] : 1);

  const [selectedSeason, setSelectedSeason] = useState<number>(defaultSeason);
  const [selectedQuality, setSelectedQuality] = useState<string>(initialQuality);
  const [requestToken, setRequestToken] = useState("");
  const [currentUser, setProfile] = useState<UserProfile | null>(null);

  // Episode Bundles & Selection (Max 20 episodes per batch)
  const seasonEps = seasonsMap[selectedSeason] || [];
  const reportedEps = (movie as any).episodesCount || (movie as any).totalEpisodes || (movie as any).episodes?.length;
  const totalEpsInSeason = seasonEps.length > 0
    ? seasonEps.length
    : reportedEps || (isAnime ? 100 : 24);

  const BUNDLE_SIZE = 20;
  const bundles: { id: string; label: string; start: number; end: number }[] = [];
  if (totalEpsInSeason <= BUNDLE_SIZE) {
    bundles.push({
      id: `1-${totalEpsInSeason}`,
      label: `Episodes 1 - ${totalEpsInSeason} (All ${totalEpsInSeason} eps)`,
      start: 1,
      end: totalEpsInSeason,
    });
  } else {
    for (let i = 1; i <= totalEpsInSeason; i += BUNDLE_SIZE) {
      const end = Math.min(i + BUNDLE_SIZE - 1, totalEpsInSeason);
      const bIndex = Math.floor((i - 1) / BUNDLE_SIZE) + 1;
      bundles.push({
        id: `${i}-${end}`,
        label: `Episodes ${i} - ${end} (Bundle ${bIndex})`,
        start: i,
        end,
      });
    }
  }

  const [selectedBundleId, setSelectedBundleId] = useState<string>("1-20");
  const [startEpisode, setStartEpisode] = useState<number>(1);
  const [endEpisode, setEndEpisode] = useState<number>(20);
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);

  // Individual Episode Selection (Discrete selection: e.g. Ep 1, 2, 5, 8)
  const [selectionMode, setSelectionMode] = useState<"individual" | "batch">("individual");
  const [selectedEpisodes, setSelectedEpisodes] = useState<number[]>([1]);
  const [customInputText, setCustomInputText] = useState<string>("1");
  const [episodePage, setEpisodePage] = useState<number>(0);
  const PAGE_SIZE = 24;

  // Modals & Gate States
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const isUserVip = Boolean(
    currentUser && (isVipActive(currentUser) || currentUser.role === "admin" || getVipStatus())
  );
  const requestType: "movie" | "series" | "anime" = isAnime ? "anime" : isSeries ? "series" : "movie";

  useEffect(() => {
    const user = getCurrentUser();
    setProfile(user);
    setAuthRequired(!user);

    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRequestToken(token);
    if (initialSeason) setSelectedSeason(initialSeason);
    else if (availableSeasons.length > 0) setSelectedSeason(availableSeasons[0]);
    if (initialQuality) setSelectedQuality(initialQuality);
  }, [isOpen, movie, initialQuality, initialSeason]);

  // Update bundle selection when season or available episodes change
  useEffect(() => {
    if (bundles.length > 0) {
      const first = bundles[0];
      setSelectedBundleId(first.id);
      setStartEpisode(first.start);
      setEndEpisode(first.end);
      setIsCustomRange(false);
    }
    // Default to first episode on season change if empty
    if (selectedEpisodes.length === 0) {
      setSelectedEpisodes([1]);
      setCustomInputText("1");
    }
  }, [selectedSeason, totalEpsInSeason]);

  const toggleEpisode = (epNum: number) => {
    setSelectedEpisodes((prev) => {
      let updated: number[];
      if (prev.includes(epNum)) {
        updated = prev.filter((x) => x !== epNum);
      } else {
        if (prev.length >= 20) {
          alert("Maximum 20 episodes can be requested per batch to guarantee rapid delivery.");
          return prev;
        }
        updated = [...prev, epNum].sort((a, b) => a - b);
      }
      setCustomInputText(updated.join(", "));
      return updated;
    });
  };

  const handleCustomTextChange = (text: string) => {
    setCustomInputText(text);
    const parsed: number[] = [];
    const parts = text.split(/[, ]+/).filter(Boolean);
    for (const p of parts) {
      if (p.includes("-")) {
        const [s, e] = p.split("-").map((x) => parseInt(x, 10));
        if (!isNaN(s) && !isNaN(e)) {
          for (let k = Math.min(s, e); k <= Math.max(s, e); k++) {
            if (k > 0 && !parsed.includes(k)) parsed.push(k);
          }
        }
      } else {
        const num = parseInt(p, 10);
        if (!isNaN(num) && num > 0 && !parsed.includes(num)) {
          parsed.push(num);
        }
      }
    }
    const clamped = parsed.sort((a, b) => a - b).slice(0, 20);
    setSelectedEpisodes(clamped);
  };

  const selectQuickEpisodes = (count: number) => {
    const list: number[] = [];
    for (let i = 1; i <= Math.min(count, totalEpsInSeason, 20); i++) {
      list.push(i);
    }
    setSelectedEpisodes(list);
    setCustomInputText(list.join(", "));
  };

  // Gate check on user/VIP change
  useEffect(() => {
    const checkGate = () => {
      const user = getCurrentUser();
      setProfile(user);
      setAuthRequired(!user);

      const vip = Boolean(user && (isVipActive(user) || user.role === "admin" || getVipStatus()));
      if ((isSeries || isAnime) && !vip) {
        setBlockedReason(
          "TV Series and Anime Season packs require VIP Membership. Upgrade to VIP to request full seasons & custom episode batches!"
        );
      } else {
        setBlockedReason(null);
      }
    };

    checkGate();
    const handleUserChange = () => checkGate();
    window.addEventListener("filmfeed-user-change", handleUserChange);
    return () => window.removeEventListener("filmfeed-user-change", handleUserChange);
  }, [isSeries, isAnime, isOpen]);

  if (!isOpen) return null;

  const handleRequestClick = async (deliveryMode: "group" | "inbox" = "group") => {
    // 1. Mandatory Google Sign-In Check
    const user = getCurrentUser();
    if (!user) {
      setAuthRequired(true);
      setIsAuthModalOpen(true);
      return;
    }

    // 2. Strict User Tier & Limit Enforcement
    if ((isSeries || isAnime) && !isUserVip) {
      setBlockedReason(
        "TV Series and Anime Season packs require VIP Membership. Upgrade to VIP to request full seasons & episode batches!"
      );
      setIsVipModalOpen(true);
      return;
    }

    const limitCheck = checkRequestLimit(requestType, isUserVip);
    if (!limitCheck.allowed) {
      setBlockedReason(limitCheck.reason || "Request limit reached.");
      return;
    }

    // 3. Increment usage
    incrementUsage(requestType);

    const userName = user.name || "Member";
    const userPhone = user.phone || "Direct";
    const requestUrl = (movie.url || "").replace(/cinesubz\.(net|co)/g, "cinesubz.lk");
    let animeQuery = "";
    if (movie.url?.includes("animegg.org")) {
      animeQuery = movie.url.replace(/.*\/series\//, "").replace(/\/.*$/, "").trim();
    } else if (movie.title && !/anime\s*series\s*list/i.test(movie.title)) {
      animeQuery = movie.title;
    } else if ((movie as any).originalTitle && !/anime\s*series\s*list/i.test((movie as any).originalTitle)) {
      animeQuery = (movie as any).originalTitle;
    } else {
      animeQuery = movie.url?.replace(/.*anime-/, "").trim() || "";
    }

    if (!animeQuery || /anime\s*series\s*list/i.test(animeQuery)) {
      const slugMatch = movie.url?.match(/anime-([a-zA-Z0-9_-]+)/) || movie.url?.match(/series\/([a-zA-Z0-9_-]+)/);
      if (slugMatch && !/anime-series-list/i.test(slugMatch[1])) {
        animeQuery = slugMatch[1].replace(/-/g, " ");
      } else {
        animeQuery = "Solo Leveling";
      }
    }

    // Sanitize animeQuery: normalize unicode × to x, remove Sinhala, strip season/part suffixes from query string
    animeQuery = animeQuery
      .replace(/[\u00D7×]/g, " x ")
      .replace(/[\u0D80-\u0DFF]+/g, "")
      .replace(/\s*\(?\d{4}\)?.*$/, "")
      .replace(/\s*\|.*$/, "")
      .replace(/\s*(?:season|part|cour)\s*\d+.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!animeQuery || /anime\s*series\s*list/i.test(animeQuery)) {
      animeQuery = "Solo Leveling";
    }

    const cleanDisplayTitle = (movie.title && !/anime\s*series\s*list/i.test(movie.title))
      ? movie.title
      : animeQuery.replace(/\b\w/g, (c) => c.toUpperCase());

    // 4. Construct Request WhatsApp Message with Episode Selection & Dual Delivery Mode
    const effectiveDelivery = isUserVip ? deliveryMode : "group";
    const isIndividual = selectionMode === "individual" && selectedEpisodes.length > 0;
    const sortedEps = [...selectedEpisodes].sort((a, b) => a - b);
    const epRangeStr = isIndividual ? sortedEps.join(",") : `${startEpisode}-${endEpisode}`;
    const epBatchCount = isIndividual ? sortedEps.length : Math.max(1, endEpisode - startEpisode + 1);

    const botCommand = isAnime
      ? `!anime ${animeQuery} | Season ${selectedSeason || 1} | ${selectedQuality} | ${requestToken} | ${epRangeStr} | ${effectiveDelivery}`
      : isSeries
      ? `!req_season ${movie.url} | S${selectedSeason} | ${selectedQuality} | ${requestToken} | ${epRangeStr} | ${effectiveDelivery}`
      : `!req ${requestUrl} | ${selectedQuality} | ${requestToken} | ${effectiveDelivery}`;

    const deliveryDestinationText = effectiveDelivery === "inbox"
      ? "📥 Personal Inbox (Direct Private WhatsApp DM)"
      : "👥 FilmFeed Official Cinema Group";

    const vipHeader = isUserVip
      ? `👑 *FILMFEED VIP PREMIERE REQUEST* 👑\n━━━━━━━━━━━━━━━━━━━━━━\n✨ *VIP Priority Ultra High-Speed Channel*`
      : `🎬 *FILMFEED 4K • OFFICIAL REQUEST*\n━━━━━━━━━━━━━━━━━━━━━━`;

    const epDetailsLine = (isSeries || isAnime)
      ? isIndividual
        ? `\n🔢 *Episodes:* Episodes ${sortedEps.join(", ")} (${epBatchCount} Episodes Selected)`
        : `\n🔢 *Episodes:* Episodes ${startEpisode} - ${endEpisode} (${epBatchCount} Episodes Batch)`
      : "";

    const rawAnimeNote = isAnime ? "\n✨ *Release:* Clean RAW Original Master (No Burnt Subtitles)" : "";

    const professionalMessage = 
`${vipHeader}

🍿 *Content:* ${cleanDisplayTitle}
📦 *Type:* ${isAnime ? `Anime Series (Season ${selectedSeason || 1} Batch)` : isSeries ? `TV Series (Season ${selectedSeason} Pack)` : "4K Ultra HD Movie"}${epDetailsLine}${rawAnimeNote}
📺 *Quality:* ${selectedQuality}
🔑 *Security Token:* #${requestToken}
📬 *Delivery Destination:* ${deliveryDestinationText}

👤 *REQUESTER DETAILS:*
• Name: ${userName}
• Status: ${isUserVip ? "👑 VIP Member (20 Movies / 5 TV Series Daily)" : "Verified Google Member (Free Tier)"}
• WhatsApp: ${userPhone}
• Security: Single-Device Verified ✅

⚡ *Request Source:* FilmFeed 4K Hub
🌐 *Hub URL:* https://web-umber-six-e1un7z6257.vercel.app

━━━━━━━━━━━━━━━━━━━━━━
${botCommand}`;

    // 5. Log Request to Cloud Firestore
    const reqEpLabel = isIndividual ? `Eps ${sortedEps.join(",")}` : `Eps ${startEpisode}-${endEpisode}`;
    const loggedTitle = (isSeries || isAnime) ? `${movie.title} (${reqEpLabel})` : movie.title;

    try {
      await fetch("/api/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userPhone: user.phone || "Google Account",
          title: loggedTitle,
          type: isAnime ? "anime" : isSeries ? "series" : "movie",
          season: isSeries ? selectedSeason : undefined,
          quality: selectedQuality,
          token: requestToken,
          isVip: isUserVip,
          deliveryTarget: effectiveDelivery,
          status: "pending",
        }),
      });
    } catch (e) {}

    // Save to local user request history
    addUserRequestHistory({
      id: "req_" + Date.now().toString(36),
      title: loggedTitle,
      poster: movie.poster || "",
      type: isAnime ? "anime" : isSeries ? "series" : "movie",
      season: isSeries ? selectedSeason : undefined,
      quality: selectedQuality,
      token: requestToken,
      timestamp: new Date().toISOString(),
      status: "pending",
    });

    // 6. VIP USER: DIRECT 1-CLICK REQUEST! (Skips 4 ad steps!)
    if (isUserVip) {
      const waUrl = `https://api.whatsapp.com/send?phone=${targetBotPhone}&text=${encodeURIComponent(professionalMessage)}`;
      window.open(waUrl, "_blank");
      onClose();
      return;
    }

    // 7. NORMAL (FREE) USER: Route to 4-Step Ad Verification Flow (Movies only)
    const requestPayload = {
      title: movie.title,
      poster: movie.poster || "",
      url: movie.url,
      type: "movie",
      quality: selectedQuality,
      token: requestToken,
      userName,
      userPhone,
      isVip: false,
      botPhone: targetBotPhone,
      message: professionalMessage,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("filmfeed_verify_request", JSON.stringify(requestPayload));
    }

    onClose();

    const searchParams = new URLSearchParams({
      title: movie.title,
      type: "movie",
      quality: selectedQuality,
      token: requestToken,
      url: movie.url,
      botPhone: targetBotPhone,
      poster: movie.poster || "",
    });

    router.push(`/verify?${searchParams.toString()}`);
  };

  const usage = getDailyUsage();

  const qualityOptions = [
    {
      id: "1080p",
      label: "1080p Full HD",
      desc: "Ultra Crisp Master • Crystal Clear Audio",
      badge: "ULTRA HD",
    },
    {
      id: "720p",
      label: "720p HD Ready",
      desc: "High Speed Download • Optimized Data",
      badge: "RECOMMENDED",
    },
    {
      id: "480p",
      label: "480p SD Mobile",
      desc: "Lightweight Stream • Quick Storage",
      badge: "DATA SAVER",
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-white">
        <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-[#12141F] p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Gate 1: Mandatory Google Sign-In Block */}
          {authRequired && !currentUser ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <LogIn className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Google Sign-In Required</h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto mb-6">
                To prevent automated spam and secure bandwidth allocation, you must sign in with your Google account before requesting movies or TV series.
              </p>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 px-6 text-xs font-black text-black shadow-lg hover:bg-gray-100 transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span>SIGN IN WITH GOOGLE TO CONTINUE</span>
              </button>
            </div>
          ) : blockedReason ? (
            /* Gate 2: TV Series/Anime VIP Premiere Gate */
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-glow-gold">
                {isSeries ? <Lock className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                {isSeries ? "VIP Premiere Exclusive" : "Daily Limit Reached"}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto mb-6">
                {blockedReason}
              </p>
              <button
                type="button"
                onClick={() => setIsVipModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 px-6 text-xs font-black text-black shadow-lg hover:from-amber-300 hover:to-amber-400 transition-all"
              >
                <Crown className="h-4 w-4 fill-black" />
                <span>UPGRADE TO VIP PREMIERE</span>
              </button>
            </div>
          ) : (
            /* Main Request Setup View */
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3 pr-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/10 text-indigo-400">
                  {isAnime ? <Sparkles className="h-5 w-5" /> : isSeries ? <Tv className="h-5 w-5" /> : <Film className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white line-clamp-1">
                    {movie.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>{isAnime ? "Anime Series" : isSeries ? "TV Series Pack" : "4K Ultra HD Movie"}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">
                      {isAnime ? "Clean RAW (No Burnt Subs)" : "Sinhala Subtitles"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Season Selection for TV Series or Anime */}
              {isSeries && availableSeasons.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-300 mb-2 block uppercase tracking-wider">
                    Select Season Pack
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSeasons.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSeason(s)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                          selectedSeason === s
                            ? "bg-indigo-600 text-white shadow-glow-brand"
                            : "bg-white/[0.06] text-gray-400 hover:text-white border border-white/[0.06]"
                        }`}
                      >
                        Season {s} ({seasonsMap[s]?.length || 0} eps)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Episode Batch Selection (Max 20 episodes per batch) for TV Series & Anime */}
              {(isSeries || isAnime) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Select Episodes ({totalEpsInSeason} available)</span>
                    </label>
                    <div className="flex items-center gap-1 bg-white/[0.06] p-0.5 rounded-lg border border-white/10 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectionMode("individual")}
                        className={`px-2.5 py-1 rounded-md transition ${
                          selectionMode === "individual"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Pick Episodes
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectionMode("batch")}
                        className={`px-2.5 py-1 rounded-md transition ${
                          selectionMode === "batch"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Batch Range
                      </button>
                    </div>
                  </div>

                  {selectionMode === "individual" ? (
                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                      {/* Quick action buttons */}
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => selectQuickEpisodes(5)}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-white font-bold transition border border-white/10"
                          >
                            +5 Eps
                          </button>
                          <button
                            type="button"
                            onClick={() => selectQuickEpisodes(10)}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-white font-bold transition border border-white/10"
                          >
                            +10 Eps
                          </button>
                          <button
                            type="button"
                            onClick={() => selectQuickEpisodes(20)}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold transition border border-amber-500/30"
                          >
                            +20 Eps (Max)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEpisodes([]);
                              setCustomInputText("");
                            }}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition border border-red-500/20"
                          >
                            Clear
                          </button>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-amber-400">
                          {selectedEpisodes.length} / 20 selected
                        </span>
                      </div>

                      {/* Pagination tabs if total episodes > PAGE_SIZE */}
                      {totalEpsInSeason > PAGE_SIZE && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {Array.from({ length: Math.ceil(totalEpsInSeason / PAGE_SIZE) }).map((_, pIdx) => {
                            const pStart = pIdx * PAGE_SIZE + 1;
                            const pEnd = Math.min((pIdx + 1) * PAGE_SIZE, totalEpsInSeason);
                            return (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setEpisodePage(pIdx)}
                                className={`text-[9px] px-2 py-0.5 rounded-md font-bold shrink-0 transition ${
                                  episodePage === pIdx
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white/[0.05] text-gray-400 hover:text-white"
                                }`}
                              >
                                Eps {pStart}-{pEnd}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Interactive Episode Pills Grid */}
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-44 overflow-y-auto pr-1">
                        {Array.from({
                          length: Math.min(
                            PAGE_SIZE,
                            Math.max(0, totalEpsInSeason - episodePage * PAGE_SIZE)
                          ),
                        }).map((_, idx) => {
                          const epNum = episodePage * PAGE_SIZE + idx + 1;
                          const isSel = selectedEpisodes.includes(epNum);
                          return (
                            <button
                              key={epNum}
                              type="button"
                              onClick={() => toggleEpisode(epNum)}
                              className={`py-2 px-1 text-center rounded-xl text-xs font-black transition-all ${
                                isSel
                                  ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-glow-brand ring-2 ring-indigo-400 scale-[1.05]"
                                  : "bg-white/[0.05] text-gray-300 hover:bg-white/[0.12] hover:text-white border border-white/[0.06]"
                              }`}
                            >
                              {epNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Manual Comma-Separated Input Field */}
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1 font-bold">
                          Or type custom episode numbers (e.g. 1, 2, 5, 8):
                        </label>
                        <input
                          type="text"
                          value={customInputText}
                          onChange={(e) => handleCustomTextChange(e.target.value)}
                          placeholder="e.g. 1, 2, 5, 8"
                          className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                        />
                      </div>

                      <p className="text-[10px] text-emerald-400/90 font-medium">
                        ⚡ Selected Episodes: {selectedEpisodes.length > 0 ? selectedEpisodes.join(", ") : "None"} ({selectedEpisodes.length} eps). Only the chosen episodes will be delivered!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {bundles.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBundleId(b.id);
                              setStartEpisode(b.start);
                              setEndEpisode(b.end);
                            }}
                            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                              selectedBundleId === b.id
                                ? "bg-indigo-600 text-white shadow-glow-brand scale-[1.02]"
                                : "bg-white/[0.06] text-gray-300 hover:text-white border border-white/[0.08]"
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold">Start Episode</label>
                            <input
                              type="number"
                              min={1}
                              max={1000}
                              value={startEpisode}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const val = raw === "" ? 1 : Math.max(1, parseInt(raw, 10) || 1);
                                setStartEpisode(val);
                                if (endEpisode < val) setEndEpisode(val);
                                else if (endEpisode - val + 1 > 20) setEndEpisode(val + 19);
                              }}
                              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                            />
                          </div>
                          <span className="text-gray-500 pt-4 font-bold text-xs">to</span>
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-400 block mb-1 font-bold">End Episode (Max +20)</label>
                            <input
                              type="number"
                              min={startEpisode}
                              max={startEpisode + 19}
                              value={endEpisode}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const val = raw === "" ? startEpisode : Math.max(startEpisode, parseInt(raw, 10) || startEpisode);
                                const clamped = Math.min(val, startEpisode + 19);
                                setEndEpisode(clamped);
                              }}
                              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-bold"
                            />
                          </div>
                        </div>

                        <p className="text-[10px] text-amber-300/90 font-medium">
                          ⚡ Selected Range: Episodes {startEpisode} to {endEpisode} ({Math.max(1, endEpisode - startEpisode + 1)} episodes).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quality Selection */}
              <div>
                <label className="text-xs font-bold text-gray-300 mb-2 block uppercase tracking-wider">
                  Select Resolution Quality
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {qualityOptions.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setSelectedQuality(q.id)}
                      className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all ${
                        selectedQuality === q.id
                          ? "border-indigo-500 bg-indigo-600/20 text-white shadow-sm"
                          : "border-white/[0.08] bg-white/[0.03] text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-black text-white">{q.label}</span>
                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          {q.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 line-clamp-1">{q.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* User Quota & VIP Status Banner */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  {isUserVip ? (
                    <Crown className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  )}
                  <div>
                    <span className="font-bold text-gray-200">
                      {isUserVip ? "VIP Premiere Active" : "Free Member Quota"}
                    </span>
                    <p className="text-[10px] text-gray-400">
                      {isUserVip
                        ? `Movies: ${usage.moviesRequested || 0}/20 • TV Series & Anime: ${usage.seriesRequested || 0}/5`
                        : `Daily Movies: ${usage.moviesRequested || 0}/2 • TV Series & Anime require VIP`}
                    </p>
                  </div>
                </div>

                {!isUserVip && (
                  <button
                    type="button"
                    onClick={() => setIsVipModalOpen(true)}
                    className="text-[10px] font-black text-amber-400 hover:underline"
                  >
                    Upgrade VIP
                  </button>
                )}
              </div>

              {/* Action Buttons: Dual Delivery Modes for VIP vs Free Flow */}
              {isUserVip ? (
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Button 1: Request to Inbox */}
                    <button
                      type="button"
                      onClick={() => handleRequestClick("inbox")}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 px-4 text-xs font-black text-black shadow-glow-gold hover:from-amber-300 hover:to-amber-400 transition-all"
                    >
                      <Inbox className="h-4 w-4" />
                      <span>REQUEST TO INBOX</span>
                    </button>

                    {/* Button 2: Request to Group */}
                    <button
                      type="button"
                      onClick={() => handleRequestClick("group")}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 py-3.5 px-4 text-xs font-black text-white shadow-glow-brand transition-all border border-indigo-400/30"
                    >
                      <Users className="h-4 w-4" />
                      <span>REQUEST TO GROUP</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">
                    👑 <b>VIP Dual Delivery:</b> Click <b>Request to Inbox</b> to receive all episode documents directly in your private WhatsApp DM, or <b>Request to Group</b> to post to the cinema group.
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => handleRequestClick("group")}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-xs font-black bg-white text-black hover:bg-gray-100 shadow-xl transition-all"
                  >
                    <span>PROCEED TO VERIFICATION & DISPATCH</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-2">
                    Free members complete a 4-step secure verification before WhatsApp group dispatch.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <VipShareModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        onVipActivated={() => {
          setProfile(getCurrentUser());
          setBlockedReason(null);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setProfile(u);
          setAuthRequired(false);
        }}
        reason="Google Sign-In is required to submit requests."
      />
    </>
  );
};
