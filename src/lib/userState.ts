import { UserSession, getDeviceIdSync, getDynamicDeviceId, getDeviceLabel } from "./deviceFingerprint";

export type { UserSession };

export interface VipPackage {
  id: string;
  name: string;
  price: number; // in LKR (Rs. 50 to Rs. 500)
  days: number;
  label: string;
  description: string;
  dailyMovies: number; // e.g. 4, 8, 12, 15, 25, 40, 9999 (unlimited)
  monthlySeries: number; // e.g. 1, 3, 5, 8, 15, 25, 9999 (unlimited)
  monthlyAnime: number; // e.g. 1, 3, 5, 8, 15, 25, 9999 (unlimited)
  inboxDelivery: boolean;
  badge?: string;
  isPopular?: boolean;
}

export const VIP_PACKAGES: VipPackage[] = [
  {
    id: "vip_200",
    name: "VIP Monthly Pass",
    price: 200,
    days: 30,
    label: "Rs. 200 / Month (30 Days)",
    description: "👑 100% Ad-Free • Instant 1-Click Request • Direct WhatsApp Inbox Delivery • All TV Series & Anime",
    dailyMovies: 30,
    monthlySeries: 15,
    monthlyAnime: 15,
    inboxDelivery: true,
    badge: "VIP 👑",
    isPopular: true,
  },
];

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
  phone?: string;
  role?: "user" | "vip" | "admin";
  deviceId: string;
  coins: number;
  isVip: boolean;
  vipPackage?: string; // "bronze" | "silver" | "gold" | "platinum"
  vipExpiresAt?: string; // ISO 8601 string
  isBanned?: boolean;
  sessions?: UserSession[];
  createdAt: string;
  lastLoginAt: string;
}

export function isVipActive(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!user.isVip && user.role !== "vip") return false;
  if (user.vipExpiresAt) {
    const expiry = new Date(user.vipExpiresAt).getTime();
    if (expiry <= Date.now()) {
      return false; // Expired!
    }
  }
  return true;
}

export interface UserRequestHistoryItem {
  id: string;
  title: string;
  poster?: string;
  type: "movie" | "series" | "anime";
  season?: number;
  quality: string;
  token: string;
  timestamp: string;
  status: "pending" | "processing" | "completed";
}

const USER_REQUESTS_KEY = "filmfeed_user_requests";

export function getUserRequestHistory(): UserRequestHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

export function addUserRequestHistory(item: UserRequestHistoryItem): void {
  if (typeof window === "undefined") return;
  try {
    const list = getUserRequestHistory();
    list.unshift(item);
    if (list.length > 50) list.length = 50;
    localStorage.setItem(USER_REQUESTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("filmfeed-requests-change", { detail: { list } }));
  } catch (_) {}
}

export function checkDuplicateMovieRequest(movieUrlOrTitle: string): {
  isDuplicate: boolean;
  remainingHours: number;
  remainingMinutes: number;
} {
  if (typeof window === "undefined" || !movieUrlOrTitle) {
    return { isDuplicate: false, remainingHours: 0, remainingMinutes: 0 };
  }
  try {
    const list = getUserRequestHistory();
    const normTarget = movieUrlOrTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const item of list) {
      const itemTitleNorm = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const itemUrlNorm = ((item as any).url || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const matches =
        (normTarget.length >= 4 && itemTitleNorm.includes(normTarget)) ||
        (itemTitleNorm.length >= 4 && normTarget.includes(itemTitleNorm)) ||
        (itemUrlNorm && normTarget.includes(itemUrlNorm));

      if (matches && item.timestamp) {
        const reqTime = new Date(item.timestamp).getTime();
        const diffMs = now - reqTime;
        if (diffMs < TWENTY_FOUR_HOURS_MS) {
          const remainingMs = TWENTY_FOUR_HOURS_MS - diffMs;
          const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
          const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          return { isDuplicate: true, remainingHours, remainingMinutes };
        }
      }
    }
  } catch (_) {}
  return { isDuplicate: false, remainingHours: 0, remainingMinutes: 0 };
}

export interface UserDailyUsage {
  date: string; // YYYY-MM-DD
  moviesRequested: number;
  seriesRequested: number;
  animeRequested: number;
  guestMovieCount: number;
}

