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

  // 5-Step Unlocking Verification State
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

  const ADSTERRA_SMARTLINKS = [
    "https://directyp.org/4/19e3d997accef9e4c330f1be1284d8be",
    "https://auctionr.org/4/14476ca5217e71596abcbc486c9ef407",
    "https://asiafilm.org/4/739684d4bbb6e73705d5d7764d0734ca",
    "https://ardance.org/4/85b763851dffe3ea28b84d2372c667e8",
  ];

  const triggerMonetizationPop = () => {
    const directLink = ADSTERRA_SMARTLINKS[Math.floor(Math.random() * ADSTERRA_SMARTLINKS.length)];
    if (typeof window !== "undefined") {
      try {
        window.open(directLink, "_blank");
      } catch (e) {}
    }
  };

  const advanceStep = () => {
    if (!stepUnlocked) return;
    triggerMonetizationPop();
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    }
  };

  const isCartoon = Boolean(
    /cartoon|sinhala dubbed|sinhala dub/i.test(requestData.title || "") ||
    requestData.url?.includes("sinhalacartoons") ||
    requestData.url?.includes("cartoons.lk") ||
    requestData.type === "cartoon"
  );
  const isSeries = (!isCartoon || requestData.type === "teledrama") && (requestData.type === "series" || requestData.type === "tv" || requestData.type === "teledrama");
  const isAnime = !isCartoon && requestData.type === "anime";

  const finalMessage =
    requestData.message ||
    `🎬 ━━━━━━━━━━━━━━━━━━━━━━
   *FILMFEED 4K • OFFICIAL REQUEST*
━━━━━━━━━━━━━━━━━━━━━━ 🎬

🍿 *Content:* ${requestData.title}
📦 *Type:* ${isAnime ? `Anime Series (Season ${requestData.season || 1} Batch)` : isSeries ? `TV Series (Season ${requestData.season} Pack)` : isCartoon ? "Sinhala Dubbed Cartoon / Movie" : "4K Ultra HD Movie"}
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
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(requestData.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const stepsMeta = [
    {
      step: 1,
      title: "Step 1 of 5: Security Handshake",
      desc: "Establishing secure encrypted connection with FilmFeed VIP WhatsApp server...",
      action: "PROCEED TO STEP 2",
    },
    {
      step: 2,
      title: "Step 2 of 5: Bandwidth Allocation",
      desc: "Allocating 4K high-speed direct stream line & anti-abuse quota token...",
      action: "PROCEED TO STEP 3",
    },
    {
      step: 3,
      title: "Step 3 of 5: Anti-Spam Verification",
      desc: "Verifying single-device session integrity and bot prevention protocols...",
      action: "PROCEED TO STEP 4",
    },
    {
      step: 4,
      title: "Step 4 of 5: Stream Engine Preparation",
      desc: "Encoding high-resolution stream payload & preparing WhatsApp document queue...",
      action: "PROCEED TO FINAL STEP 5",
    },
    {
      step: 5,
      title: "Step 5 of 5: Verification Complete!",
      desc: "Your movie request is verified and ready for instant WhatsApp Group dispatch!",
      action: "🚀 SEND TO WHATSAPP GROUP (UNLOCK NOW)",
    },
  ];

  const currentMeta = stepsMeta[currentStep - 1];

  // Block non-VIP from verifying TV Series or Anime requests
  const user = getCurrentUser();
  const userIsVip = Boolean(user && isVipActive(user));
  if ((isSeries || isAnime) && !userIsVip) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-16 max-w-lg mx-auto flex flex-col items-center justify-center text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-glow-gold">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">VIP Membership Required</h2>
        <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto mb-6">
          TV Series and Anime Season packs require VIP Membership (Rs. 200/mo). Free requests are available for 4K movies.
        </p>
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 px-6 text-xs font-black text-black shadow-glow-gold hover:from-amber-300 hover:to-amber-400 transition-all"
        >
          <span>RETURN HOME TO GET VIP</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 max-w-3xl mx-auto flex flex-col items-center">
      {/* Top Breadcrumb & Status */}
      <div className="w-full flex items-center justify-between mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl"
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
          <span>FILMFEED 5-STEP SECURE VERIFICATION GATEWAY</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {currentMeta.title}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-lg mx-auto">
          {currentMeta.desc}
        </p>
      </div>

      {/* 5-Step Progress Indicator */}
      <div className="w-full mb-6">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`rounded-xl py-2 px-1 text-center transition-all border ${
                step === currentStep
                  ? "bg-indigo-600/30 border-indigo-500 text-white font-bold shadow-glow-brand"
                  : step < currentStep
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold"
                  : "bg-white/[0.02] border-white/10 text-gray-500"
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {step < currentStep ? (
                  <Check className="h-3 w-3 stroke-[3]" />
                ) : (
                  <span className="text-[10px] font-mono">#{step}</span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs block mt-0.5 truncate">
                {step === 5 ? "Unlock" : `Step ${step}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* TOP SPONSORED BANNER (High Viewability) */}
      <div className="w-full">
        <AdBanner label="Sponsored High-Speed Server Partner" />
      </div>

      {/* Content Summary Card */}
      <div className="w-full rounded-2xl border border-white/10 bg-[#080808] p-4 sm:p-5 mb-6 shadow-xl backdrop-blur-md">
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
              <div className="flex items-center gap-1.5 bg-black border border-white/10 px-2.5 py-1 rounded-lg text-xs">
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

              <div className="flex items-center gap-1.5 bg-black border border-white/10 px-2.5 py-1 rounded-lg text-xs">
                <span className="text-gray-400">Bot:</span>
                <span className="font-mono text-gray-300">+{targetBotPhone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VERIFICATION UNLOCK CARD */}
      <div className="w-full rounded-2xl border border-white/10 bg-[#080808] p-6 mb-6 shadow-2xl relative overflow-hidden text-center">
        {currentStep < 5 ? (
          /* Steps 1 to 4: Countdown and Continue */
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
                ? `Step ${currentStep} of 5 Ready!`
                : `Verifying Step ${currentStep} of 5...`}
            </h3>
            <p className="text-xs text-gray-400 mb-6 max-w-sm">
              {stepUnlocked
                ? "Click the button below to proceed to the next verification stage."
                : `Please wait ${timeLeft} seconds for security verification to complete.`}
            </p>

            <button
              onClick={advanceStep}
              disabled={!stepUnlocked}
              className={`w-full max-w-md flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-sm transition-all duration-300 ${
                stepUnlocked
                  ? "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-glow-brand cursor-pointer hover:scale-[1.02] active:scale-98"
                  : "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed opacity-60"
              }`}
            >
              {stepUnlocked ? (
                <>
                  <span>{currentMeta.action}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>WAITING {timeLeft}s FOR VERIFICATION</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Step 5: Final Unlock WhatsApp Dispatch */
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 animate-bounce">
                <Unlock className="h-8 w-8" />
              </div>
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              🎉 5-Step Verification Completed!
            </h3>
            <p className="text-xs text-gray-300 mb-6 max-w-md">
              Your security token has been authorized. Tap the button below to dispatch your request to the FilmFeed WhatsApp Cinema Group.
            </p>

            <button
              onClick={handleFinalDispatch}
              className="w-full max-w-md flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-400 text-white font-black text-base shadow-xl shadow-green-500/30 hover:scale-[1.02] active:scale-98 transition-all"
            >
              <ExternalLink className="h-5 w-5" />
              <span>SEND TO WHATSAPP GROUP</span>
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM SPONSORED BANNER */}
      <div className="w-full">
        <AdBanner label="Verified High-Speed Partner Server" />
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
