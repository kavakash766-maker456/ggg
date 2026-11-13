"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserProfile, getCurrentUser, setCurrentUser, syncUserWithServer } from "./userState";
import { getDeviceIdSync, getDeviceLabel } from "./deviceFingerprint";

interface AuthContextType {
  user: UserProfile | null;
  role: "user" | "vip" | "admin";
  isLoading: boolean;
  deviceId: string;
  deviceLabel: string;
  refreshUser: () => Promise<UserProfile | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "user",
  isLoading: true,
  deviceId: "",
  deviceLabel: "",
  refreshUser: async () => null,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deviceId, setDeviceId] = useState<string>("");
  const [deviceLabel, setDeviceLabel] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const devId = getDeviceIdSync();
      const label = getDeviceLabel();
      setDeviceId(devId);
      setDeviceLabel(label);

      const cached = getCurrentUser();
      if (cached) setUser(cached);

      try {
        const synced = await syncUserWithServer();
        if (synced) setUser(synced);
      } catch (e) {}

      setIsLoading(false);
    };

    init();

    const handleStorage = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refreshUser = async (): Promise<UserProfile | null> => {
    const updated = await syncUserWithServer();
    if (updated) setUser(updated);
    return updated;
  };

  const logout = () => {
    setCurrentUser(null);
    setUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("filmfeed_admin_key");
      window.location.reload();
    }
  };

  const role = user?.role || (user?.isVip ? "vip" : "user");

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        deviceId,
        deviceLabel,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
