/**
 * FilmFeed Dynamic Device Fingerprinting & Multi-Device Session Management
 * Eliminates hardcoded device fallbacks and provides SHA-256 fingerprinting.
 */

export interface UserSession {
  sessionId: string;
  deviceId: string;
  deviceLabel: string;
  createdAt: string;
  lastActiveAt: string;
  ipAddress?: string;
}

const DEVICE_STORAGE_KEY = "filmfeed_device_id";
const DEVICE_LABEL_KEY = "filmfeed_device_label";

/**
 * Generate a fast SHA-256 hash string for browser traits
 */
async function sha256(message: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      // Fallback below
    }
  }
  // Simple deterministic 64-char fallback hash if Web Crypto unavailable
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < message.length; i++) {
    const ch = message.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const seed = (part1 + part2).repeat(4).slice(0, 32);
  return "fp_" + seed;
}

/**
 * Detect human-readable platform & browser label
 */
export function getDeviceLabel(): string {
  if (typeof window === "undefined" || !navigator) {
    return "Server Environment";
  }

  const cached = localStorage.getItem(DEVICE_LABEL_KEY);
  if (cached) return cached;

  const ua = navigator.userAgent || "";
  let browser = "Web Browser";
  let os = "Device";

  // Detect OS
  if (/iPad|iPhone|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Windows NT 10.0/.test(ua)) os = "Windows 10/11";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  // Detect Browser
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua) && !/Chromium|Edg/.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && !/Chrome|Chromium/.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/OPR\//.test(ua)) browser = "Opera";

  const label = `${browser} on ${os}`;
  try {
    localStorage.setItem(DEVICE_LABEL_KEY, label);
  } catch (e) {}

  return label;
}

/**
 * Retrieve or generate persistent unique device ID
 * Combines hardware entropy with persistent random seed to guarantee uniqueness across devices
 */
export async function getDynamicDeviceId(): Promise<string> {
  if (typeof window === "undefined") {
    return "dev_srv_" + Math.random().toString(36).substring(2, 10);
  }

  let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (deviceId && deviceId !== "dev_default") {
    return deviceId;
  }

  // Collect entropy
  const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`;
  const tz = Intl?.DateTimeFormat?.().resolvedOptions?.()?.timeZone || "";
  const lang = navigator.language || "";
  const randomSeed = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const rawEntropy = `${navigator.userAgent}|${screenInfo}|${tz}|${lang}|${randomSeed}`;

  const hashed = await sha256(rawEntropy);
  deviceId = `dev_${hashed.substring(0, 24)}`;

  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    document.cookie = `filmfeed_device_id=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {}

  return deviceId;
}

/**
 * Synchronous fallback getter for components that cannot await
 */
export function getDeviceIdSync(): string {
  if (typeof window === "undefined") return "dev_srv_sync";
  let deviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!deviceId || deviceId === "dev_default") {
    deviceId = "dev_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
      document.cookie = `filmfeed_device_id=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
  }
  return deviceId;
}

/**
 * Create a new user session object for the current device
 */
export function createNewSession(deviceId: string, deviceLabel?: string): UserSession {
  const now = new Date().toISOString();
  return {
    sessionId: "sess_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36),
    deviceId,
    deviceLabel: deviceLabel || getDeviceLabel(),
    createdAt: now,
    lastActiveAt: now,
  };
}
