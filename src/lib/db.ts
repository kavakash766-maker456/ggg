import fs from "fs";
import path from "path";
import { UserProfile, VIP_PACKAGES, VipPackage, isVipActive } from "./userState";
import { UserSession } from "./deviceFingerprint";
import {
  getFirestoreUser,
  getFirestoreUserByEmail,
  getFirestoreUserByDeviceId,
  listFirestoreUsers,
  saveFirestoreUser,
  updateFirestoreUserCoins,
  setFirestoreUserVip,
  setFirestoreUserBan,
  logFirestoreRequest,
  listFirestoreRequests,
  getFirestoreStats,
  FirestoreUser,
  FirestoreRequest,
} from "./firestore";

export type RequestLog = FirestoreRequest;
export const MAX_SESSIONS = 2;

// ----------------------------------------------------------------------------
// Resilient In-Memory & Local File Persistence Engine
// ----------------------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var __filmfeed_users_map: Map<string, UserProfile> | undefined;
  // eslint-disable-next-line no-var
  var __filmfeed_requests_cache: RequestLog[] | undefined;
}

if (!globalThis.__filmfeed_users_map) {
  globalThis.__filmfeed_users_map = new Map<string, UserProfile>();
}
if (!globalThis.__filmfeed_requests_cache) {
  globalThis.__filmfeed_requests_cache = [];
}

const MEMORY_USERS = globalThis.__filmfeed_users_map!;
const MEMORY_REQUESTS = globalThis.__filmfeed_requests_cache!;

const DATA_DIR = path.join(process.cwd(), "src", "data");
const USERS_FILE = path.join(DATA_DIR, "users_db.json");
const TMP_USERS_FILE = path.join("/tmp", "filmfeed_users_db.json");

