"use client";

import React, { useState } from "react";
import { Search, X, Film, Tv, Sparkles } from "lucide-react";

interface SearchBarProps {
  onSearchSubmit: (query: string) => void;
  initialQuery?: string;
  onCategorySelect?: (cat: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchSubmit,
  initialQuery = "",
  onCategorySelect,
  placeholder = "Search 4K Movies, TV Series, Anime...",
}) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearchSubmit(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    onSearchSubmit("");
  };

  const quickTags = [
    { label: "4K Movies", query: "movies", icon: Film },
    { label: "TV Series", query: "series", icon: Tv },
    { label: "Anime", query: "anime", icon: Sparkles },
    { label: "Action", query: "Action" },
    { label: "Horror", query: "Horror" },
    { label: "Sci-Fi", query: "Sci-Fi" },
    { label: "Korean Drama", query: "Korean Drama" },
    { label: "Comedy", query: "Comedy" },
  ];

  return (
    <div id="search-box" className="w-full space-y-2.5">
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center rounded-2xl bg-[#12141F]/80 border border-white/[0.08] backdrop-blur-xl transition-all focus-within:border-indigo-500/40 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)] shadow-inner">
          <div className="pointer-events-none pl-4 text-gray-400">
            <Search className="h-4 w-4" />
          </div>

          <input
            id="search-input-field"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent py-3 pl-3 pr-24 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
          />

          <div className="absolute inset-y-0 right-1.5 flex items-center gap-1.5 pr-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Horizontal scrollable quick chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
        {quickTags.map((tag, idx) => {
          const Icon = tag.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (["movies", "series", "anime"].includes(tag.query)) {
                  if (onCategorySelect) onCategorySelect(tag.query);
                } else {
                  setQuery(tag.query);
                  onSearchSubmit(tag.query);
                }
              }}
              className="shrink-0 flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#12141F]/60 px-3 py-1 text-[11px] font-medium text-gray-300 hover:border-indigo-500/40 hover:text-white transition-all active:scale-95"
            >
              {Icon && <Icon className="h-3 w-3 text-indigo-400" />}
              <span>{tag.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
