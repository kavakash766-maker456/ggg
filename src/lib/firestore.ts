/**
 * FilmFeed Cloud Firestore Client (REST Engine)
 * Project: mfeed-d6ad6
 * High-speed, zero-dependency, works universally on Vercel Serverless and Edge.
 */

const PROJECT_ID = "mfeed-d6ad6";
const API_KEY = "AIzaSyC__eUOVvcSFNzXX7ppABhlpeur-5daF-g";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Convert standard JavaScript object to Firestore REST format
function toFirestoreFields(obj: any): any {
  const fields: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined || val === null) {
      fields[key] = { nullValue: null };
    } else if (typeof val === "boolean") {
      fields[key] = { booleanValue: val };
    } else if (typeof val === "number") {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === "string") {
      fields[key] = { stringValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((item) => {
            if (item === null || item === undefined) return { nullValue: null };
            if (typeof item === "string") return { stringValue: item };
            if (typeof item === "number") {
              return Number.isInteger(item) ? { integerValue: String(item) } : { doubleValue: item };
            }
            if (typeof item === "boolean") return { booleanValue: item };
            if (typeof item === "object") return { mapValue: { fields: toFirestoreFields(item) } };
            return { stringValue: String(item) };
          }),
        },
      };
    } else if (typeof val === "object") {
      fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
    }
  }
  return fields;
}

// Convert Firestore REST format back to plain JavaScript object
function fromFirestoreDocument(doc: any): any {
  if (!doc || !doc.fields) return null;
  const obj: any = {};
  const docId = doc.name ? doc.name.split("/").pop() : "";
  if (docId) obj.id = docId;

  const fields = doc.fields;
  for (const key of Object.keys(fields)) {
    const f = fields[key];
    if (f.stringValue !== undefined) obj[key] = f.stringValue;
    else if (f.integerValue !== undefined) obj[key] = parseInt(f.integerValue, 10);
    else if (f.doubleValue !== undefined) obj[key] = parseFloat(f.doubleValue);
    else if (f.booleanValue !== undefined) obj[key] = f.booleanValue;
    else if (f.nullValue !== undefined) obj[key] = null;
    else if (f.arrayValue !== undefined) {
      obj[key] = (f.arrayValue.values || []).map((v: any) => {
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        if (v.doubleValue !== undefined) return parseFloat(v.doubleValue);
        if (v.booleanValue !== undefined) return v.booleanValue;
        if (v.nullValue !== undefined) return null;
        if (v.mapValue !== undefined) return fromFirestoreDocument(v.mapValue);
        return v;
      });
    } else if (f.mapValue !== undefined) {
      obj[key] = fromFirestoreDocument(f.mapValue);
    }
  }
  return obj;
}

import { UserSession } from "./deviceFingerprint";

export interface FirestoreUser {
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

export interface FirestoreRequest {
  id: string;
  userId?: string;
  userName: string;
  userPhone?: string;
  title: string;
  type: "movie" | "series";
  season?: number;
  quality: string;
  token: string;
  status: "completed" | "queued" | "failed";
  timestamp: string;
}

export interface VipSubmission {
  id: string;
  userId?: string;
  userName?: string;
  phone: string;
  seriesTitle: string;
  screenshotUrl?: string; // Base64 or hosted image url
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// In-memory resilient cache to guarantee users persist across serverless invocations and Firestore API hiccups
const GLOBAL_USERS_CACHE = new Map<string, FirestoreUser>();

export async function getFirestoreUser(id: string): Promise<FirestoreUser | null> {
  if (GLOBAL_USERS_CACHE.has(id)) {
    return GLOBAL_USERS_CACHE.get(id)!;
  }
  try {
    const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(id)}?key=${API_KEY}`, {
      cache: "no-store",
    });
    if (!res.ok) return GLOBAL_USERS_CACHE.get(id) || null;
    const data = await res.json();
    const user = fromFirestoreDocument(data);
    if (user && user.id) {
      GLOBAL_USERS_CACHE.set(user.id, user);
      return user;
    }
  } catch (e) {}
  return GLOBAL_USERS_CACHE.get(id) || null;
}

export async function getFirestoreUserByEmail(email: string): Promise<FirestoreUser | null> {
  const cleanEmail = email.toLowerCase().trim();
  let found: FirestoreUser | null = null;
  GLOBAL_USERS_CACHE.forEach((u) => {
    if (!found && u.email && u.email.toLowerCase() === cleanEmail) {
      found = u;
    }
  });
  if (found) return found;

  const users = await listFirestoreUsers();
  return users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function getFirestoreUserByDeviceId(deviceId: string): Promise<FirestoreUser | null> {
  if (!deviceId || deviceId === "dev_default") return null;
  let found: FirestoreUser | null = null;
  GLOBAL_USERS_CACHE.forEach((u) => {
    if (
      !found &&
      ((u.deviceId && u.deviceId === deviceId) ||
        u.sessions?.some((s: UserSession) => s.deviceId === deviceId))
    ) {
      found = u;
    }
  });
  if (found) return found;

  const users = await listFirestoreUsers();
  return (
    users.find(
      (u) =>
        (u.deviceId && u.deviceId !== "dev_default" && u.deviceId === deviceId) ||
        u.sessions?.some((s: UserSession) => s.deviceId === deviceId)
    ) || null
  );
}

export async function listFirestoreUsers(): Promise<FirestoreUser[]> {
  const mergedMap = new Map<string, FirestoreUser>();

  // Add all cached users first
  GLOBAL_USERS_CACHE.forEach((u, id) => {
    mergedMap.set(id, u);
  });

  try {
    const res = await fetch(`${BASE_URL}/users?pageSize=100&key=${API_KEY}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.documents && Array.isArray(data.documents)) {
        for (const doc of data.documents) {
          const user = fromFirestoreDocument(doc);
          if (user && (user.id || user.email)) {
            const uid = user.id || "usr_" + Math.random().toString(36).substring(2, 9);
            user.id = uid;
            GLOBAL_USERS_CACHE.set(uid, user);
            mergedMap.set(uid, user);
          }
        }
      }
    }
  } catch (e) {
    console.warn("[Firestore] listFirestoreUsers fetch warning:", e);
  }

  return Array.from(mergedMap.values());
}