function readUsersFromFile(): UserProfile[] {
  // 1. Try local project src/data/users_db.json
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (_) {}

  // 2. Fallback to /tmp in serverless / Vercel container
  try {
    if (fs.existsSync(TMP_USERS_FILE)) {
      const content = fs.readFileSync(TMP_USERS_FILE, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (_) {}

  return [];
}

function writeUsersToFile(users: UserProfile[]): void {
  const json = JSON.stringify(users, null, 2);

  // Write to src/data/users_db.json if writable
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, json, "utf-8");
  } catch (_) {}

  // Also write to /tmp for persistent lambdas
  try {
    fs.writeFileSync(TMP_USERS_FILE, json, "utf-8");
  } catch (_) {}
}

function syncUsersToMemory(): void {
  const fileUsers = readUsersFromFile();
  for (const u of fileUsers) {
    if (u && u.id) {
      if (!MEMORY_USERS.has(u.id)) {
        MEMORY_USERS.set(u.id, u);
      }
    }
  }
}

// Initial sync on module load
syncUsersToMemory();

function persistUser(user: UserProfile): void {
  MEMORY_USERS.set(user.id, user);
  const all = Array.from(MEMORY_USERS.values());
  writeUsersToFile(all);

  // Non-blocking firestore sync
  saveFirestoreUser(user as FirestoreUser).catch(() => {});
}

function checkAndApplyVipExpiry(user: UserProfile): boolean {
  if (user.role === "admin") return false;
  if ((user.isVip || user.role === "vip") && user.vipExpiresAt) {
    if (new Date(user.vipExpiresAt).getTime() <= Date.now()) {
      user.isVip = false;
      user.role = "user";
      user.vipPackage = undefined;
      return true;
    }
  }
  return false;
}

// ----------------------------------------------------------------------------
// Users Operations
// ----------------------------------------------------------------------------
export async function getAllUsers(): Promise<UserProfile[]> {
  syncUsersToMemory();

  // Try fetching from Firestore with a 1.5s timeout; merge if available
  try {
    const firestorePromise = listFirestoreUsers();
    const timeoutPromise = new Promise<FirestoreUser[]>((resolve) =>
      setTimeout(() => resolve([]), 1500)
    );
    const firestoreUsers = await Promise.race([firestorePromise, timeoutPromise]);
    for (const fu of firestoreUsers) {
      if (fu && fu.id && !MEMORY_USERS.has(fu.id)) {
        MEMORY_USERS.set(fu.id, fu as UserProfile);
      }
    }
  } catch (_) {}

  const list = Array.from(MEMORY_USERS.values());
  for (const u of list) {
    if (checkAndApplyVipExpiry(u)) {
      persistUser(u);
    }
  }

  return list.sort(
    (a, b) => new Date(b.lastLoginAt || 0).getTime() - new Date(a.lastLoginAt || 0).getTime()
  );
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  syncUsersToMemory();
  if (MEMORY_USERS.has(id)) {
    const u = MEMORY_USERS.get(id)!;
    if (checkAndApplyVipExpiry(u)) {
      persistUser(u);
    }
    return u;
  }
  const u = await getFirestoreUser(id);
  if (u) {
    const userProfile = u as UserProfile;
    if (checkAndApplyVipExpiry(userProfile)) {
      persistUser(userProfile);
    } else {
      MEMORY_USERS.set(u.id, userProfile);
    }
    return userProfile;
  }
  return null;
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  if (!email) return null;
  syncUsersToMemory();
  const clean = email.toLowerCase().trim();
  for (const u of Array.from(MEMORY_USERS.values())) {
    if (u.email && u.email.toLowerCase().trim() === clean) {
      if (checkAndApplyVipExpiry(u)) {
        persistUser(u);
      }
      return u;
    }
  }
  const u = await getFirestoreUserByEmail(clean);
  if (u) {
    const userProfile = u as UserProfile;
    if (checkAndApplyVipExpiry(userProfile)) {
      persistUser(userProfile);
    } else {
      MEMORY_USERS.set(u.id, userProfile);
    }
    return userProfile;
  }
  return null;
}

export async function getUserByDeviceId(deviceId: string): Promise<UserProfile | null> {
  if (!deviceId || deviceId === "dev_default") return null;
  syncUsersToMemory();
  for (const u of Array.from(MEMORY_USERS.values())) {
    if (u.deviceId === deviceId || u.sessions?.some((s) => s.deviceId === deviceId)) {
      if (checkAndApplyVipExpiry(u)) {
        persistUser(u);
      }
      return u;
    }
  }
  const u = await getFirestoreUserByDeviceId(deviceId);
  if (u) {
    const userProfile = u as UserProfile;
    if (checkAndApplyVipExpiry(userProfile)) {
      persistUser(userProfile);
    } else {
      MEMORY_USERS.set(u.id, userProfile);
    }
    return userProfile;
  }
  return null;
}

export async function upsertUser(data: {
  name: string;
  email: string;
  image?: string;
  phone?: string;
  deviceId?: string;
  deviceLabel?: string;
  replaceSessionId?: string;
  transferSession?: boolean;
  isVip?: boolean;
  role?: "user" | "vip" | "admin";
  vipPackage?: string;
  vipExpiresAt?: string;
}): Promise<{
  user: UserProfile;
  requiresTransfer?: boolean;
  error?: string;
}> {
  let deviceId = data.deviceId;
  if (!deviceId || deviceId === "dev_default") {
    deviceId = "dev_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
  }

  const deviceLabel = data.deviceLabel || "Web Browser";
  let existingUser = await getUserByEmail(data.email);

  if (existingUser) {
    const sessions: UserSession[] = Array.isArray(existingUser.sessions) ? [...existingUser.sessions] : [];
    const existingSessionIndex = sessions.findIndex((s) => s.deviceId === deviceId);

    if (existingSessionIndex >= 0) {
      sessions[existingSessionIndex].lastActiveAt = new Date().toISOString();
      if (deviceLabel) sessions[existingSessionIndex].deviceLabel = deviceLabel;
    } else {
      const now = new Date().toISOString();
      const newSession: UserSession = {
        sessionId: "sess_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36),
        deviceId,
        deviceLabel,
        createdAt: now,
        lastActiveAt: now,
      };

      if (data.replaceSessionId) {
        const replaceIdx = sessions.findIndex((s) => s.sessionId === data.replaceSessionId);
        if (replaceIdx >= 0) {
          sessions.splice(replaceIdx, 1, newSession);
        } else {
          sessions.push(newSession);
        }
      } else if (sessions.length >= MAX_SESSIONS) {
        sessions.sort((a, b) => new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime());
        sessions.shift();
        sessions.push(newSession);
      } else {
        sessions.push(newSession);
      }
    }

    existingUser.name = data.name || existingUser.name;
    existingUser.image = data.image || existingUser.image;
    existingUser.phone = data.phone || existingUser.phone;
    existingUser.deviceId = deviceId;
    existingUser.sessions = sessions;
    
    // Preserve existing verified VIP status if active; do not allow client-side promotion
    checkAndApplyVipExpiry(existingUser);
    existingUser.lastLoginAt = new Date().toISOString();

    persistUser(existingUser);
    return { user: existingUser };
  } else {
    const now = new Date().toISOString();
    const initialSession: UserSession = {
      sessionId: "sess_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36),
      deviceId,
      deviceLabel,
      createdAt: now,
      lastActiveAt: now,
    };

    // New users start as standard free users. VIP can only be granted via Admin promotion.
    const newUser: UserProfile = {
      id: "usr_" + Math.random().toString(36).substring(2, 10),
      name: data.name,
      email: data.email.toLowerCase(),
      image: data.image || "",
      phone: data.phone || "",
      role: "user",
      deviceId,
      coins: 50,
      isVip: false,
      sessions: [initialSession],
      createdAt: now,
      lastLoginAt: now,
    };

    persistUser(newUser);
    return { user: newUser };
  }
}

export async function revokeUserSession(userId: string, sessionId: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user || !user.sessions) return false;
  user.sessions = user.sessions.filter((s) => s.sessionId !== sessionId);
  persistUser(user);
  return true;
}

