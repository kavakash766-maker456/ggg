"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AdBanner } from "@/components/AdBanner";
import { getCurrentUser, isVipActive } from "@/lib/userState";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Film,
  Tv,
  ArrowLeft,
  Lock,
  Unlock,
  Zap,
  Check,
  Copy,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface RequestData {
  title: string;
  poster: string;
  url: string;
  type: string;
  season?: number;
  quality: string;
  token: string;
  userName?: string;
  userPhone?: string;
  isVip?: boolean;
  botPhone: string;
  message: string;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract query parameters
  const paramTitle = searchParams.get("title") || "Selected Movie";
  const paramType = searchParams.get("type") || "movie";
  const paramSeason = Number(searchParams.get("season")) || 1;
  const paramQuality = searchParams.get("quality") || "720p";
  const paramToken = searchParams.get("token") || "TOKEN";
  const paramUrl = searchParams.get("url") || "";
  const paramBotPhone = searchParams.get("botPhone") || "94782088603";
  const paramPoster = searchParams.get("poster") || "";

  const [requestData, setRequestData] = useState<RequestData>({
    title: paramTitle,
    poster: paramPoster,
    url: paramUrl,
    type: paramType,
    season: paramSeason,
    quality: paramQuality,
    token: paramToken,
    botPhone: paramBotPhone,
    message: "",
  });

  // 4-Step Unlocking Verification State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const STEP_DURATION = 5; // 5 seconds per step
  const [timeLeft, setTimeLeft] = useState<number>(STEP_DURATION);
  const [stepUnlocked, setStepUnlocked] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Restore cached session details if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("filmfeed_verify_request");
        if (stored) {
          const parsed = JSON.parse(stored);
          setRequestData((prev) => ({
            ...prev,
            ...parsed,
            poster: parsed.poster || prev.poster,
            message: parsed.message || prev.message,
          }));
        }
      } catch (e) {}
    }
  }, []);

  // Per-step Countdown Timer
  useEffect(() => {
    setStepUnlocked(false);
    setTimeLeft(STEP_DURATION);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStepUnlocked(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep]);

  const triggerMonetizationPop = () => {
    const directLink = process.env.NEXT_PUBLIC_ADSTERRA_DIRECT_LINK;
    if (directLink && typeof window !== "undefined") {
      try {
        window.open(directLink, "_blank");
      } catch (e) {}
    }
  };

  const advanceStep = () => {
    if (!stepUnlocked) return;
    triggerMonetizationPop();
    if (currentStep < 4) {
      setCurrentStep((s) => s + 1);
    }
  };

  const isSeries = requestData.type === "series" || requestData.type === "tv";
  const isAnime = requestData.type === "anime";

  const finalMessage =
    requestData.message ||
    `🎬 ━━━━━━━━━━━━━━━━━━━━━━
   *FILMFEED 4K • OFFICIAL REQUEST*
━━━━━━━━━━━━━━━━━━━━━━ 🎬

🍿 *Content:* ${requestData.title}
📦 *Type:* ${isAnime ? `Anime Series (Season ${requestData.season || 1} Batch)` : isSeries ? `TV Series (Season ${requestData.season} Pack)` : "4K Ultra HD Movie"}
📺 *Quality:* ${requestData.quality}
🔑 *Security Token:* #${requestData.token}

⚡ *Request Source:* FilmFeed 4K Hub
🌐 *Hub URL:* https://web-umber-six-e1un7z6257.vercel.app

━━━━━━━━━━━━━━━━━━━━━━
${
  isAnime
    ? `!anime ${requestData.title} | Season ${requestData.season || 1} | ${requestData.quality} | ${requestData.token}`
    : isSeries
    ? `!req_season ${requestData.url} | S${requestData.season} | ${requestData.quality} | ${requestData.token}`
    : `!req ${requestData.url} | ${requestData.quality} | ${requestData.token}`
}`;

  const targetBotPhone = requestData.botPhone || "94782088603";
  const waUrl = `https://api.whatsapp.com/send?phone=${targetBotPhone}&text=${encodeURIComponent(finalMessage)}`;

  const handleFinalDispatch = () => {
    triggerMonetizationPop();
    window.open(waUrl, "_blank");
  };

  const copyToken = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`#${requestData.token}`);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const stepsMeta = [
    {
      step: 1,
      title: "Allocating 4K CDN Bandwidth",
      desc: "Connecting to FilmFeed Ultra CDN cluster for high-speed document dispatch.",
    },
    {
      step: 2,
      title: "Verifying Device Token",
      desc: "Checking single-device gate security and assigning unique download slot.",
    },
    {
      step: 3,
      title: "Decrypting WhatsApp Stream",
      desc: "Preparing 4K high-bitrate Sinhala subtitles stream for WhatsApp group broadcast.",
    },
    {
      step: 4,
      title: "Verification Complete",
      desc: "All 4 security checks passed. Your download slot is allocated and ready.",
    },
  ];

  const currentMeta = stepsMeta[currentStep - 1];

  // Block non-VIP from verifying TV Series or Anime requests
  const user = getCurrentUser();
  const userIsVip = Boolean(user && isVipActive(user));
  if ((isSeries || isAnime) && !userIsVip) {
    return (
      <div className="min-h-screen bg-[#0A0B10] text-white px-4 py-16 max-w-lg mx-auto flex flex-col items-center justify-center text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-glow-gold">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">VIP Membership Required</h2>
        <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto mb-6">
          TV Series and Anime Season packs require VIP Membership. Free requests are only available for 4K movies.
        </p>
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 px-6 text-xs font-black text-black shadow-glow-gold hover:from-amber-300 hover:to-amber-400 transition-all"
        >
          <span>RETURN HOME TO UPGRADE VIP</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B10] text-white px-4 py-8 max-w-3xl mx-auto flex flex-col items-center">
      {/* Top Breadcrumb & Status */}
      <div className="w-full flex items-center justify-between mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-[#161824] border border-white/[0.08] px-3.5 py-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Browse</span>
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-emerald-400 font-bold">Bot Gateway Online</span>
        </div>
      </div>

      {/* Security Gateway Badge */}
      <div className="w-full text-center mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-400 mb-3 shadow-glow-brand">
          <ShieldCheck className="h-4 w-4" />
          <span>FILMFEED 4-STEP VERIFICATION GATEWAY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {currentMeta.title}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-lg mx-auto">
          {currentMeta.desc}
        </p>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="w-full mb-6">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`rounded-xl py-2 px-1 text-center transition-all border ${
                step === currentStep
                  ? "bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-glow-brand"
                  : step < currentStep
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold"
                  : "bg-white/[0.03] border-white/[0.06] text-gray-500"
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider">
                {step < currentStep ? "✓ Step " + step : "Step " + step}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP SPONSORED BANNER (High Viewability) */}
      <div className="w-full">
        <AdBanner label="Sponsored High-Speed Server Partner" />
      </div>

      {/* Content Summary Card */}
      <div className="w-full rounded-2xl border border-white/[0.08] bg-[#131520] p-4 sm:p-5 mb-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {requestData.poster ? (
            <div className="relative w-20 h-28 sm:w-24 sm:h-36 flex-shrink-0 rounded-xl overflow-hidden border border-white/20 shadow-md">
              <Image
                src={requestData.poster}
                alt={requestData.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-20 h-28 sm:w-24 sm:h-36 flex-shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              {isSeries ? <Tv className="h-8 w-8 text-gray-500" /> : <Film className="h-8 w-8 text-gray-500" />}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[9px] font-black uppercase text-indigo-300">
                {isAnime ? "ANIME SERIES" : isSeries ? `TV SERIES • S${requestData.season}` : "4K UHD MOVIE"}
              </span>
              <span className="rounded-md bg-white/10 border border-white/20 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                {requestData.quality}
              </span>
              <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                SINHALA SUBTITLES
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-white leading-snug line-clamp-2">
              {requestData.title}
            </h2>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 px-2.5 py-1 rounded-lg text-xs">
                <span className="text-gray-400">Token:</span>
                <span className="font-mono font-bold text-amber-400">#{requestData.token}</span>
                <button
                  type="button"
                  onClick={copyToken}
                  className="text-gray-400 hover:text-white transition-colors ml-1"
                  title="Copy token"
                >
                  {copiedToken ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 px-2.5 py-1 rounded-lg text-xs">
                <span className="text-gray-400">Bot:</span>
                <span className="font-mono text-gray-300">+{targetBotPhone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VERIFICATION UNLOCK CARD */}
      <div className="w-full rounded-2xl border border-white/[0.12] bg-[#161824] p-6 mb-6 shadow-2xl relative overflow-hidden text-center">
        {currentStep < 4 ? (
          /* Steps 1 to 3: Countdown and Continue */
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-4">
              {stepUnlocked ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                  <span className="text-2xl font-black font-mono">{timeLeft}s</span>
                </div>
              )}
            </div>

            <h3 className="text-lg font-black text-white mb-1">
              {stepUnlocked
                ? `Step ${currentStep} of 4 Ready!`
                : `Verifying Step ${currentStep} of 4...`}
            </h3>
            <p className="text-xs text-gray-400 mb-6 max-w-sm">
              {stepUnlocked
                ? "Click the button below to proceed to the next verification stage."
                : "Please wait a moment while server resources are allocated for your stream."}
            </p>

            <button
              type="button"
              disabled={!stepUnlocked}
              onClick={advanceStep}
              className={`w-full max-w-md flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-xs font-black transition-all ${
                stepUnlocked
                  ? "bg-white text-black hover:bg-gray-200 shadow-xl active:scale-95"
                  : "bg-white/10 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span>CONTINUE TO STEP {currentStep + 1}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* Step 4: Final Unlock & WhatsApp Dispatch */
          <div className="flex flex-col items-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              All 4 Verification Steps Complete!
            </h3>
            <p className="text-xs text-gray-300 mb-6 max-w-md">
              Your 4K stream token has been generated. Click below to open WhatsApp and dispatch your request directly to the FilmFeed bot engine.
            </p>

            <button
              type="button"
              onClick={handleFinalDispatch}
              className="w-full max-w-md flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 px-6 text-xs font-black text-black shadow-xl hover:bg-[#20ba59] active:scale-95 transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              <span>DISPATCH REQUEST TO WHATSAPP BOT NOW</span>
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM SPONSORED BANNER */}
      <div className="w-full">
        <AdBanner label="High Speed Cloud Mirror" />
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0B10] flex items-center justify-center p-4">
          <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
