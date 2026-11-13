"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Flame,
  Lock,
  Crown,
  Search,
  ShieldAlert,
  Play,
  Eye,
  Clock,
  Sparkles,
  Send,
  MessageSquare,
  Copy,
  Check,
  X,
  ExternalLink,
  Film,
  Loader2,
  Tv,
  Maximize2,
  ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { VipUnlockModal } from "@/components/VipUnlockModal";
import { getCurrentUser, isVipActive, UserProfile, syncUserWithServer } from "@/lib/userState";

const BOT_PHONE_NUMBER = "94782088603";

interface AdultVideo {
  id: string | number;
  title: string;
  url: string;
  embed?: string;
  thumbnail: string;
  previewThumb?: string;
  thumbs?: string[];
  duration: number;
  durationFormatted: string;
  views: number;
  quality: string;
  rating?: string;
}

const CATEGORY_TAGS = [
  { label: "Trending 🔥", query: "trending" },
  { label: "Japanese 🇯🇵", query: "japanese" },
  { label: "Japanese Full (1-3h+) 🔞", query: "japanese full movie", forceDuration: "full" },
  { label: "Black / Ebony 🖤", query: "ebony" },
  { label: "Asian 🌸", query: "asian" },
  { label: "VR 360 🥽", query: "vr" },
  { label: "4K Ultra 💎", query: "4k" },
  { label: "Massage 💆", query: "massage" },
  { label: "Cosplay 🎭", query: "cosplay" },
  { label: "Hardcore ⚡", query: "hardcore" },
  { label: "College 🎓", query: "college" },
];

const DURATION_OPTIONS = [
  { label: "All Durations", value: "all" },
  { label: "Full Length (60m+) 🔥", value: "full" },
  { label: "Medium (20-60m)", value: "medium" },
  { label: "Short (< 20m)", value: "short" },
];

/**
 * Interactive Video Card with Pornhub-style Storyboard Scrubbing on Hover
 */