export async function updateUserCoins(userId: string, delta: number): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const user = await getUserById(userId);
  if (!user) return { success: false, newBalance: 0, error: "User not found" };
  const updated = Math.max(0, (user.coins || 0) + delta);
  user.coins = updated;
  persistUser(user);
  return { success: true, newBalance: updated };
}

export async function setUserVip(
  userId: string,
  isVip: boolean,
  packageId?: string,
  days?: number
): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;
  if (isVip) {
    user.isVip = true;
    user.role = "vip";
    const pkg = VIP_PACKAGES.find((p) => p.id === packageId);
    const validDays = days || (pkg ? pkg.days : 30);
    user.vipPackage = packageId || (pkg ? pkg.id : "gold");
    user.vipExpiresAt = new Date(Date.now() + validDays * 86400000).toISOString();
  } else {
    user.isVip = false;
    user.role = "user";
    user.vipPackage = undefined;
    user.vipExpiresAt = undefined;
  }
  persistUser(user);
  return true;
}

export async function promoteUserVip(
  identifier: string,
  isVip: boolean = true,
  packageId?: string,
  days?: number
) {
  const clean = identifier.trim().toLowerCase();
  syncUsersToMemory();

  let target: UserProfile | null = null;
  for (const u of Array.from(MEMORY_USERS.values())) {
    if (
      u.id === identifier ||
      (u.email && u.email.toLowerCase() === clean) ||
      (u.phone && u.phone.replace(/\D/g, "").includes(identifier.replace(/\D/g, "")))
    ) {
      target = u;
      break;
    }
  }

  if (target) {
    if (isVip) {
      target.isVip = true;
      target.role = "vip";
      const pkg = VIP_PACKAGES.find((p) => p.id === packageId);
      const validDays = days || (pkg ? pkg.days : 30);
      target.vipPackage = packageId || (pkg ? pkg.id : "gold");
      target.vipExpiresAt = new Date(Date.now() + validDays * 86400000).toISOString();
    } else {
      target.isVip = false;
      target.role = "user";
      target.vipPackage = undefined;
      target.vipExpiresAt = undefined;
    }
    persistUser(target);
    return { success: true, user: target };
  }

  // Fallback to firestore or create immediate in-memory profile
  try {
    const { promoteUserVipByIdentifier } = await import("./firestore");
    const res = await promoteUserVipByIdentifier(identifier, isVip, packageId, days);
    if (res.success && res.user) {
      const u = res.user as UserProfile;
      if (isVip) {
        const pkg = VIP_PACKAGES.find((p) => p.id === packageId);
        const validDays = days || (pkg ? pkg.days : 30);
        u.vipPackage = packageId || (pkg ? pkg.id : "gold");
        u.vipExpiresAt = new Date(Date.now() + validDays * 86400000).toISOString();
      } else {
        u.vipPackage = undefined;
        u.vipExpiresAt = undefined;
      }
      persistUser(u);
    }
    return res;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function revokeAllVips(): Promise<number> {
  syncUsersToMemory();
  let count = 0;
  for (const u of Array.from(MEMORY_USERS.values())) {
    if (u.isVip || u.role === "vip") {
      u.isVip = false;
      u.role = "user";
      count++;
    }
  }
  if (count > 0) {
    writeUsersToFile(Array.from(MEMORY_USERS.values()));
  }

  // Also revoke in firestore in background
  try {
    const { revokeAllFirestoreVips } = await import("./firestore");
    revokeAllFirestoreVips().catch(() => {});
  } catch (_) {}

  return count;
}

export async function setUserBan(userId: string, isBanned: boolean): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user) return false;
  user.isBanned = isBanned;
  persistUser(user);
  return true;
}

// ----------------------------------------------------------------------------
// Requests Stream Operations
// ----------------------------------------------------------------------------
export async function logRequest(req: Omit<RequestLog, "id" | "timestamp">): Promise<RequestLog> {
  const id = "req_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
  const fullReq: RequestLog = {
    ...req,
    id,
    timestamp: new Date().toISOString(),
  };

  MEMORY_REQUESTS.unshift(fullReq);
  if (MEMORY_REQUESTS.length > 200) {
    MEMORY_REQUESTS.length = 200;
  }

  logFirestoreRequest(req).catch(() => {});
  return fullReq;
}

export async function getAllRequests(): Promise<RequestLog[]> {
  try {
    const fsReqs = await listFirestoreRequests();
    if (fsReqs && fsReqs.length > 0) return fsReqs;
  } catch (_) {}
  return MEMORY_REQUESTS;
}

export async function getAdminStats() {
  syncUsersToMemory();
  const users = Array.from(MEMORY_USERS.values());
  const totalUsers = users.length;
  const vipUsers = users.filter((u) => u.isVip || u.role === "vip").length;

  return {
    totalUsers,
    vipUsers,
    totalRequests: MEMORY_REQUESTS.length,
    todayRequests: MEMORY_REQUESTS.length,
    activeSessions: totalUsers,
  };
}
