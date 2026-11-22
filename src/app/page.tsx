"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MovieCard } from "@/components/MovieCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { SearchBar } from "@/components/SearchBar";
import { AdBanner } from "@/components/AdBanner";
import { VipShareModal } from "@/components/VipShareModal";
import { MovieSearchResult } from "@/lib/cinesubz";
import { getMyList, clearMyList, MyListItem, getCurrentUser, UserProfile } from "@/lib/userState";
import {
  Film,
  Tv,
  Crown,
  Play,
  Flame,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Trash2,
  Star,
  Eye,
  TrendingUp,
  Search,
  Calendar,
  ThumbsUp,
  Award,
  X,
} from "lucide-react";

export type ContentTab = "movies" | "series" | "teledramas" | "cartoons" | "anime" | "mylist";
export type FilterPill = "Popular" | "Trending" | "Recommendation" | "Top Rated" | "Coming Soon";

const CATEGORY_PILLS: FilterPill[] = [
  "Popular",
  "Trending",
  "Recommendation",
  "Top Rated",
  "Coming Soon",
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ContentTab>("movies");
  const [activePill, setActivePill] = useState<FilterPill>("Popular");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [movies, setMovies] = useState<MovieSearchResult[]>([]);
  const [seriesPreview, setSeriesPreview] = useState<MovieSearchResult[]>([]);
  const [myListItems, setMyListItems] = useState<MyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Sync user state & My List
  const refreshMyList = useCallback(() => {
    setMyListItems(getMyList());
  }, []);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    refreshMyList();

    const handleListChange = () => refreshMyList();
    const handleUserChange = () => setCurrentUser(getCurrentUser());

    window.addEventListener("filmfeed-mylist-change", handleListChange);
    window.addEventListener("filmfeed-user-change", handleUserChange);
    return () => {
      window.removeEventListener("filmfeed-mylist-change", handleListChange);
      window.removeEventListener("filmfeed-user-change", handleUserChange);
    };
  }, [refreshMyList]);

  // Fetch items for current tab
  const fetchItems = useCallback(
    async (tab: ContentTab, page: number = 1, pill: FilterPill = "Popular") => {
      if (tab === "mylist") {
        setLoading(false);
        refreshMyList();
        return;
      }

      setLoading(true);
      setSearchActive(false);
      setSearchQuery("");

      try {
        let endpoint = "";
        if (tab === "movies") {
          endpoint = `/api/latest?page=${page}`;
        } else if (tab === "series") {
          endpoint = `/api/series?page=${page}`;
        } else if (tab === "teledramas") {
          endpoint = `/api/teledramas?page=${page}&limit=24`;
        } else if (tab === "cartoons") {
          endpoint = `/api/cartoons?page=${page}&limit=24`;
        } else if (tab === "anime") {
          endpoint = `/api/anime?type=series&page=${page}`;
        }

        const res = await fetch(endpoint);
        const data = await res.json();

        let items: MovieSearchResult[] = [];
        let totalP = 1;

        if (tab === "movies") {
          items = data.movies || [];
          totalP = data.totalPages || 50;
        } else if (tab === "series") {
          items = data.series || [];
          totalP = data.totalPages || 30;
        } else if (tab === "teledramas") {
          items = data.teledramas || [];
          totalP = data.totalPages || 2;
        } else if (tab === "cartoons") {
          items = data.cartoons || [];
          totalP = data.totalPages || 9;
        } else if (tab === "anime") {
          items = data.anime || [];
          totalP = data.totalPages || 20;
        }

        // Pill-based sorting/filtering
        if (pill === "Top Rated" && items.length > 0) {
          items = [...items].sort(
            (a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0")
          );
        } else if (pill === "Trending" && items.length > 0) {
          items = [...items].reverse();
        }

        setMovies(items);
        setTotalPages(totalP);
        setCurrentPage(page);
      } catch (e) {
        console.error("Failed to load content:", e);
      } finally {
        setLoading(false);
      }
    },
    [refreshMyList]
  );

  // Preload series preview for multi-section homepage experience
  useEffect(() => {
    fetch("/api/series?page=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.series) setSeriesPreview(data.series.slice(0, 6));
      })
      .catch((err) => console.warn("Series preview load error", err));
  }, []);

  // Read URL query params on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ContentTab;
      const pageParam = parseInt(params.get("page") || "1", 10);
      const searchParam = params.get("search");

      const targetTab: ContentTab =
        tabParam === "series" || tabParam === "cartoons" || tabParam === "anime" || tabParam === "mylist"
          ? tabParam
          : "movies";
      const targetPage = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

      setActiveTab(targetTab);
      setCurrentPage(targetPage);
      fetchItems(targetTab, targetPage, activePill);

      if (searchParam === "1") {
        setIsSearchExpanded(true);
        setTimeout(() => {
          const input = document.getElementById("search-input-field");
          if (input) input.focus();
        }, 150);
      }
    }
  }, [fetchItems, activePill]);

  // Handle Tab Change
  const handleTabChange = (newTab: ContentTab) => {
    setActiveTab(newTab);
    setCurrentPage(1);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      url.searchParams.set("page", "1");
      window.history.pushState({}, "", url.toString());
    }

    fetchItems(newTab, 1, activePill);
  };

  // Listen for global navbar & bottom nav events
  useEffect(() => {
    const handleNav = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab === "movies" || detail?.tab === "series" || detail?.tab === "cartoons" || detail?.tab === "anime") {
        handleTabChange(detail.tab);
      }
    };
    const handleOpenMyList = () => {
      handleTabChange("mylist");
    };
    const handleTriggerSearch = () => {
      setIsSearchExpanded(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        const input = document.getElementById("search-input-field");
        if (input) input.focus();
      }, 100);
    };

    window.addEventListener("filmfeed-navigate", handleNav);
    window.addEventListener("filmfeed-open-mylist", handleOpenMyList);
    window.addEventListener("filmfeed-trigger-search", handleTriggerSearch);
    return () => {
      window.removeEventListener("filmfeed-navigate", handleNav);
      window.removeEventListener("filmfeed-open-mylist", handleOpenMyList);
      window.removeEventListener("filmfeed-trigger-search", handleTriggerSearch);
    };
  }, []);

  const handlePillChange = (pill: FilterPill) => {
    setActivePill(pill);
    if (movies.length > 0) {
      let sorted = [...movies];
      if (pill === "Top Rated") {
        sorted.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
      } else if (pill === "Trending") {
        sorted.reverse();
      }
      setMovies(sorted);
    }
  };

  const handleSearch = async (q: string) => {
    if (!q || !q.trim()) {
      fetchItems(activeTab, currentPage, activePill);
      return;
    }
    setSearchQuery(q);
    setSearchActive(true);
    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&tab=${activeTab}`);
      const data = await res.json();
      setMovies(data.results || []);
      setTotalPages(1);
      setCurrentPage(1);
    } catch (e) {
      console.error("Search error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearMyList = () => {
    if (confirm("Are you sure you want to clear your saved list?")) {
      clearMyList();
      setMyListItems([]);
    }
  };

  // Distinct section partitions for rich visual hierarchy
  const heroMovies = useMemo(() => {
    return movies.slice(0, 8);
  }, [movies]);

  // 1. "May you like" (curated cinema directly under hero matching Reference Image 2)
  const mayYouLikeMovies = useMemo(() => {
    return movies.slice(0, 6);
  }, [movies]);

  // 2. Trending Movies (#1 to #8 snap rail)
  const trendingMovies = useMemo(() => {
    return movies.slice(2, 10);
  }, [movies]);

  // 3. Popular Movies (high viewer interest)
  const popularMovies = useMemo(() => {
    return movies.slice(6, 12);
  }, [movies]);

  // 4. Recommended For You (curated with 98% match)
  const recommendedMovies = useMemo(() => {
    return movies.slice(4, 10);
  }, [movies]);

  // 5. Top Rated Masterpieces (highest IMDb scores)
  const topRatedMovies = useMemo(() => {
    return [...movies]
      .sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"))
      .slice(0, 6);
  }, [movies]);

  // 6. Upcoming Cinema / Coming Soon
  const upcomingMovies = useMemo(() => {
    return movies.slice(10, 16);
  }, [movies]);

  return (
    <div className="min-h-screen bg-[#0A0B10] text-white pb-32">
      {/* Ambient background glow elements */}
      <div className="fixed top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-950/20 via-transparent to-transparent pointer-events-none -z-10" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 space-y-6">
        {/* ========================================================================= */}
        {/* VIEW A: MY LIST SCREEN (Directly matching Screen 2 of Reference Image 2) */}
        {/* ========================================================================= */}
        {activeTab === "mylist" ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Screen 2 Top Bar: "My List" & Trash/Delete Icon */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/10 text-white shadow-sm">
                  <Bookmark className="h-5 w-5 fill-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">My List</h1>
                  <p className="text-xs text-gray-400">
                    {myListItems.length} {myListItems.length === 1 ? "saved release" : "saved releases"}
                  </p>
                </div>
              </div>

              {myListItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearMyList}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-400 p-2.5 rounded-xl hover:bg-white/[0.04] active:scale-95 transition-all"
                  title="Clear all saved titles"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear List</span>
                </button>
              )}
            </div>

            {/* My List 2-Column Grid on Mobile / 4-6 Columns on Desktop (Directly Matching Screen 2 Mockup!) */}
            {myListItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                {myListItems.map((item) => (
                  <MovieCard
                    key={item.id}
                    movie={{
                      id: item.id,
                      title: item.title,
                      url: item.url,
                      poster: item.poster,
                      rating: item.rating,
                      year: item.year,
                      quality: item.quality,
                      type: item.type,
                      category: item.category,
                    }}
                    onBookmarkChange={refreshMyList}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-18 w-18 items-center justify-center rounded-3xl bg-white/[0.04] border border-white/10 text-gray-500 mb-4 p-4 shadow-xl">
                  <Bookmark className="h-9 w-9 text-gray-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Your Watchlist is Empty</h3>
                <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
                  Save movies, TV series, or anime by tapping the bookmark icon on any poster to curate your personal collection.
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange("movies")}
                  className="rounded-2xl bg-white px-6 py-3 text-xs font-black text-black hover:bg-gray-200 active:scale-95 transition-all shadow-glow-white"
                >
                  Browse Cinema Catalog
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: MAIN CINEMA DISCOVERY HUB (Directly matching Screen 1 of Mockup) */
          /* ========================================================================= */
          <div className="space-y-7">
            {/* 1. Category Pills Header (Matching Reference Image 2: Popular, Trending, Recommendation, Coming Soon) */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-0.5">
              <div className="flex items-center gap-2 shrink-0">
                {CATEGORY_PILLS.map((pill) => {
                  const isActive = activePill === pill;
                  return (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => handlePillChange(pill)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all shrink-0 active:scale-95 ${
                        isActive
                          ? "bg-[#1A1D2B] text-white border border-white/20 shadow-sm"
                          : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {pill}
                    </button>
                  );
                })}
              </div>

              {/* Quick Content Switcher (Movies, TV Series, Anime) */}
              <div className="flex items-center gap-1 bg-[#131520]/80 p-1 rounded-2xl border border-white/[0.08] shrink-0">
                <button
                  type="button"
                  onClick={() => handleTabChange("movies")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "movies"
                      ? "bg-white/[0.12] text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Movies
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("series")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "series"
                      ? "bg-white/[0.12] text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  TV Series
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("teledramas")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTab === "teledramas"
                      ? "bg-blue-600/30 text-blue-300 border border-blue-500/30 shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Tv className="h-3 w-3 text-blue-400" />
                  <span>Teledramas 📺</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("cartoons")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTab === "cartoons"
                      ? "bg-amber-600/30 text-amber-300 border border-amber-500/30 shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Tv className="h-3 w-3 text-amber-400" />
                  <span>Cartoons 🎨</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("anime")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    activeTab === "anime"
                      ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Anime</span>
                </button>
              </div>
            </div>

            {/* Optional Collapsible Search Bar (Summonable via Search icon or search active) */}
            <AnimatePresence>
              {(isSearchExpanded || searchActive) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full pt-1 relative"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <SearchBar
                        onSearchSubmit={handleSearch}
                        initialQuery={searchQuery}
                        onCategorySelect={(cat) => {
                          if (cat === "series" || cat === "movies" || cat === "anime") {
                            handleTabChange(cat);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchExpanded(false);
                        if (searchActive) {
                          setSearchActive(false);
                          setSearchQuery("");
                          fetchItems(activeTab, 1, activePill);
                        }
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] text-gray-300 hover:text-white transition-colors border border-white/10 shrink-0"
                      aria-label="Close search"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ========================================================================= */}
            {/* 2. AUTOMATIC CINEMATIC FEATURED MOVIE CAROUSEL (HIGHEST PRIORITY) */}
            {/* ========================================================================= */}
            {!searchActive && heroMovies.length > 0 && !loading && currentPage === 1 && (
              <HeroCarousel items={heroMovies} autoPlayInterval={3800} />
            )}

            {/* ========================================================================= */}
            {/* SEARCH RESULTS VIEW (when search is active) */}
            {/* ========================================================================= */}
            {searchActive && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-white">
                      <Search className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        Search Results for &quot;{searchQuery}&quot;
                      </h2>
                      <p className="text-xs text-gray-400">Found {movies.length} cinema matches</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchActive(false);
                      setSearchQuery("");
                      fetchItems(activeTab, 1, activePill);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-xl hover:bg-white/[0.04]"
                  >
                    Clear Search
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="aspect-[2/3] w-full rounded-2xl bg-[#141624]" />
                        <div className="h-3 w-3/4 rounded bg-[#141624]" />
                        <div className="h-2.5 w-1/2 rounded bg-[#141624]" />
                      </div>
                    ))}
                  </div>
                ) : movies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                    {movies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-gray-400">
                    <Film className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                    <p className="text-base font-bold text-white">No releases matched your search</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try another keyword or switch category to TV Series or Anime.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* MULTI-SECTION HOMEPAGE (when not searching) */}
            {/* ========================================================================= */}
            {!searchActive && (
              <>
                {/* SECTION 1: "May you like" (Directly matching Screen 1 of Mockup under hero) */}
                {mayYouLikeMovies.length > 0 && currentPage === 1 && (
                  <section className="space-y-3.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          May you like
                        </h3>
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">Curated Cinema</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                      {mayYouLikeMovies.map((movie) => (
                        <MovieCard key={`may-${movie.id}`} movie={movie} />
                      ))}
                    </div>
                  </section>
                )}

                {/* SECTION 2: SPONSORED PARTNER BANNER */}
                <section className="py-2">
                  <AdBanner position="top" />
                </section>

                {/* SECTION 3: TRENDING CINEMA (With Ranking Badges #1 to #8!) */}
                {trendingMovies.length > 0 && currentPage === 1 && (
                  <section className="space-y-3.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          Trending Now in Cinema
                        </h3>
                      </div>
                      <span className="text-[11px] text-amber-400 font-bold">Top 8 Trending</span>
                    </div>

                    {/* Horizontal Snap-Scroll Slider for Trending with metallic ranking badges */}
                    <div className="flex items-center gap-3.5 overflow-x-auto pb-3 no-scrollbar scroll-smooth">
                      {trendingMovies.map((movie, index) => {
                        const rankColors =
                          index === 0
                            ? "from-amber-400 to-amber-600 text-black shadow-amber-500/30"
                            : index === 1
                            ? "from-slate-200 to-slate-400 text-black shadow-slate-400/30"
                            : index === 2
                            ? "from-amber-700 to-amber-800 text-white shadow-amber-900/30"
                            : "from-indigo-900 to-[#121422] text-indigo-300 border border-white/10";

                        return (
                          <div
                            key={`trend-${movie.id}`}
                            className="relative shrink-0 w-36 sm:w-44"
                          >
                            {/* Ranking Badge Overlay */}
                            <div
                              className={`absolute -top-1.5 -left-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr ${rankColors} text-xs font-black shadow-lg`}
                            >
                              #{index + 1}
                            </div>
                            <MovieCard movie={movie} />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* SECTION 4: POPULAR MOVIES */}
                {popularMovies.length > 0 && currentPage === 1 && (
                  <section className="space-y-3.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          Popular Cinema Hits
                        </h3>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium">Most Streamed</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                      {popularMovies.map((movie) => (
                        <MovieCard key={`pop-${movie.id}`} movie={movie} />
                      ))}
                    </div>
                  </section>
                )}

                {/* SECTION 5: RECOMMENDED FOR YOU */}
                {recommendedMovies.length > 0 && currentPage === 1 && (
                  <section className="space-y-3.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-indigo-400" />
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          Recommended For You
                        </h3>
                      </div>
                      <span className="text-[11px] text-indigo-300 font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                        98% Match
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                      {recommendedMovies.map((movie) => (
                        <MovieCard key={`rec-${movie.id}`} movie={movie} />
                      ))}
                    </div>
                  </section>
                )}

                {/* SECTION 6: TOP RATED MASTERPIECES */}
                {topRatedMovies.length > 0 && currentPage === 1 && (
                  <section className="space-y-3.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-gold text-gold" />
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          Top Rated Masterpieces
                        </h3>
                      </div>
                      <span className="text-[11px] text-gold font-bold">IMDb 8.0+</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                      {topRatedMovies.map((movie) => (
                        <MovieCard key={`top-${movie.id}`} movie={movie} />
                      ))}
                    </div>
                  </section>
                )}

                {/* SECTION 7: LATEST TV SERIES PREVIEW (When in Movies tab) */}
                {activeTab === "movies" && seriesPreview.length > 0 && currentPage === 1 && (
                  <section className="space-y-3.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tv className="h-4 w-4 text-blue-400" />
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          Full Season TV Series
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTabChange("series")}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                      >
                        <span>View All Series</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                      {seriesPreview.map((series) => (
                        <MovieCard key={`series-prev-${series.id}`} movie={series} />
                      ))}
                    </div>
                  </section>
                )}

                {/* SECTION 8: UPCOMING CINEMA / COMING SOON */}
                {upcomingMovies.length > 0 && currentPage === 1 && (
                  <section className="space-y-3.5 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          Upcoming Cinema &amp; Coming Soon
                        </h3>
                      </div>
                      <span className="text-[11px] text-purple-400 font-medium">Anticipated Releases</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                      {upcomingMovies.map((movie) => (
                        <MovieCard key={`up-${movie.id}`} movie={movie} />
                      ))}
                    </div>
                  </section>
                )}

                {/* SECTION 9: FULL CINEMA CATALOG & PAGINATION */}
                <section className="space-y-4 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-white">
                        {activeTab === "anime" ? (
                          <Sparkles className="h-4 w-4 text-indigo-400" />
                        ) : activeTab === "cartoons" ? (
                          <Tv className="h-4 w-4 text-amber-400" />
                        ) : activeTab === "teledramas" ? (
                          <Tv className="h-4 w-4 text-blue-400" />
                        ) : activeTab === "series" ? (
                          <Tv className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Film className="h-4 w-4 text-gray-300" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-white">
                          {activeTab === "anime"
                            ? "AnimeGG Official Releases"
                            : activeTab === "cartoons"
                            ? "Sinhala Dubbed Cartoons (Cloudflare R2 Direct)"
                            : activeTab === "teledramas"
                            ? "Sinhala Teledramas (Col3neg Official Broadcast)"
                            : activeTab === "series"
                            ? "TV Series Catalog"
                            : "Full Cinema Catalog"}
                        </h2>
                        <p className="text-[11px] text-gray-400">
                          {movies.length} releases available • 1080p &amp; 4K UHD
                        </p>
                      </div>
                    </div>

                    {totalPages > 1 && (
                      <div className="text-xs text-gray-400 font-mono">
                        Page {currentPage}/{totalPages}
                      </div>
                    )}
                  </div>

                  {/* Responsive Grid: 2 columns on Mobile, 4-6 on Desktop */}
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="animate-pulse space-y-2">
                          <div className="aspect-[2/3] w-full rounded-2xl bg-[#141624]" />
                          <div className="h-3 w-3/4 rounded bg-[#141624]" />
                          <div className="h-2.5 w-1/2 rounded bg-[#141624]" />
                        </div>
                      ))}
                    </div>
                  ) : movies.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                      {(currentPage === 1 ? movies.slice(6) : movies).map((movie) => (
                        <MovieCard key={`cat-${movie.id}`} movie={movie} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-gray-400">
                      <Film className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                      <p className="text-sm font-semibold text-white">No releases found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try another category tab or check back shortly.
                      </p>
                    </div>
                  )}

                  {/* SECTION 9.5: BOTTOM AD BANNER */}
                  <div className="pt-4">
                    <AdBanner position="bottom" label="Fast Download Mirror" />
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-6">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => {
                          if (currentPage > 1) {
                            setCurrentPage((p) => p - 1);
                            fetchItems(activeTab, currentPage - 1, activePill);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#141624] px-4 py-2.5 text-xs font-bold text-gray-300 hover:text-white disabled:opacity-30 active:scale-95 transition-all"
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
                            setCurrentPage((p) => p + 1);
                            fetchItems(activeTab, currentPage + 1, activePill);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#141624] px-4 py-2.5 text-xs font-bold text-gray-300 hover:text-white disabled:opacity-30 active:scale-95 transition-all"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </main>

      {/* VIP Upgrade Share Modal */}
      <VipShareModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        onVipActivated={() => {
          setCurrentUser(getCurrentUser());
        }}
      />
    </div>
  );
}