const StoryboardVideoCard: React.FC<{
  video: AdultVideo;
  onSelect: (v: AdultVideo) => void;
  onWatch: (v: AdultVideo) => void;
}> = ({ video, onSelect, onWatch }) => {
  const [activeThumbIndex, setActiveThumbIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const thumbs = video.thumbs && video.thumbs.length > 0 ? video.thumbs : [video.thumbnail];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (thumbs.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const index = Math.min(thumbs.length - 1, Math.floor(percent * thumbs.length));
    setActiveThumbIndex(index);
  };

  const currentThumb = isHovered && thumbs[activeThumbIndex] ? thumbs[activeThumbIndex] : video.thumbnail;

  return (
    <div className="group relative rounded-2xl bg-[#10131E] border border-white/[0.06] hover:border-rose-500/50 transition-all hover:shadow-[0_0_30px_rgba(244,63,94,0.25)] flex flex-col overflow-hidden">
      {/* Interactive Thumbnail Box */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-black cursor-pointer select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setActiveThumbIndex(0);
        }}
        onMouseMove={handleMouseMove}
        onClick={() => onWatch(video)}
      >
        <Image
          src={currentThumb}
          alt={video.title}
          fill
          unoptimized
          className="object-cover transition-transform duration-200 group-hover:scale-105"
        />

        {/* Ambient Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Pornhub-Style Interactive Scrub Progress Bar on Hover */}
        {isHovered && thumbs.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
            <div
              className="h-full bg-rose-500 transition-all duration-75"
              style={{ width: `${((activeThumbIndex + 1) / thumbs.length) * 100}%` }}
            />
          </div>
        )}

        {/* Hover Scrubbing Frame Badge */}
        {isHovered && thumbs.length > 1 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[9px] font-bold text-rose-300 border border-rose-500/30 z-20">
            Preview {activeThumbIndex + 1}/{thumbs.length}
          </div>
        )}

        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600/90 text-white shadow-xl shadow-rose-600/50">
            <Play className="h-5 w-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/10 z-10">
          <Clock className="h-2.5 w-2.5 text-rose-400" />
          <span>{video.durationFormatted}</span>
        </div>

        {/* Quality Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-600 text-[10px] font-black text-white shadow-md z-10">
          {video.quality || "1080p"}
        </div>
      </div>

      {/* Meta info & Action Buttons */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <h3
          onClick={() => onWatch(video)}
          className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-rose-400 transition-colors mb-3 cursor-pointer"
          title={video.title}
        >
          {video.title}
        </h3>

        <div className="space-y-2 pt-1 border-t border-white/[0.04]">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-gray-500" />
              <span>{video.views.toLocaleString()} views</span>
            </div>
            {video.duration >= 3600 && (
              <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                Full Movie
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onWatch(video)}
              className="py-1.5 px-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors border border-white/[0.08]"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Watch</span>
            </button>
            <button
              type="button"
              onClick={() => onSelect(video)}
              className="py-1.5 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all border border-rose-500/30"
            >
              <Send className="h-3 w-3" />
              <span>Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Vault18Page() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [ageVerified, setAgeVerified] = useState<boolean>(true);
  const [isVipModalOpen, setIsVipModalOpen] = useState<boolean>(false);

  // Search & Catalog State
  const [query, setQuery] = useState<string>("trending");
  const [searchInput, setSearchInput] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [sort, setSort] = useState<string>("views");
  const [durationFilter, setDurationFilter] = useState<string>("all");

  const [videos, setVideos] = useState<AdultVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // In-Website Player Modal State
  const [playingVideo, setPlayingVideo] = useState<AdultVideo | null>(null);

  // Selected Video for WhatsApp Bot Request Modal
  const [selectedVideo, setSelectedVideo] = useState<AdultVideo | null>(null);
  const [deliveryTarget, setDeliveryTarget] = useState<"inbox" | "group">("inbox");
  const [selectedQuality, setSelectedQuality] = useState<string>("720p");
  const [copied, setCopied] = useState<boolean>(false);

  // Sentinel ref for Infinite Scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Load User state
  useEffect(() => {
    setCurrentUser(getCurrentUser());
    syncUserWithServer().then((u) => {
      if (u) setCurrentUser(u);
    });

    const handleUserChange = () => setCurrentUser(getCurrentUser());
    window.addEventListener("filmfeed-user-change", handleUserChange);
    return () => window.removeEventListener("filmfeed-user-change", handleUserChange);
  }, []);

  // Fetch Videos Function (handles initial page and infinite scroll append)
  const fetchVideos = useCallback(
    async (targetPage: number, isAppend: boolean = false) => {
      if (isAppend) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const url = `/api/adult?q=${encodeURIComponent(query)}&page=${targetPage}&sort=${sort}&duration=${durationFilter}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.success && Array.isArray(data.videos)) {
          if (isAppend) {
            setVideos((prev) => {
              const existingIds = new Set(prev.map((v) => String(v.id)));
              const newUnique = data.videos.filter((v: AdultVideo) => !existingIds.has(String(v.id)));
              return [...prev, ...newUnique];
            });
          } else {
            setVideos(data.videos);
          }
          setHasMore(data.videos.length >= 10);
        } else {
          if (!isAppend) setVideos([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to load adult catalog:", err);
        if (!isAppend) setVideos([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, sort, durationFilter]
  );

  // Reload when query, sort, or durationFilter changes
  useEffect(() => {
    setPage(1);
    fetchVideos(1, false);
  }, [fetchVideos]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchVideos(nextPage, true);
            return nextPage;
          });
        }
      },
      { rootMargin: "350px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, fetchVideos]);

  const handleVerifyAge = () => {
    localStorage.setItem("filmfeed_18_verified", "true");
    setAgeVerified(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setQuery(searchInput.trim());
  };

  const handleCategoryClick = (tagQuery: string, forceDuration?: string) => {
    setQuery(tagQuery);
    setSearchInput(tagQuery);
    if (forceDuration) {
      setDurationFilter(forceDuration);
    }
  };

  const isVip = Boolean(currentUser && isVipActive(currentUser));

  // Request Command & Message Generator
  const requestToken = `VAULT18_${Date.now().toString(36).toUpperCase()}`;
  const botCommand = selectedVideo
    ? `!xh ${selectedVideo.url} | ${selectedQuality} | ${requestToken} | ${deliveryTarget}`
    : "";

  const professionalWhatsAppMessage = selectedVideo
    ? `🔞 *FILMFEED VIP 18+ VAULT REQUEST*
━━━━━━━━━━━━━━━━━━━━
🎬 *Title:* ${selectedVideo.title}
⏱️ *Duration:* ${selectedVideo.durationFormatted}
📺 *Requested Quality:* ${selectedQuality}
🔑 *Website Token:* ${requestToken}
📬 *Delivery Destination:* ${deliveryTarget === "inbox" ? "Personal Inbox 📥" : "Cinema Group 👥"}
━━━━━━━━━━━━━━━━━━━━
${botCommand}
━━━━━━━━━━━━━━━━━━━━
✨ *Discreet & Private VIP Delivery*`
    : "";

  const handleCopyCommand = () => {
    if (!botCommand) return;
    navigator.clipboard.writeText(professionalWhatsAppMessage || botCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppSend = () => {
    if (!professionalWhatsAppMessage) return;
    // Explicitly target the official FilmFeed Bot phone number so chat opens directly!
    const waUrl = `https://api.whatsapp.com/send?phone=${BOT_PHONE_NUMBER}&text=${encodeURIComponent(
      professionalWhatsAppMessage
    )}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      <Navbar activeTab="vault18" />

      {/* Age Gate Modal if not verified */}
      {!ageVerified && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <div className="max-w-md w-full bg-[#10131E] border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(244,63,94,0.2)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-600/20 border border-rose-500/40 mb-5">
              <ShieldAlert className="h-8 w-8 text-rose-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">
              Age Verification (18+)
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
              This section contains adult material intended solely for consenting adults aged 18 or older.
              By clicking Enter, you confirm that you are at least 18 years old.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleVerifyAge}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 font-bold text-white text-sm hover:from-rose-500 hover:to-red-500 transition-all shadow-[0_0_25px_rgba(244,63,94,0.4)] active:scale-95"
              >
                I am 18 or Older — Enter Vault
              </button>
              <Link
                href="/"
                className="w-full py-3 px-6 rounded-2xl bg-white/[0.05] border border-white/[0.08] font-semibold text-gray-400 text-xs hover:text-white hover:bg-white/[0.08] transition-all"
              >
                Exit to Main Site
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-950/40 via-[#0E111C] to-[#07090E] p-6 sm:p-10 mb-8 shadow-2xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-600/20 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider mb-4">
              <Flame className="h-3.5 w-3.5 text-rose-500 animate-bounce" />
              <span>FilmFeed VIP 18+ Vault</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-3 leading-tight">
              Uncensored HD & 4K Adult Video Catalog
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6">
              Watch full-length videos directly online, scrub previews on hover, or request discreet WhatsApp inbox delivery in 1080p FHD!
            </p>

            {/* Category / Genre Pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => handleCategoryClick(tag.query, tag.forceDuration)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                    query.toLowerCase() === tag.query.toLowerCase()
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40 scale-105"
                      : "bg-white/[0.06] text-gray-300 hover:text-white hover:bg-white/[0.12] border border-white/[0.06]"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VIP Status Announcement Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-[#121624] to-amber-950/30 border border-white/[0.08] mb-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>FilmFeed 18+ Vault v2.0 Live</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/30">
                  New Features Active
                </span>
              </p>
              <p className="text-[11px] text-gray-400">
                Hover/touch thumbnail to scrub storyboard preview • Watch full length videos online • Direct WhatsApp inbox delivery
              </p>
            </div>
          </div>
          {!isVip && (
            <button
              type="button"
              onClick={() => setIsVipModalOpen(true)}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs hover:brightness-105 active:scale-95 transition-all shadow-md shadow-amber-500/20"
            >
              Unlock Unlimited VIP
            </button>
          )}
        </div>

        {/* Video Catalog Section (Always open and visible to everyone!) */}
        <div>
          <div>
            {/* Search and Filters Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 bg-[#0F121D] p-4 rounded-2xl border border-white/[0.06]">
              {/* Search input */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search Japanese, Black / Ebony, Cosplay, Studio..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#090C14] border border-white/[0.08] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-rose-500/50 transition-all"
                />
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
              </form>

              {/* Duration & Sort Bar */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Duration Filter Pills */}
                <div className="flex items-center bg-[#090C14] rounded-xl p-1 border border-white/[0.08]">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDurationFilter(opt.value)}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                        durationFilter === opt.value
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Sort:</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-[#090C14] border border-white/[0.08] text-xs font-semibold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="views">Most Viewed</option>
                    <option value="best">Top Rated</option>
                    <option value="newest">Newest First</option>
                    <option value="longest">Longest Duration</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Video Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="aspect-video rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.04]"
                  />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-16 bg-[#10131E] rounded-3xl border border-white/[0.06] p-8">
                <p className="text-gray-400 text-sm">No videos found matching &ldquo;{query}&rdquo;.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("trending");
                    setDurationFilter("all");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Reset Catalog
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {videos.map((vid) => (
                    <StoryboardVideoCard
                      key={vid.id}
                      video={vid}
                      onSelect={(v) => setSelectedVideo(v)}
                      onWatch={(v) => setPlayingVideo(v)}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="py-10 flex flex-col items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#10131E] border border-white/[0.08] text-xs font-bold text-rose-400 shadow-xl">
                      <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                      <span>Loading more videos...</span>
                    </div>
                  )}

                  {!loadingMore && hasMore && (
                    <button
                      type="button"
                      onClick={() => {
                        setPage((p) => {
                          const nextP = p + 1;
                          fetchVideos(nextP, true);
                          return nextP;
                        });
                      }}
                      className="px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-gray-300 hover:text-white transition-all"
                    >
                      Load More Videos
                    </button>
                  )}

                  {!hasMore && videos.length > 0 && (
                    <p className="text-xs text-gray-500 font-semibold">
                      You have reached the end of the catalog ({videos.length} videos loaded).
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* IN-PAGE THEATER VIDEO PLAYER MODAL */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="relative max-w-4xl w-full bg-[#10131E] border border-rose-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            {/* Header / Close */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 truncate">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 shrink-0">
                  <Play className="h-4 w-4 fill-current" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-white truncate">
                  {playingVideo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.15] transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Video Iframe Player Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/[0.08] shadow-2xl mb-4">
              {playingVideo.embed ? (
                <iframe
                  src={playingVideo.embed}
                  title={playingVideo.title}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <Film className="h-12 w-12 text-rose-500 mb-3" />
                  <p className="text-sm font-bold text-white mb-1">Direct Embed Unavailable</p>
                  <p className="text-xs text-gray-400 mb-4">Please request via WhatsApp Bot for direct 1080p MP4 download.</p>
                </div>
              )}
            </div>

            {/* Player Bottom Bar & WhatsApp Request Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="font-bold text-white flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-rose-400" />
                  {playingVideo.durationFormatted}
                </span>
                <span>•</span>
                <span>{playingVideo.views.toLocaleString()} views</span>
                <span>•</span>
                <span className="text-rose-400 font-bold">{playingVideo.quality}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const v = playingVideo;
                    setPlayingVideo(null);
                    setSelectedVideo(v);
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Request to WhatsApp Inbox</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP BOT REQUEST MODAL */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative max-w-lg w-full bg-[#10131E] border border-rose-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Video preview in modal */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-black border border-white/[0.08]">
              <Image
                src={selectedVideo.thumbnail}
                alt={selectedVideo.title}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 border border-white/10">
                <Clock className="h-3 w-3 text-rose-400" />
                <span>{selectedVideo.durationFormatted}</span>
                <span>•</span>
                <span>{selectedVideo.views.toLocaleString()} views</span>
              </div>
            </div>

            <h3 className="font-black text-sm sm:text-base text-white mb-4 line-clamp-2">
              {selectedVideo.title}
            </h3>

            {/* Destination Mode Switcher */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Delivery Destination
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryTarget("inbox")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    deliveryTarget === "inbox"
                      ? "bg-rose-600/20 border-rose-500 text-rose-300 shadow-sm"
                      : "bg-white/[0.04] border-white/[0.06] text-gray-400 hover:text-white"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Private Inbox 📥</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryTarget("group")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    deliveryTarget === "group"
                      ? "bg-rose-600/20 border-rose-500 text-rose-300 shadow-sm"
                      : "bg-white/[0.04] border-white/[0.06] text-gray-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>VIP Group 👥</span>
                </button>
              </div>
            </div>

            {/* Quality Picker */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Video Quality
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["1080p", "720p", "480p"].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQuality(q)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedQuality === q
                        ? "bg-rose-600/30 border-rose-500 text-white"
                        : "bg-white/[0.04] border-white/[0.06] text-gray-400 hover:text-white"
                    }`}
                  >
                    {q} {q === "1080p" ? "FHD" : q === "720p" ? "HD" : "SD"}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot Command Snippet */}
            <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] font-mono text-[11px] text-gray-300 mb-5 break-all flex items-center justify-between gap-2">
              <span className="truncate">{botCommand}</span>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="shrink-0 p-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white transition-colors"
                title="Copy Command"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleWhatsAppSend}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-green-500 transition-all shadow-lg shadow-emerald-900/30 active:scale-95"
              >
                <Send className="h-4 w-4" />
                <span>Send Request to WhatsApp Bot (078 208 8603)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIP Unlock Modal */}
      <VipUnlockModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
      />
    </div>
  );
}
