"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldAlert, LogIn, ArrowLeft, KeyRound } from "lucide-react";
import { getCurrentUser, syncUserWithServer, UserProfile } from "@/lib/userState";
import { AuthModal } from "@/components/AuthModal";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [adminKey, setAdminKey] = useState<string>("");
  const [isKeyAuthorized, setIsKeyAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const stored = getCurrentUser();
      setUser(stored);

      // Check if sessionStorage has admin key authorization
      const cachedKey = sessionStorage.getItem("filmfeed_admin_key");
      if (cachedKey) {
        setAdminKey(cachedKey);
        setIsKeyAuthorized(true);
      }

      try {
        const synced = await syncUserWithServer();
        if (synced) setUser(synced);
      } catch (e) {}

      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Test key against admin endpoint with x-admin-key header
      const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-key": adminKey },
      });

      if (!res.ok) {
        throw new Error("Invalid Administrator Secret Key");
      }

      setIsKeyAuthorized(true);
      sessionStorage.setItem("filmfeed_admin_key", adminKey);
    } catch (err: any) {
      setError(err.message || "Admin authorization failed");
    } finally {
      setLoading(false);
    }
  };

  const isAuthorized = isKeyAuthorized || user?.role === "admin";

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent mb-4" />
        <p className="text-xs font-mono text-gray-400">Verifying Admin RBAC Privileges...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/20 bg-neutral-950 p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-600/20 border border-red-500/40 text-red-400 font-black mb-4">
            <Lock className="h-8 w-8" />
          </div>

          <h1 className="text-xl font-black mb-1 text-white">FilmFeed SSS Admin Guard</h1>
          <p className="text-xs text-gray-400 mb-6">
            Access Restricted to Authorized Accounts (<code className="text-red-400">role === &quot;admin&quot;</code>)
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-bold">
              {error}
            </div>
          )}

          {/* Option 1: Admin Secret Key Entry */}
          <form onSubmit={handleKeySubmit} className="space-y-4 mb-6">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter Administrator Secret"
                className="w-full rounded-2xl border border-white/20 bg-black py-3 pl-10 pr-4 text-center text-sm font-mono tracking-widest text-white focus:border-white focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white py-3 px-4 text-xs font-black text-black hover:bg-gray-200 transition-all active:scale-95 shadow-md"
            >
              {loading ? "VERIFYING CREDENTIALS..." : "AUTHENTICATE AS ADMIN"}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink mx-3 text-[10px] text-gray-500 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          {/* Option 2: Sign In with Google Admin Account */}
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 py-3 px-4 text-xs font-bold text-white hover:bg-white/10 transition-all"
            >
              <LogIn className="h-4 w-4 text-emerald-400" />
              <span>
                {user ? `Signed in as ${user.email} (Not Admin)` : "Sign in with Google Admin Account"}
              </span>
            </button>

            <a
              href="/"
              className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors pt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Public Catalog</span>
            </a>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={(u) => {
            setUser(u);
            if (u.role === "admin") {
              setIsKeyAuthorized(true);
            }
          }}
          reason="Sign in with your FilmFeed Administrator Google account."
        />
      </div>
    );
  }

  return <>{children}</>;
};