const USER_STORAGE_KEY = "filmfeed_current_user";
const USAGE_STORAGE_KEY = "filmfeed_daily_usage";
const MY_LIST_STORAGE_KEY = "filmfeed_my_list";
const DEVICE_ID_KEY = "filmfeed_device_id";

// Get or generate persistent unique device ID (eliminating any dev_default)
export function getDeviceId(): string {
  return getDeviceIdSync();
}

export function getCurrentDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getDailyUsage(): UserDailyUsage {
  if (typeof window === "undefined") {
    return { date: getCurrentDateStr(), moviesRequested: 0, seriesRequested: 0, animeRequested: 0, guestMovieCount: 0 };
  }
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    const today = getCurrentDateStr();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        return {
          date: today,
          moviesRequested: parsed.moviesRequested || 0,
          seriesRequested: parsed.seriesRequested || 0,
          animeRequested: parsed.animeRequested || 0,
          guestMovieCount: parsed.guestMovieCount || 0,
        };
      }
    }
    // New day reset
    const fresh: UserDailyUsage = {
      date: today,
      moviesRequested: 0,
      seriesRequested: 0,
      animeRequested: 0,
      guestMovieCount: 0,
    };
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  } catch (e) {
    return { date: getCurrentDateStr(), moviesRequested: 0, seriesRequested: 0, animeRequested: 0, guestMovieCount: 0 };
  }
}

export function checkRequestLimit(
  type: "movie" | "series" | "anime",
  isVip: boolean,
  vipPackageId?: string
): { allowed: boolean; reason?: string; limit: number; used: number } {
  const usage = getDailyUsage();

  if (!isVip) {
    if (type === "series" || type === "anime") {
      return {
        allowed: false,
        reason: "TV Series and Anime Season packs require VIP Membership. Upgrade to VIP to request full seasons!",
        limit: 0,
        used: type === "series" ? usage.seriesRequested : usage.animeRequested,
      };
    }
    // Free movie limit: exactly 2 per 24 hours
    const used = usage.moviesRequested || 0;
    const limit = 2;
    if (used >= limit) {
      return {
        allowed: false,
        reason: `Daily free limit reached (${used}/${limit} movies). Upgrade to VIP to unlock more daily requests!`,
        limit,
        used,
      };
    }
    return { allowed: true, limit, used };
  }

  // Find user's VIP package or default to unlimited_500
  const pkg = VIP_PACKAGES.find((p) => p.id === vipPackageId) || VIP_PACKAGES.find((p) => p.id === "unlimited_500") || VIP_PACKAGES[0];

  if (type === "movie") {
    const used = usage.moviesRequested || 0;
    const limit = pkg.dailyMovies || 9999;
    if (limit < 9999 && used >= limit) {
      return {
        allowed: false,
        reason: `Daily movie limit reached (${used}/${limit} movies for ${pkg.name}). Resets at midnight or upgrade to Unlimited!`,
        limit,
        used,
      };
    }
    return { allowed: true, limit: limit >= 9999 ? 999 : limit, used };
  }

  if (type === "series") {
    const used = usage.seriesRequested || 0;
    const limit = pkg.monthlySeries || 9999;
    if (limit < 9999 && used >= limit) {
      return {
        allowed: false,
        reason: `Season request limit reached (${used}/${limit} TV series for ${pkg.name}). Resets next billing cycle or upgrade to Unlimited!`,
        limit,
        used,
      };
    }
    return { allowed: true, limit: limit >= 9999 ? 999 : limit, used };
  }

  // Anime
  const used = usage.animeRequested || 0;
  const limit = pkg.monthlyAnime || 9999;
  if (limit < 9999 && used >= limit) {
    return {
      allowed: false,
      reason: `Season request limit reached (${used}/${limit} Anime batches for ${pkg.name}). Resets next billing cycle or upgrade to Unlimited!`,
      limit,
      used,
    };
  }
  return { allowed: true, limit: limit >= 9999 ? 999 : limit, used };
}