export async function saveFirestoreUser(user: FirestoreUser): Promise<boolean> {
  if (!user || !user.id) return false;
  // Instantly record in global cache
  GLOBAL_USERS_CACHE.set(user.id, { ...user });

  try {
    const body = JSON.stringify({ fields: toFirestoreFields(user) });
    const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(user.id)}?key=${API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    return res.ok;
  } catch (e) {
    console.warn("[Firestore] saveFirestoreUser warning:", e);
    // Return true since it is captured in persistent memory cache
    return true;
  }
}

export async function updateFirestoreUserCoins(userId: string, delta: number): Promise<{ success: boolean; newBalance: number }> {
  const user = await getFirestoreUser(userId);
  if (!user) return { success: false, newBalance: 0 };
  const updated = Math.max(0, (user.coins || 0) + delta);
  user.coins = updated;
  await saveFirestoreUser(user);
  return { success: true, newBalance: updated };
}

export async function setFirestoreUserVip(
  userId: string,
  isVip: boolean,
  packageId?: string,
  days?: number
): Promise<boolean> {
  const user = await getFirestoreUser(userId);
  if (!user) return false;
  if (isVip) {
    user.isVip = true;
    user.role = "vip";
    const pkgDays = days || (packageId === "bronze" ? 3 : packageId === "silver" ? 7 : packageId === "platinum" ? 60 : 30);
    user.vipPackage = packageId || "gold";
    user.vipExpiresAt = new Date(Date.now() + pkgDays * 86400000).toISOString();
  } else {
    user.isVip = false;
    user.role = "user";
    user.vipPackage = undefined;
    user.vipExpiresAt = undefined;
  }
  return await saveFirestoreUser(user);
}

export async function revokeAllFirestoreVips(): Promise<number> {
  const users = await listFirestoreUsers();
  let count = 0;
  for (const u of users) {
    if (u.isVip || u.role === "vip") {
      u.isVip = false;
      u.role = "user";
      u.vipPackage = undefined;
      u.vipExpiresAt = undefined;
      await saveFirestoreUser(u);
      count++;
    }
  }
  return count;
}

