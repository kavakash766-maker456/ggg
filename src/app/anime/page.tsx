"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import { SearchBar } from "@/components/SearchBar";
import { AdBanner } from "@/components/AdBanner";
import { MovieSearchResult } from "@/lib/cinesubz";
import { Sparkles, Play, Star, ChevronLeft, ChevronRight, Film, Filter } from "lucide-react";

const ANIME_GENRES = [
  "All",
  "Action",
  "Adventure",
  "Fantasy",
  "Magic",
  "Shounen",
  "Supernatural",
  "Mystery",
  "Comedy",
  "Drama",
];

export default function AnimeHubPage() {
  const [animeList, setAnimeList] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const fetchAnime = useCallback(async (page: number = 1, genre: string = "All", query: string = "") => {
    setLoading(true);
    try {
      let endpoint = `/api/anime?type=series&page=${page}&limit=24`;
      if (query.trim()) {
        endpoint = `/api/anime?q=${encodeURIComponent(query.trim())}`;
      } else if (genre !== "All") {
        endpoint += `&genre=${encodeURIComponent(genre)}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();
      setAnimeList(data.anime || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to fetch anime:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnime(1, selectedGenre, searchQuery);
  }, [fetchAnime, selectedGenre, searchQuery]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setIsSearchActive(Boolean(q.trim()));
    fetchAnime(1, selectedGenre, q);
  };

  const handleGenreSelect = (g: string) => {
    setSelectedGenre(g);
    setSearchQuery("");
    setIsSearchActive(false);
    fetchAnime(1, g, "");
  };

  // Featured top anime for hero card
  const featuredAnime = animeList.length > 0 ? animeList[0] : null;

  return (
    <div className="min-h-screen bg-[#0A0B10] text-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* Anime Banner Header */}
        <div className="relative rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-[#111322] to-[#0D0F18] p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>AnimeGG High-Speed Direct Engine</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Anime Hub <span className="text-indigo-400">• Full Seasons & EPs</span>
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Explore high-octane anime series streaming in 1080p FHD master quality with instant single-click batch requests.
            </p>
          </div>
        </div>

        {/* Top Search Bar */}
        <SearchBar
          onSearchSubmit={handleSearch}
          initialQuery={searchQuery}
        />

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {ANIME_GENRES.map((g) => {
            const isActive = selectedGenre === g && !isSearchActive;
            return (
              <button
                key={g}
                type="button"
                onClick={() => handleGenreSelect(g)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-glow-brand"
                    : "bg-[#161824] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>

        {/* Top Sponsored Ad */}
        <AdBanner position="top" />

        {/* Anime Catalog Grid */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  {isSearchActive
                    ? `Anime Results for "${searchQuery}"`
                    : selectedGenre === "All"
                    ? "Popular Anime Catalog"
                    : `${selectedGenre} Anime Series`}
                </h2>
                <p className="text-[11px] text-gray-400">
                  {animeList.length} releases ready for episode viewing & requests
                </p>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="text-xs text-gray-400 font-mono">
                Page {currentPage}/{totalPages}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="aspect-[2/3] w-full rounded-2xl bg-[#161824]" />
                  <div className="h-3 w-3/4 rounded bg-[#161824]" />
                  <div className="h-2.5 w-1/2 rounded bg-[#161824]" />
                </div>
              ))}
            </div>
          ) : animeList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
              {animeList.map((item) => (
                <MovieCard key={item.id} movie={item} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-gray-400">
              <Film className="mx-auto h-12 w-12 text-gray-600 mb-3" />
              <p className="text-sm font-semibold text-white">No Anime Series Found</p>
              <p className="text-xs text-gray-400 mt-1">Try another search keyword or select All genres.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  if (currentPage > 1) {
                    fetchAnime(currentPage - 1, selectedGenre, searchQuery);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#161824] px-4 py-2 text-xs font-bold text-gray-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="px-3 text-xs font-mono text-gray-400">
                {currentPage} of {totalPages}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  if (currentPage < totalPages) {
                    fetchAnime(currentPage + 1, selectedGenre, searchQuery);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#161824] px-4 py-2 text-xs font-bold text-gray-300 hover:text-white disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