export function incrementUsage(type: "movie" | "series" | "anime"): UserDailyUsage {
  const usage = getDailyUsage();
  if (type === "series") {
    usage.seriesRequested = (usage.seriesRequested || 0) + 1;
  } else if (type === "anime") {
    usage.animeRequested = (usage.animeRequested || 0) + 1;
  } else {
    usage.moviesRequested = (usage.moviesRequested || 0) + 1;
  }
  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch (e) {}
  return usage;
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem("filmfeed_user");
    if (!raw) return null;
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    // Handle double-stringified JSON strings safely
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return null;
      }
    }
    if (parsed && typeof parsed === "object" && (parsed.id || parsed.email)) {
      const u = parsed as UserProfile;
      // Auto-expire VIP status if past vipExpiresAt
      if ((u.isVip || u.role === "vip") && u.role !== "admin") {
        if (u.vipExpiresAt && new Date(u.vipExpiresAt).getTime() <= Date.now()) {
          u.isVip = false;
          u.role = "user";
          u.vipPackage = undefined;
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
          localStorage.setItem("filmfeed_user", JSON.stringify(u));
        }
      }
      return u;
    }
  } catch (e) {}
  return null;
}

export function setCurrentUser(user: UserProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      const serialized = JSON.stringify(user);
      localStorage.setItem(USER_STORAGE_KEY, serialized);
      localStorage.setItem("filmfeed_user", serialized);
      document.cookie = `filmfeed_user_id=${user.id}; path=/; max-age=31536000; SameSite=Lax`;
      if (user.role === "admin") {
        document.cookie = `filmfeed_admin_key=76037; path=/; max-age=31536000; SameSite=Lax`;
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem("filmfeed_user");
      document.cookie = "filmfeed_user_id=; path=/; max-age=0";
    }
    // Broadcast user state changes across all components and windows
    window.dispatchEvent(new CustomEvent("filmfeed-user-change", { detail: { user } }));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {}
}

export function updateLocalUserCoins(newBalance: number): void {
  const user = getCurrentUser();
  if (user) {
    user.coins = newBalance;
    setCurrentUser(user);
  }
}

// Sync latest VIP / coins state with server database on load
export async function syncUserWithServer(): Promise<UserProfile | null> {
  if (typeof window === "undefined") return null;
  const current = getCurrentUser();
  const deviceId = getDeviceId();

  try {
    let url = `/api/user/me?deviceId=${encodeURIComponent(deviceId)}`;
    if (current?.id) {
      url += `&userId=${encodeURIComponent(current.id)}`;
    }
    if (current?.email) {
      url += `&email=${encodeURIComponent(current.email)}`;
    }

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.user && typeof data.user === "object" && (data.user.id || data.user.email)) {
        // Server database is the single source of truth for VIP status.
        setCurrentUser(data.user);
        return data.user;
      }
    }

    // If server does not have user record yet, push current user profile to register
    if (current && current.email) {
      const syncRes = await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: current.name,
          email: current.email,
          image: current.image,
          phone: current.phone,
          deviceId,
        }),
      });
      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.user) {
          setCurrentUser(syncData.user);
          return syncData.user;
        }
      }
    }
  } catch (e) {}
  return current;
}

// --------------------------------------------------------------------------
// My List Bookmarks Management (Screen 2 Mockup Feature)
// --------------------------------------------------------------------------
export interface MyListItem {
  id: string;
  title: string;
  url: string;
  poster: string;
  rating?: string;
  year?: string;
  quality?: string;
  type?: "movie" | "series";
  category?: string;
  savedAt: number;
}

export function getMyList(): MyListItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MY_LIST_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function isItemInMyList(urlOrId: string): boolean {
  if (typeof window === "undefined") return false;
  const list = getMyList();
  return list.some((item) => item.url === urlOrId || item.id === urlOrId);
}

export function toggleMyListItem(item: {
  id: string;
  title: string;
  url: string;
  poster: string;
  rating?: string;
  year?: string;
  quality?: string;
  type?: "movie" | "series";
  category?: string;
}): boolean {
  if (typeof window === "undefined") return false;
  let list = getMyList();
  const exists = list.some((i) => i.url === item.url || i.id === item.id);
  if (exists) {
    list = list.filter((i) => i.url !== item.url && i.id !== item.id);
  } else {
    list.unshift({ ...item, savedAt: Date.now() });
  }
  try {
    localStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("filmfeed-mylist-change", { detail: { list } }));
  } catch (e) {}
  return !exists;
}

export function clearMyList(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MY_LIST_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("filmfeed-mylist-change", { detail: { list: [] } }));
  } catch (e) {}
}