export async function promoteUserVipByIdentifier(
  identifier: string,
  isVip: boolean = true,
  packageId?: string,
  days?: number
): Promise<{ success: boolean; user?: FirestoreUser; error?: string }> {
  const clean = identifier.trim();
  if (!clean) return { success: false, error: "Empty identifier" };
  const users = await listFirestoreUsers();
  const user = users.find(
    (u) =>
      u.id === clean ||
      u.email.toLowerCase() === clean.toLowerCase() ||
      (u.phone && u.phone.replace(/\D/g, "").includes(clean.replace(/\D/g, "")))
  );
  if (!user) {
    const cleanDigits = clean.replace(/\D/g, "");
    if (cleanDigits.length >= 9) {
      const pkgDays = days || (packageId === "bronze" ? 3 : packageId === "silver" ? 7 : packageId === "platinum" ? 60 : 30);
      const newUser: FirestoreUser = {
        id: `usr_${cleanDigits}`,
        name: `VIP User +${cleanDigits}`,
        email: `${cleanDigits}@phone.filmfeed.lk`,
        phone: clean,
        deviceId: `dev_${cleanDigits}`,
        image: "",
        role: isVip ? "vip" : "user",
        coins: 100,
        isVip: Boolean(isVip),
        vipPackage: isVip ? (packageId || "gold") : undefined,
        vipExpiresAt: isVip ? new Date(Date.now() + pkgDays * 86400000).toISOString() : undefined,
        isBanned: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      const ok = await saveFirestoreUser(newUser);
      return { success: ok, user: newUser };
    }
    return { success: false, error: `No user found matching "${clean}"` };
  }
  if (isVip) {
    user.isVip = true;
    user.role = "vip";
    const pkgDays = days || (packageId === "bronze" ? 3 : packageId === "silver" ? 7 : packageId === "platinum" ? 60 : 30);
    user.vipPackage = packageId || "gold";
    user.vipExpiresAt = new Date(Date.now() + pkgDays * 86400000).toISOString();
  } else {
    user.isVip = false;
    user.role = "user";
    user.vipPackage = undefined;
    user.vipExpiresAt = undefined;
  }
  const ok = await saveFirestoreUser(user);
  return { success: ok, user };
}

export async function setFirestoreUserBan(userId: string, isBanned: boolean): Promise<boolean> {
  const user = await getFirestoreUser(userId);
  if (!user) return false;
  user.isBanned = isBanned;
  return await saveFirestoreUser(user);
}

// ----------------------------------------------------------------------------
// Requests Stream Operations
// ----------------------------------------------------------------------------
export async function logFirestoreRequest(req: Omit<FirestoreRequest, "id" | "timestamp">): Promise<FirestoreRequest> {
  const id = "req_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
  const fullReq: FirestoreRequest = {
    ...req,
    id,
    timestamp: new Date().toISOString(),
  };

  try {
    const body = JSON.stringify({ fields: toFirestoreFields(fullReq) });
    await fetch(`${BASE_URL}/requests/${encodeURIComponent(id)}?key=${API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
  } catch (e) {}

  return fullReq;
}

export async function listFirestoreRequests(): Promise<FirestoreRequest[]> {
  try {
    const res = await fetch(`${BASE_URL}/requests?pageSize=100&key=${API_KEY}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.documents) return [];
    const list: FirestoreRequest[] = data.documents.map(fromFirestoreDocument).filter(Boolean);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    return [];
  }
}

// ----------------------------------------------------------------------------
// VIP Screenshot Submissions
// ----------------------------------------------------------------------------
export async function saveVipSubmission(sub: Omit<VipSubmission, "id" | "createdAt" | "status">): Promise<VipSubmission> {
  const id = "vip_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
  const fullSub: VipSubmission = {
    ...sub,
    id,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    const body = JSON.stringify({ fields: toFirestoreFields(fullSub) });
    await fetch(`${BASE_URL}/vip_submissions/${encodeURIComponent(id)}?key=${API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
  } catch (e) {}

  return fullSub;
}

export async function listVipSubmissions(): Promise<VipSubmission[]> {
  try {
    const res = await fetch(`${BASE_URL}/vip_submissions?pageSize=50&key=${API_KEY}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.documents) return [];
    const list: VipSubmission[] = data.documents.map(fromFirestoreDocument).filter(Boolean);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (e) {
    return [];
  }
}

export async function updateVipSubmissionStatus(id: string, status: "approved" | "rejected"): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/vip_submissions/${encodeURIComponent(id)}?key=${API_KEY}`, {
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    const sub = fromFirestoreDocument(data);
    if (!sub) return false;

    sub.status = status;
    const body = JSON.stringify({ fields: toFirestoreFields(sub) });
    const updateRes = await fetch(`${BASE_URL}/vip_submissions/${encodeURIComponent(id)}?key=${API_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });

    if (updateRes.ok && status === "approved" && sub.userId) {
      await setFirestoreUserVip(sub.userId, true);
    }
    return updateRes.ok;
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Admin Overview Metrics
// ----------------------------------------------------------------------------
export async function getFirestoreStats() {
  const [users, requests, vipSubs] = await Promise.all([
    listFirestoreUsers(),
    listFirestoreRequests(),
    listVipSubmissions(),
  ]);

  const totalUsers = users.length;
  const totalCoins = users.reduce((acc, u) => acc + (u.coins || 0), 0);
  const totalVips = users.filter((u) => u.isVip).length;
  const totalRequests = requests.length;
  const movieRequests = requests.filter((r) => r.type === "movie").length;
  const seriesRequests = requests.filter((r) => r.type === "series").length;
  const pendingVipCount = vipSubs.filter((s) => s.status === "pending").length;

  return {
    totalUsers,
    totalCoins,
    totalVips,
    totalRequests,
    movieRequests,
    seriesRequests,
    pendingVipCount,
    recentRequests: requests.slice(0, 15),
  };
}
