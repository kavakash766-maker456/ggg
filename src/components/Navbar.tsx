"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Tv,
  Crown,
  Search,
  LogIn,
  LogOut,
  Menu,
  X,
  Sparkles,
  Flame,
  Bell,
  Bookmark,
  Shield,
  User,
} from "lucide-react";
import { VipShareModal } from "@/components/VipShareModal";
import { AuthModal } from "@/components/AuthModal";
import { ProfileModal } from "@/components/ProfileModal";
import { VipCelebrationModal } from "@/components/VipCelebrationModal";
import { getCurrentUser, setCurrentUser, syncUserWithServer, UserProfile, isVipActive } from "@/lib/userState";

interface NavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSearchOpen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab = "movies",
  onTabChange,
  onSearchOpen,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setProfile] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

  useEffect(() => {
    setProfile(getCurrentUser());
    syncUserWithServer().then((u) => {
      if (u) setProfile(u);
    });

    const handleUserChange = () => setProfile(getCurrentUser());
    window.addEventListener("filmfeed-user-change", handleUserChange);

    // Live Polling every 15s to detect instant VIP activation by Admin
    const pollUser = async () => {
      const prev = getCurrentUser();
      const fresh = await syncUserWithServer();
      if (fresh) {
        setProfile(fresh);
        if (isVipActive(fresh)) {
          const celebrationKey = `filmfeed_celebrated_${fresh.id}_${fresh.vipPackage || "vip"}`;
          const alreadyCelebrated = typeof window !== "undefined" ? localStorage.getItem(celebrationKey) : "1";
          if ((prev && !isVipActive(prev)) || !alreadyCelebrated) {
            setIsCelebrationOpen(true);
            if (typeof window !== "undefined") {
              localStorage.setItem(celebrationKey, "1");
            }
          }
        }
      }
    };

    const interval = setInterval(pollUser, 15000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        pollUser();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let unsubAuth: (() => void) | null = null;
    if (typeof window !== "undefined") {
      import("@/lib/firebase").then(({ auth }) => {
        import("firebase/auth").then(({ onAuthStateChanged, getRedirectResult }) => {
          getRedirectResult(auth)
            .then(async (cred) => {
              if (cred && cred.user && cred.user.email) {
                const fbUser = cred.user;
                const userEmail = fbUser.email || "";
                const restored: UserProfile = {
                  id: "usr_" + fbUser.uid.substring(0, 10),
                  name: fbUser.displayName || (userEmail ? userEmail.split("@")[0] : "User"),
                  email: userEmail.toLowerCase(),
                  image: fbUser.photoURL || "",
                  role: "user",
                  deviceId: "dev_persisted",
                  coins: 50,
                  isVip: false,
                  createdAt: new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                };
                setCurrentUser(restored);
                setProfile(restored);
                syncUserWithServer().then((u) => {
                  if (u) setProfile(u);
                });
              }
            })
            .catch((err) => console.warn("getRedirectResult warning:", err));

          unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser && fbUser.email) {
              const current = getCurrentUser();
              if (!current) {
                const userEmail = fbUser.email || "";
                const restored: UserProfile = {
                  id: "usr_" + fbUser.uid.substring(0, 10),
                  name: fbUser.displayName || (userEmail ? userEmail.split("@")[0] : "User"),
                  email: userEmail.toLowerCase(),
                  image: fbUser.photoURL || "",
                  role: "user",
                  deviceId: "dev_persisted",
                  coins: 50,
                  isVip: false,
                  createdAt: new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                };
                setCurrentUser(restored);
                setProfile(restored);
                syncUserWithServer().then((u) => {
                  if (u) setProfile(u);
                });
              }
            }
          });
        });
      });
    }

    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener("open-auth-modal", handleOpenAuth);

    return () => {
      window.removeEventListener("open-auth-modal", handleOpenAuth);
      window.removeEventListener("filmfeed-user-change", handleUserChange);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (unsubAuth) unsubAuth();
    };
  }, []);

  const handleTabClick = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    if (pathname !== "/") {
      router.push(`/?tab=${tab}`);
    } else {
      window.dispatchEvent(
        new CustomEvent("filmfeed-navigate", { detail: { tab, view: tab === "mylist" ? "mylist" : "home" } })
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const handleSearchClick = () => {
    if (pathname !== "/") {
      router.push("/?search=1");
    } else {
      if (onSearchOpen) onSearchOpen();
      window.dispatchEvent(new CustomEvent("filmfeed-trigger-search"));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProfile(null);
    window.location.reload();
  };

  const isVip = Boolean(currentUser?.isVip || currentUser?.role === "vip" || currentUser?.role === "admin");

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-black/90 backdrop-blur-2xl transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Hamburger menu toggle (mobile/tablet) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Brand Logo matching Reference Image 2: "filmfeed •" */}
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white transition-opacity group-hover:opacity-90">
                film<span className="text-indigo-400">feed</span>
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleTabClick("movies")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "movies"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              Movies
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("series")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "series"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              TV Series
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("teledramas")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "teledramas"
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/30 shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Tv className="h-3.5 w-3.5 text-blue-400" />
              <span>Teledramas 📺</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("cartoons")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "cartoons"
                  ? "bg-amber-600/30 text-amber-300 border border-amber-500/30 shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Tv className="h-3.5 w-3.5 text-amber-400" />
              <span>Cartoons 🎨</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("anime")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "anime"
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Anime Hub</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabClick("mylist")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "mylist"
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>My List</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVipModalOpen(true)}
              className="ml-2 flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all shadow-glow-gold"
            >
              <Crown className="h-3.5 w-3.5 fill-amber-400" />
              <span>VIP Premiere</span>
            </button>
          </nav>

          {/* Right Action Icons (Search, Notification Bell, User Avatar) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={handleSearchClick}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
              aria-label="Search catalog"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Notification Bell matching Reference Image 2 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setHasUnreadNotification(!hasUnreadNotification)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {hasUnreadNotification && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[#0B0D14]" />
                )}
              </button>
            </div>

            {/* User Profile / Google Sign-in */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full p-1 hover:opacity-90 transition-opacity"
                aria-label="User account profile & history"
              >
                {currentUser.image ? (
                  <img
                    src={currentUser.image}
                    alt={currentUser.name}
                    className="h-8 w-8 rounded-full border border-white/20 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs border border-white/20">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {isVip && (
                  <Crown className="h-3.5 w-3.5 fill-amber-400 text-amber-400 hidden sm:block" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 active:scale-95 transition-all"
              >
                <LogIn className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer with Framer Motion slide-in */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="border-t border-white/[0.06] bg-[#0E1018]/95 backdrop-blur-2xl p-4 lg:hidden"
            >
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleTabClick("movies")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                    activeTab === "movies" ? "bg-white/[0.1] text-white" : "text-gray-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Film className="h-4 w-4" />
                    <span>Movies</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("series")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                    activeTab === "series" ? "bg-white/[0.1] text-white" : "text-gray-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Tv className="h-4 w-4" />
                    <span>TV Series</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("cartoons")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                    activeTab === "cartoons" ? "bg-amber-600/30 text-amber-300" : "text-gray-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Tv className="h-4 w-4 text-amber-400" />
                    <span>Sinhala Cartoons (Cloudflare R2)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("anime")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                    activeTab === "anime" ? "bg-indigo-600/30 text-indigo-300" : "text-gray-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span>Anime Hub (AnimeGG)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick("mylist")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-colors ${
                    activeTab === "mylist" ? "bg-white/[0.1] text-white" : "text-gray-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bookmark className="h-4 w-4" />
                    <span>My List Watchlist</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsVipModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black text-amber-400 bg-amber-500/10 border border-amber-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Crown className="h-4 w-4 fill-amber-400" />
                    <span>VIP Premiere Membership</span>
                  </div>
                </button>

                {currentUser?.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-red-400" />
                      <span>Admin Control Center</span>
                    </div>
                  </Link>
                )}

                {currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-indigo-400" />
                      <span>My Profile & Requests</span>
                    </div>
                  </button>
                )}

                {currentUser && (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-gray-400 hover:text-rose-400"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Modals */}
      <VipShareModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        onVipActivated={() => {
          setProfile(getCurrentUser());
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => setProfile(u)}
        reason="Sign in with your Google account to place requests and manage your VIP membership."
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenVipModal={() => setIsVipModalOpen(true)}
        onSignOut={handleLogout}
      />

      <VipCelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        user={currentUser}
      />
    </>
  );
};
