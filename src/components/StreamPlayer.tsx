"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Maximize2,
  Minimize2,
  RotateCw,
  Server,
  Tv,
  Film,
  Sparkles,
  ShieldCheck,
  Subtitles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Monitor,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { STREAM_SERVERS, ServerId, ServerOption, getEmbedUrl } from "@/lib/streamServers";

export interface SeasonInfo {
  season_number: number;
  episode_count: number;
  name?: string;
}

interface StreamPlayerProps {
  tmdbId: number;
  title: string;
  type: "movie" | "tv";
  backdrop?: string | null;
  poster?: string | null;
  numberOfSeasons?: number;
  seasons?: SeasonInfo[];
  directStreamUrl?: string;
}

const SERVERS = STREAM_SERVERS;

const SUBTITLE_TAGS = [
  "English [CC]",
  "Sinhala",
  "Spanish (Español)",
  "French (Français)",
  "German (Deutsch)",
  "Hindi (हिंदी)",
  "Multi-Audio",
];

export const StreamPlayer: React.FC<StreamPlayerProps> = ({
  tmdbId,
  title,
  type,
  backdrop,
  poster,
  numberOfSeasons = 1,
  seasons = [],
  directStreamUrl,
}) => {
  // Mandate: Default Server 2 (VidSrc Cloud - vidsrc_me)
  const [activeServer, setActiveServer] = useState<ServerId>("vidsrc_me");
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [isTheater, setIsTheater] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(true);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);

  // Available seasons list
  const availableSeasons = useMemo(() => {
    if (type !== "tv") return [];
    if (seasons && seasons.length > 0) {
      return seasons.filter((s) => s.season_number > 0);
    }
    const count = Math.max(1, numberOfSeasons);
    return Array.from({ length: count }, (_, i) => ({
      season_number: i + 1,
      episode_count: 12,
      name: `Season ${i + 1}`,
    }));
  }, [type, seasons, numberOfSeasons]);

  // Synchronize selected season if not present in availableSeasons
  useEffect(() => {
    if (availableSeasons.length > 0 && !availableSeasons.some((s) => s.season_number === selectedSeason)) {
      setSelectedSeason(availableSeasons[0].season_number);
      setSelectedEpisode(1);
    }
  }, [availableSeasons, selectedSeason]);

  // Escape key listener for theater mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTheater) {
        setIsTheater(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTheater]);

  const currentSeasonIndex = useMemo(() => {
    return availableSeasons.findIndex((s) => s.season_number === selectedSeason);
  }, [availableSeasons, selectedSeason]);

  // Current season episodes count
  const currentSeasonEpisodesCount = useMemo(() => {
    const current = availableSeasons.find((s) => s.season_number === selectedSeason);
    return current?.episode_count && current.episode_count > 0 ? current.episode_count : 12;
  }, [availableSeasons, selectedSeason]);

  const isFirstEpisode = currentSeasonIndex <= 0 && selectedEpisode <= 1;
  const isLastEpisode =
    currentSeasonIndex >= availableSeasons.length - 1 &&
    selectedEpisode >= currentSeasonEpisodesCount;

  // Validate TMDB ID or direct stream to prevent console errors and broken embeds
  const hasDirectStream = Boolean(directStreamUrl && directStreamUrl.trim().length > 0);
  const isDirectMp4 = Boolean(hasDirectStream && (directStreamUrl?.includes(".mp4") || directStreamUrl?.includes("cdn.sinhalacartoons.com")));
  const isValidTmdb = (typeof tmdbId === "number" && !isNaN(tmdbId) && tmdbId > 0) || hasDirectStream;

  // Generate current embed URL using central streamServers resolver or direct link
  const embedUrl = useMemo(() => {
    if (hasDirectStream) return directStreamUrl || "";
    if (!isValidTmdb) return "";
    return getEmbedUrl(activeServer, tmdbId, type, selectedSeason, selectedEpisode);
  }, [hasDirectStream, directStreamUrl, activeServer, type, tmdbId, selectedSeason, selectedEpisode, isValidTmdb]);

  // Reset iframe loading state when URL or reload key changes
  useEffect(() => {
    setIframeLoading(true);
  }, [embedUrl, reloadKey]);

  const handleNextEpisode = () => {
    if (selectedEpisode < currentSeasonEpisodesCount) {
      setSelectedEpisode((prev) => prev + 1);
    } else if (currentSeasonIndex >= 0 && currentSeasonIndex < availableSeasons.length - 1) {
      const nextSeason = availableSeasons[currentSeasonIndex + 1];
      setSelectedSeason(nextSeason.season_number);
      setSelectedEpisode(1);
    }
  };

  const handlePrevEpisode = () => {
    if (selectedEpisode > 1) {
      setSelectedEpisode((prev) => prev - 1);
    } else if (currentSeasonIndex > 0) {
      const prevSeason = availableSeasons[currentSeasonIndex - 1];
      setSelectedSeason(prevSeason.season_number);
      setSelectedEpisode(prevSeason.episode_count || 1);
    }
  };

  const toggleTheater = () => {
    setIsTheater(!isTheater);
  };

  return (
    <div
      id="watch-player"
      className={`w-full transition-all duration-300 ${
        isTheater
          ? "fixed inset-0 z-50 bg-black/95 overflow-y-auto p-2 sm:p-6 flex flex-col justify-center items-center backdrop-blur-xl"
          : "relative my-8"
      }`}
    >
      <div className={`w-full ${isTheater ? "max-w-7xl mx-auto" : "max-w-6xl mx-auto"}`}>
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 rounded-2xl bg-neutral-900/90 border border-white/10 p-3 sm:p-4 backdrop-blur-md shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-black">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>4K STREAM ONLINE</span>
            </div>

            <div className="text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs">
              <span className="truncate">{title}</span>
              {type === "tv" && (
                <span className="text-gray-400 font-mono text-xs shrink-0">
                  (S{selectedSeason}:E{selectedEpisode})
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions (Reload & Theater Mode) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              title="Reload Stream Player"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-bold transition-all active:scale-95 border border-white/10"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reload</span>
            </button>

            <button
              onClick={toggleTheater}
              title={isTheater ? "Exit Theater Mode" : "Expand Theater Mode"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-red-900/40"
            >
              {isTheater ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Theater</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Theater Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-white/15 shadow-[0_20px_60px_-15px_rgba(220,38,38,0.3)]">
          {!isValidTmdb ? (
            /* Missing or Invalid TMDB ID Safe Fallback */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-950">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mb-1">
                Stream Source Preparing
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mb-4 leading-relaxed">
                Direct online playback for &quot;{title}&quot; is synchronizing. You can request direct download via our WhatsApp Bot or retry the player.
              </p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all border border-white/15"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Player</span>
              </button>
            </div>
          ) : !hasStarted ? (
            /* Pre-play Splash Screen */
            <div
              className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center"
              style={{
                backgroundImage: backdrop ? `url(${backdrop})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <div className="relative z-10 flex flex-col items-center max-w-lg">
                <button
                  onClick={() => setHasStarted(true)}
                  className="group mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-2xl shadow-red-600/60 transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <Play className="h-10 w-10 fill-white ml-1 group-hover:scale-110 transition-transform" />
                </button>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
                  Stream {title} Free in 4K
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 mb-4">
                  Multi-Server High Speed CDN • No buffering • Multi-Language Audio & Subtitles
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold border border-white/20">
                    4K UHD Quality
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                    Zero Buffering
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-500/30">
                    Sinhala & English Subs
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Live Responsive Multi-Server Embed Iframe or Direct Native MP4 HTML5 Player */
            <div className="relative w-full h-full">
              {isDirectMp4 ? (
                <video
                  key={embedUrl}
                  src={embedUrl}
                  controls
                  playsInline
                  autoPlay
                  poster={backdrop || poster || undefined}
                  className="w-full h-full object-contain bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <>
                  {iframeLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
                      <Loader2 className="h-10 w-10 animate-spin text-red-500 mb-3" />
                      <span className="text-xs font-bold text-gray-300 tracking-wide">
                        Connecting to {SERVERS.find((s) => s.id === activeServer)?.name || "FilmFeed Cinema CDN"}...
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1">Multi-source high speed 1080p stream</span>
                    </div>
                  )}
                  <iframe
                    key={`${embedUrl}-${reloadKey}`}
                    src={embedUrl}
                    title={`${title} 4K Stream`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    loading="lazy"
                    sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
                    onLoad={() => setIframeLoading(false)}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Server Switcher Bar */}
        <div className="mt-4 rounded-2xl bg-neutral-900/80 border border-white/10 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-red-500" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Select Streaming Server
              </span>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:inline">
              If video fails or buffers, click any server below
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {SERVERS.map((server) => {
              const isActive = activeServer === server.id;
              return (
                <button
                  key={server.id}
                  onClick={() => {
                    setActiveServer(server.id);
                    setHasStarted(true);
                  }}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/40"
                      : "bg-white/5 border-white/10 hover:border-white/25 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold truncate">{server.name}</span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                        isActive ? "bg-black/30 text-white" : "bg-white/10 text-emerald-400"
                      }`}
                    >
                      {server.speed}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] truncate ${
                      isActive ? "text-white/80" : "text-gray-400"
                    }`}
                  >
                    {server.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TV Series Episode & Season Controls (if TV series) */}
        {type === "tv" && availableSeasons.length > 0 && (
          <div className="mt-4 rounded-2xl bg-neutral-900/80 border border-white/10 p-4 backdrop-blur-md space-y-4">
            {/* Season Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-blue-400" />
                  <span>Choose Season:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevEpisode}
                    disabled={isFirstEpisode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-xs text-white transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    onClick={handleNextEpisode}
                    disabled={isLastEpisode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-xs text-white transition-all active:scale-95"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {availableSeasons.map((s) => (
                  <button
                    key={s.season_number}
                    onClick={() => {
                      setSelectedSeason(s.season_number);
                      setSelectedEpisode(1);
                    }}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedSeason === s.season_number
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                        : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Season {s.season_number} ({s.episode_count || 12} EPs)
                  </button>
                ))}
              </div>
            </div>

            {/* Episode Selector */}
            <div>
              <span className="text-xs font-bold text-gray-300 block mb-2">
                Choose Episode in Season {selectedSeason}:
              </span>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-48 overflow-y-auto pr-1">
                {Array.from({ length: currentSeasonEpisodesCount }, (_, i) => i + 1).map((ep) => (
                  <button
                    key={ep}
                    onClick={() => setSelectedEpisode(ep)}
                    className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition-all ${
                      selectedEpisode === ep
                        ? "bg-white text-black font-black scale-105 shadow-md shadow-white/30"
                        : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/15"
                    }`}
                  >
                    EP {ep}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Subtitles & Tips Info Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/5 border border-white/10 p-3.5 text-xs text-gray-300">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-amber-400 font-bold shrink-0">
              <Subtitles className="w-4 h-4" />
              <span>Subtitles Supported:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUBTITLE_TAGS.map((sub) => (
                <span
                  key={sub}
                  className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-medium text-gray-200"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ad-free streaming with Brave browser or Adblock</span>
          </div>
        </div>
      </div>
    </div>
  );
};
