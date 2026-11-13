"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Eye, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { MovieSearchResult } from "@/lib/cinesubz";

interface HeroCarouselProps {
  items: MovieSearchResult[];
  autoPlayInterval?: number;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  items,
  autoPlayInterval = 3800,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const dragDistanceRef = useRef<number>(0);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Take top 8 movies for the 3D coverflow
  const heroList = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(0, 8);
  }, [items]);

  const count = heroList.length;

  // Track responsive screen width for optimal peek spacing
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const nextSlide = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const prevSlide = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const goToSlide = useCallback(
    (index: number) => {
      if (index === currentIndex || count <= 1) return;
      setCurrentIndex(index);
    },
    [currentIndex, count]
  );

  // Automatic infinite advancement
  useEffect(() => {
    if (count <= 1 || isPaused || isInteracting) return;

    const timer = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [count, isPaused, isInteracting, autoPlayInterval, nextSlide]);

  // Clean-up timeout on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  if (count === 0) return null;

  const activeMovie = heroList[currentIndex];

  // Title cleaner for cinematic typography
  const formatTitle = (raw: string) => {
    const cleaned =
      (raw || "")
        .replace(/\s*\(?\d{4}\)?\s*Sinhala.*$/i, "")
        .replace(/\|.*$/i, "")
        .replace(/[\u0D80-\u0DFF]+/g, "")
        .trim() || "Featured Cinema";
    const parts = cleaned.split(/[:–-]/);
    if (parts.length > 1) {
      return {
        main: parts[0].trim() || "Featured Cinema",
        sub: parts.slice(1).join(" ").trim(),
      };
    }
    return {
      main: cleaned,
      sub: activeMovie.quality || "4K Ultra HD Cinema",
    };
  };

  const titleInfo = formatTitle(activeMovie.title);

  // Compute rating for display (5-star IMDb scale)
  const numRating = parseFloat(activeMovie.rating || "");
  const rawRating = isNaN(numRating) || numRating <= 0 ? 8.6 : numRating;
  const displayRating = rawRating > 5 ? (rawRating / 2).toFixed(1) : rawRating.toFixed(1);

  // Compute viewer count display
  const viewerCount = useMemo(() => {
    const base = 210 + (currentIndex * 17) % 85;
    return `${base}K`;
  }, [currentIndex]);

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsInteracting(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    dragDistanceRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      dragDistanceRef.current = touchStartXRef.current - e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null) {
      const diff = dragDistanceRef.current;
      if (Math.abs(diff) > 35) {
        if (diff > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      dragDistanceRef.current = 0;
    }

    // Auto-resume after 3.2s of inactivity
    resumeTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 3200);
  };

  // Compute continuous 3D coverflow transform for each card
  const getCardTransform = (idx: number) => {
    let diff = idx - currentIndex;
    // Normalized cyclic shortest distance
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;

    const peekOffset = isMobile ? "54%" : "68%";
    const farOffset = isMobile ? "115%" : "125%";

    if (diff === 0) {
      // Active center card
      return {
        x: "0%",
        scale: 1,
        rotateY: 0,
        opacity: 1,
        filter: "blur(0px)",
        zIndex: 30,
        pointerEvents: "auto" as const,
        isCenter: true,
      };
    }

    if (diff === -1) {
      // Left peek card
      return {
        x: `-${peekOffset}`,
        scale: 0.82,
        rotateY: 26,
        opacity: 0.55,
        filter: "blur(1.5px)",
        zIndex: 20,
        pointerEvents: "auto" as const,
        isCenter: false,
      };
    }

    if (diff === 1) {
      // Right peek card
      return {
        x: peekOffset,
        scale: 0.82,
        rotateY: -26,
        opacity: 0.55,
        filter: "blur(1.5px)",
        zIndex: 20,
        pointerEvents: "auto" as const,
        isCenter: false,
      };
    }

    if (diff < -1) {
      // Exiting or preparing off-screen left
      return {
        x: `-${farOffset}`,
        scale: 0.65,
        rotateY: 35,
        opacity: 0,
        filter: "blur(4px)",
        zIndex: 10,
        pointerEvents: "none" as const,
        isCenter: false,
      };
    }

    // diff > 1: Exiting or preparing off-screen right
    return {
      x: farOffset,
      scale: 0.65,
      rotateY: -35,
      opacity: 0,
      filter: "blur(4px)",
      zIndex: 10,
      pointerEvents: "none" as const,
      isCenter: false,
    };
  };

  return (
    <section
      aria-label="Featured Cinema Coverflow"
      className="relative w-full py-2 sm:py-4 overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background glow matching active movie */}
      <div className="pointer-events-none absolute inset-0 -top-8 flex items-center justify-center opacity-30 blur-3xl">
        <div className="h-64 w-80 rounded-full bg-gradient-to-tr from-indigo-600/35 via-purple-600/20 to-blue-500/25" />
      </div>

      <div className="relative mx-auto flex flex-col items-center">
        {/* 3D Coverflow Stage */}
        <div
          className="relative flex h-[310px] sm:h-[400px] md:h-[450px] w-full max-w-3xl items-center justify-center px-4"
          style={{ perspective: 1200, transformStyle: "preserve-3d" }}
        >
          {heroList.map((movie, idx) => {
            const transform = getCardTransform(idx);
            let diff = idx - currentIndex;
            if (diff > count / 2) diff -= count;
            if (diff < -count / 2) diff += count;

            return (
              <motion.div
                key={movie.id}
                animate={{
                  x: transform.x,
                  scale: transform.scale,
                  rotateY: transform.rotateY,
                  opacity: transform.opacity,
                  filter: transform.filter,
                  zIndex: transform.zIndex,
                }}
                transition={{
                  type: "spring",
                  stiffness: 230,
                  damping: 25,
                  mass: 0.75,
                }}
                onClick={() => {
                  if (diff === -1) prevSlide();
                  else if (diff === 1) nextSlide();
                }}
                style={{
                  transformStyle: "preserve-3d",
                  pointerEvents: transform.pointerEvents,
                }}
                className={`absolute w-52 sm:w-68 md:w-80 aspect-[2/3] rounded-3xl overflow-hidden border cursor-pointer transition-shadow duration-300 ${
                  transform.isCenter
                    ? "border-white/25 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.95),0_0_40px_rgba(99,102,241,0.35)]"
                    : "border-white/10 shadow-[0_15px_35px_-8px_rgba(0,0,0,0.85)] hover:opacity-75"
                }`}
              >
                {transform.isCenter ? (
                  <Link
                    href={`/movie?url=${encodeURIComponent(movie.url)}`}
                    className="block h-full w-full relative group"
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="eager"
                    />

                    {/* Subtle ambient gradient vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-70 group-hover:opacity-40 transition-opacity" />

                    {/* Subtle Desktop Hover Play Indicator (clean, unobtrusive) */}
                    <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-2xl">
                        <Play className="h-6 w-6 fill-white text-white ml-0.5" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="relative h-full w-full">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Desktop Left / Right Navigation Chevrons */}
          <div className="hidden sm:flex pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-2 md:px-4 z-40">
            <button
              type="button"
              onClick={prevSlide}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#0B0D14]/75 border border-white/15 text-white backdrop-blur-md hover:bg-white hover:text-black hover:scale-110 active:scale-95 transition-all shadow-xl"
              aria-label="Previous movie"
            >
              <ChevronLeft className="h-6 w-6 -ml-0.5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#0B0D14]/75 border border-white/15 text-white backdrop-blur-md hover:bg-white hover:text-black hover:scale-110 active:scale-95 transition-all shadow-xl"
              aria-label="Next movie"
            >
              <ChevronRight className="h-6 w-6 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Movie Details below active card with AnimatePresence crossfade */}
        <div className="mt-3.5 sm:mt-5 text-center max-w-md px-4 space-y-1.5 z-20 min-h-[96px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMovie.id}
              initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex flex-col items-center space-y-1"
            >
              <Link
                href={`/movie?url=${encodeURIComponent(activeMovie.url)}`}
                className="inline-block group"
              >
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {titleInfo.main}
                </h2>
              </Link>

              {titleInfo.sub && (
                <p className="text-xs sm:text-sm text-gray-400 font-medium tracking-wide">
                  {titleInfo.sub}
                </p>
              )}

              {/* Rating & Viewers Pill matching Reference Image 1 & 2 */}
              <div className="pt-1 flex items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-full bg-[#131622]/90 border border-white/[0.08] px-4 py-1.5 text-xs backdrop-blur-md shadow-lg">
                  <div className="flex items-center gap-1.5 text-gold font-bold">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                    <span>Rate {displayRating}</span>
                  </div>
                  <span className="text-gray-600">|</span>
                  <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                    <span>{viewerCount} Viewers</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Animated Pagination Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-2.5">
            {heroList.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-7 bg-white shadow-[0_0_10px_rgba(255,255,255,0.85)]"
                      : "w-1.5 bg-white/25 hover:bg-white/50"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
