"use client";

import React, { useState } from "react";
import { Laptop, Smartphone, Monitor, Trash2, X, ShieldCheck, CheckCircle2 } from "lucide-react";
import { UserProfile, UserSession } from "@/lib/userState";
import { getDeviceIdSync } from "@/lib/deviceFingerprint";

interface DeviceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSessionsUpdated?: (updatedUser: UserProfile) => void;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSessionsUpdated,
}) => {
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const currentDeviceId = getDeviceIdSync();

  if (!isOpen || !currentUser) return null;

  const sessions: UserSession[] = Array.isArray(currentUser.sessions) ? currentUser.sessions : [];

  const handleRevokeSession = async (sessionId: string) => {
    setLoadingSessionId(sessionId);
    try {
      const res = await fetch("/api/user/session", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, sessionId }),
      });

      if (res.ok) {
        const updatedSessions = sessions.filter((s) => s.sessionId !== sessionId);
        const updatedUser = { ...currentUser, sessions: updatedSessions };
        if (onSessionsUpdated) onSessionsUpdated(updatedUser);
      }
    } catch (e) {
      console.error("Failed to revoke session", e);
    } finally {
      setLoadingSessionId(null);
    }
  };

  const getDeviceIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("phone") || l.includes("android") || l.includes("ios") || l.includes("safari on iphone")) {
      return <Smartphone className="h-5 w-5 text-blue-400" />;
    }
    if (l.includes("windows") || l.includes("mac") || l.includes("linux")) {
      return <Laptop className="h-5 w-5 text-emerald-400" />;
    }
    return <Monitor className="h-5 w-5 text-purple-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn text-white">
      <div className="relative w-full max-w-md rounded-3xl border border-white/20 bg-neutral-950 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white border border-white/15">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Active Device Sessions</h3>
            <p className="text-xs text-gray-400">Max 2 Concurrent Devices Allowed</p>
          </div>
        </div>

        <div className="space-y-3 my-4">
          {sessions.map((sess) => {
            const isCurrent = sess.deviceId === currentDeviceId;
            return (
              <div
                key={sess.sessionId}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? "bg-white/10 border-white/30 shadow-md"
                    : "bg-white/5 border-white/10 text-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                    {getDeviceIcon(sess.deviceLabel || "")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {sess.deviceLabel || "Web Browser"}
                      </span>
                      {isCurrent && (
                        <span className="flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 text-[9px] font-black border border-emerald-500/30">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>This Device</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Last active: {new Date(sess.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.sessionId)}
                    disabled={loadingSessionId === sess.sessionId}
                    title="Log out of this device"
                    className="p-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white transition-all text-xs font-bold active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}

          {sessions.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No active sessions recorded.</p>
          )}
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl bg-white px-5 py-2.5 text-xs font-black text-black hover:bg-gray-200 transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
