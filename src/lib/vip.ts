/**
 * FilmFeed VIP Membership Engine
 * VIP purchases are strictly handled via WhatsApp Admin (078 773 2040)
 * Admin manually promotes users to VIP via Admin Dashboard.
 */

import { isVipActive } from "./userState";

export const ADMIN_BUY_PHONE = "94787732040"; // 0787732040
export const ADMIN_PHONE = "94787732040";

export interface VipData {
  isVip: boolean;
  phone?: string;
  activatedAt?: string;
}

/**
 * Check if the active user has genuine VIP status.
 * Automatically purges any legacy share-unlocked VIP cache and verifies expiry.
 */
export function getVipStatus(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const data = localStorage.getItem("filmfeed_vip_user");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.isVip) {
          if (parsed.vipExpiresAt && new Date(parsed.vipExpiresAt).getTime() <= Date.now()) {
            localStorage.removeItem("filmfeed_vip_user");
            document.cookie = "filmfeed_vip=; path=/; max-age=0";
            return false;
          }
          return true;
        }
      } catch (_) {
        localStorage.removeItem("filmfeed_vip_user");
      }
    }

    // Check current user profile from Google / Cloud session with active expiry check
    const currentRaw = localStorage.getItem("filmfeed_current_user");
    if (currentRaw) {
      const user = JSON.parse(currentRaw);
      return isVipActive(user);
    }
  } catch (e) {
    console.error("Error reading VIP status:", e);
  }
  return false;
}

/**
 * Construct pre-filled English message to purchase VIP via WhatsApp
 */
export function getVipBuyWhatsAppUrl(
  user?: { name?: string; email?: string; id?: string; phone?: string; deviceId?: string } | null,
  pkg?: { id: string; name: string; price: number; days: number } | null
): string {
  const userName = user?.name || "FilmFeed Member";
  const userEmail = user?.email || "Guest";
  const userId = user?.id || user?.deviceId || "N/A";
  const deviceId = user?.deviceId || "N/A";
  const packageName = pkg ? `${pkg.name} - Rs. ${pkg.price} (${pkg.days} Days)` : "VIP Monthly Pass - Rs. 200 (30 Days)";

  const message = 
`Hello FilmFeed Admin,

I would like to purchase FilmFeed VIP Premiere Access! 👑

⭐ Selected VIP Package:
• ${packageName}

👤 User Account Details:
• Name: ${userName}
• Email: ${userEmail}
• Account / Device ID: ${deviceId !== "N/A" ? deviceId : userId}

Please send payment instructions (Bank Transfer / FriMi / eZ Cash) to activate this VIP package on my account. Thank you!`;

  return `https://wa.me/${ADMIN_BUY_PHONE}?text=${encodeURIComponent(message)}`;
}

/**
 * Save verified VIP status (called when verified by backend or code)
 */
export function setVipActive(phone: string = "", days: number = 30): void {
  if (typeof window === "undefined") return;
  try {
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
    const vipObj = {
      isVip: true,
      phone,
      verifiedByAdmin: true,
      activatedAt: new Date().toISOString(),
      vipExpiresAt: expiresAt,
    };
    localStorage.setItem("filmfeed_vip_user", JSON.stringify(vipObj));
    document.cookie = `filmfeed_vip=1; path=/; max-age=${days * 24 * 60 * 60}`;

    // Also update currentUser in localStorage so isVip is active immediately
    const currentRaw = localStorage.getItem("filmfeed_current_user");
    let current = currentRaw ? JSON.parse(currentRaw) : null;
    if (!current) {
      current = {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        name: phone ? `VIP Member (${phone.slice(-4)})` : "VIP Member",
        email: phone ? `${phone}@filmfeed.vip` : "vip@filmfeed.vip",
        phone: phone || "",
        role: "vip",
        deviceId: localStorage.getItem("filmfeed_device_id") || "dev_vip",
        coins: 100,
        isVip: true,
        vipPackage: "vip_200",
        vipExpiresAt: expiresAt,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    } else {
      current.isVip = true;
      current.role = "vip";
      current.vipPackage = "vip_200";
      current.vipExpiresAt = expiresAt;
      if (phone && !current.phone) current.phone = phone;
    }
    localStorage.setItem("filmfeed_current_user", JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("filmfeed-user-change", { detail: { user: current } }));
  } catch (e) {
    console.error("Error saving VIP status:", e);
  }
}
