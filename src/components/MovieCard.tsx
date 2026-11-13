"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Play, Bookmark, Film, Tv, Sparkles } from "lucide-react";
import { MovieSearchResult } from "@/lib/cinesubz";
import { isItemInMyList, toggleMyListItem } from "@/lib/userState";

interface MovieCardProps {
  movie: MovieSearchResult;
  onBookmarkChange?: () => void;
  priority?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onBookmarkChange,
  priority = false,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(movie.poster || "");
  const [hasError, setHasError] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    setImgSrc(movie.poster || "");
    setHasError(false);
    setIsBookmarked(isItemInMyList(movie.url || movie.id));
  }, [movie.poster, movie.url, movie.id]);

  useEffect(() => {
    const handleListChange = () => {
      setIsBookmarked(isItemInMyList(movie.url || movie.id));
    };
    window.addEventListener("filmfeed-mylist-change", handleListChange);
    return () => window.removeEventListener("filmfeed-mylist-change", handleListChange);
  }, [movie.url, movie.id]);

  const isSeries =
    movie.type === "series" ||
    (movie.url && (movie.url.includes("/tvshows/") || movie.url.includes("series"))) ||
    movie.category === "series" ||
    movie.category === "anime-series";

  const isAnime =
    movie.category?.includes("anime") ||
    movie.url?.includes("anime") ||
    movie.url?.includes("animegg");

  // Clean English title (strip any leftover Sinhala, pipes, or year clutter)
  const rawTitle = movie.title || "";
  const strippedTitle = rawTitle
    .replace(/\s*\(?\d{4}\)?\s*Sinhala.*$/i, "")
    .replace(/\|.*$/i, "")
    .replace(/[\u0D80-\u0DFF]+/g, "")
    .trim();
  const cleanTitle = strippedTitle || "Featured Cinema";

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleMyListItem({
      id: movie.id,
      title: cleanTitle,
      url: movie.url,
      poster: movie.poster,
      rating: movie.rating,
      year: movie.year,
      quality: movie.quality,
      type: isSeries ? "series" : "movie",
      category: movie.category,
    });
    setIsBookmarked(newState);
    if (onBookmarkChange) onBookmarkChange();
  };

  // Convert numeric rating (e.g. 8.7/10 or 4.3) to 5-star scale display
  const rawRating = parseFloat(movie.rating || "8.4");
  const starScore = rawRating > 5 ? (rawRating / 2).toFixed(1) : rawRating.toFixed(1);
  const starValue = parseFloat(starScore);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group relative flex flex-col"
    >
      {/* Poster Card Container matching Reference Mockup */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[#131520] border border-white/[0.08] shadow-md group-hover:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.2)] group-hover:border-white/20 transition-all duration-300">
        <Link
          href={`/movie?url=${encodeURIComponent(movie.url)}`}
          className="relative block h-full w-full overflow-hidden"
        >
          {imgSrc && !hasError ? (
            <img
              src={imgSrc}
              alt={cleanTitle}
              referrerPolicy="no-referrer"
              onError={() => setHasError(true)}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-106"
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#1C2030] to-[#12141F] text-gray-400">
              {isAnime ? (
                <Sparkles className="h-8 w-8 mb-2 text-indigo-400" />
              ) : isSeries ? (
                <Tv className="h-8 w-8 mb-2 text-blue-400" />
              ) : (
                <Film className="h-8 w-8 mb-2 text-gray-400" />
              )}
              <span className="text-[11px] font-bold line-clamp-2 text-gray-200">
                {cleanTitle}
              </span>
            </div>
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B10]/85 via-black/10 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

          {/* Top Tag Badges */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <span className="rounded-full bg-black/70 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-200 border border-white/10 shadow-sm">
              {isAnime ? "Anime" : isSeries ? "Series" : (movie.quality || "4K UHD")}
            </span>
          </div>

          {/* Play Icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-90">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 backdrop-blur-md border border-white/40 text-white shadow-xl shadow-black/60">
              <Play className="h-5 w-5 fill-white ml-0.5" />
            </div>
          </div>
        </Link>
      </div>

      {/* Info Section under Card (Matching Reference Image 2: Title, Star Rating, Bookmark Icon) */}
      <div className="pt-2 px-0.5 flex items-start justify-between gap-1.5">
        <div className="flex-1 min-w-0">
          <Link href={`/movie?url=${encodeURIComponent(movie.url)}`}>
            <h3 className="text-xs sm:text-[13px] font-bold text-gray-200 line-clamp-1 group-hover:text-white transition-colors">
              {cleanTitle}
            </h3>
          </Link>

          {/* Star Rating & Value */}
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center text-gold">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 ${
                    i < Math.floor(starValue)
                      ? "fill-gold text-gold"
                      : i < starValue
                      ? "fill-gold/50 text-gold"
                      : "text-gray-700"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-gray-300 ml-0.5">
              {starScore}
            </span>
            {movie.year && (
              <span className="text-[10px] text-gray-500 font-mono ml-1">
                • {movie.year}
              </span>
            )}
          </div>
        </div>

        {/* Bookmark Icon Button on the right (matching Mockup Screen 2) */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          aria-label={isBookmarked ? "Remove from My List" : "Save to My List"}
          className={`p-1.5 rounded-lg transition-all active:scale-90 ${
            isBookmarked
              ? "text-rose-400 bg-rose-500/15 border border-rose-500/30"
              : "text-gray-400 hover:text-white hover:bg-white/[0.08]"
          }`}
        >
          <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-rose-400" : ""}`} />
        </button>
      </div>
    </motion.div>
  );
};
