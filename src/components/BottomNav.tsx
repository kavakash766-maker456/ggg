"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, Bookmark, User, Flame } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { ProfileModal } from "@/components/ProfileModal";
import { VipShareModal } from "@/components/VipShareModal";
import { getCurrentUser, setCurrentUser, UserProfile } from "@/lib/userState";

export type BottomNavTab = "home" | "search" | "vault18" | "mylist" | "profile";

interface BottomNavProps {
  activeNavTab?: BottomNavTab;
  onNavTabChange?: (tab: BottomNavTab) => void;
  onOpenSearch?: () => void;
  onOpenMyList?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeNavTab = "home",
  onNavTabChange,
  onOpenSearch,
  onOpenMyList,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentTab, setCurrentTab] = useState<BottomNavTab>(activeNavTab);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/vault-18") {
      setCurrentTab("vault18");
    } else {
      setCurrentTab(activeNavTab);
    }
  }, [pathname, activeNavTab]);

  useEffect(() => {
    setUser(getCurrentUser());
    const handleUserChange = () => setUser(getCurrentUser());
    window.addEventListener("filmfeed-user-change", handleUserChange);
    return () => window.removeEventListener("filmfeed-user-change", handleUserChange);
  }, []);

  // Listen to tab changes triggered elsewhere
  useEffect(() => {
    const handleNav = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.view === "mylist" || detail?.tab === "mylist") {
        setCurrentTab("mylist");
      } else if (
        detail?.view === "home" ||
        detail?.tab === "movies" ||
        detail?.tab === "series" ||
        detail?.tab === "anime"
      ) {
        setCurrentTab("home");
      }
    };
    const handleOpenMyListEvent = () => setCurrentTab("mylist");
    const handleTriggerSearch = () => setCurrentTab("search");

    window.addEventListener("filmfeed-navigate", handleNav);
    window.addEventListener("filmfeed-open-mylist", handleOpenMyListEvent);
    window.addEventListener("filmfeed-trigger-search", handleTriggerSearch);
    return () => {
      window.removeEventListener("filmfeed-navigate", handleNav);
      window.removeEventListener("filmfeed-open-mylist", handleOpenMyListEvent);
      window.removeEventListener("filmfeed-trigger-search", handleTriggerSearch);
    };
  }, []);

  const handleTabClick = (tab: BottomNavTab) => {
    setCurrentTab(tab);
    if (onNavTabChange) onNavTabChange(tab);

    const isRoot = pathname === "/";

    if (tab === "home") {
      if (!isRoot) {
        router.push("/");
      } else {
        window.dispatchEvent(
          new CustomEvent("filmfeed-navigate", { detail: { tab: "movies", view: "home" } })
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (tab === "search") {
      if (!isRoot) {
        router.push("/?search=1");
      } else {
        if (onOpenSearch) onOpenSearch();
        window.dispatchEvent(new CustomEvent("filmfeed-trigger-search"));
      }
    } else if (tab === "vault18") {
      router.push("/vault-18");
    } else if (tab === "mylist") {
      if (!isRoot) {
        router.push("/?tab=mylist");
      } else {
        if (onOpenMyList) onOpenMyList();
        window.dispatchEvent(new CustomEvent("filmfeed-open-mylist"));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (tab === "profile") {
      const activeUser = getCurrentUser() || user;
      if (activeUser) {
        setIsProfileModalOpen(true);
      } else {
        setIsAuthModalOpen(true);
      }
    }
  };

  const navItems: { id: BottomNavTab; label: string; icon: any }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "vault18", label: "18+ Vault", icon: Flame },
    { id: "mylist", label: "My List", icon: Bookmark },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Floating Translucent Glass Dock (Mobile Only, Matching Reference Mockup) */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-4 inset-x-0 z-50 block lg:hidden pointer-events-none px-5"
      >
        <div className="mx-auto max-w-[340px] pointer-events-auto">
          <div className="relative flex items-center justify-around rounded-full border border-white/[0.12] bg-[#12141F]/95 px-2 py-2.5 backdrop-blur-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.95),0_0_20px_rgba(0,0,0,0.6)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className="relative flex flex-1 flex-col items-center justify-center py-1 rounded-full transition-colors group"
                  aria-label={item.label}
                >
                  {/* Subtle Top Emitter Accent Line for Active Tab (Matching Image 1 Screen 2) */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavSpotlight"
                      className="absolute -top-2.5 flex flex-col items-center pointer-events-none"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    >
                      <span className="h-[2.5px] w-6 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                    </motion.div>
                  )}

                  {/* Icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    {item.id === "profile" && user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name || "Profile"}
                        className={`h-5 w-5 rounded-full object-cover transition-all ${
                          isActive
                            ? "border-2 border-white ring-2 ring-white/20 scale-105"
                            : "border border-white/20 opacity-70"
                        }`}
                      />
                    ) : (
                      <Icon
                        className={`h-5 w-5 transition-all duration-200 ${
                          isActive
                            ? item.id === "vault18"
                              ? "text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] fill-rose-500"
                              : "text-white scale-110 drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                            : item.id === "vault18"
                            ? "text-rose-400/80 group-hover:text-rose-400"
                            : "text-gray-400 group-hover:text-gray-200"
                        } ${item.id === "mylist" && isActive ? "fill-white" : ""}`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenVipModal={() => {
          setIsProfileModalOpen(false);
          setIsVipModalOpen(true);
        }}
        onSignOut={() => {
          setCurrentUser(null);
          setUser(null);
          setIsProfileModalOpen(false);
        }}
      />

      {/* VIP Modal */}
      <VipShareModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
      />

      {/* Profile / Sign-in Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          setIsAuthModalOpen(false);
        }}
        reason="Sign in with Google to sync your VIP membership, daily requests, and My List."
      />
    </>
  );
};
