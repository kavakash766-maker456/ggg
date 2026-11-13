"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Film,
  Tv,
  Crown,
  Shield,
  Search,
  Ban,
  CheckCircle,
  Clock,
  RefreshCw,
  Lock,
  ArrowUpRight,
  Check,
  X,
  AlertCircle,
  Sparkles,
  UserCheck,
  UserX,
  Trash2,
} from "lucide-react";
import { getCurrentUser, VIP_PACKAGES } from "@/lib/userState";

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "requests">("overview");
  const [searchUser, setSearchUser] = useState("");
  const [loading, setLoading] = useState(false);

  // Manual VIP Promotion Input & Package Selection
  const [promoteInput, setPromoteInput] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("gold");
  const [userRowPackages, setUserRowPackages] = useState<Record<string, string>>({});
  const [promoteStatus, setPromoteStatus] = useState<string | null>(null);

  const getAdminHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      let key = sessionStorage.getItem("filmfeed_admin_key");
      if (!key) {
        const match = document.cookie.match(/filmfeed_admin_key=([^;]+)/);
        if (match) key = decodeURIComponent(match[1]);
      }
      if (!key) key = "76037";
      headers["x-admin-key"] = key;
      sessionStorage.setItem("filmfeed_admin_key", key);

      const u = getCurrentUser();
      if (u?.id) headers["x-user-id"] = u.id;
    }
    return headers;
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const headers = getAdminHeaders();
      const [uRes, rRes, sRes] = await Promise.all([
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/requests", { headers }),
        fetch("/api/admin/stats", { headers }),
      ]);
      const uData = await uRes.json();
      const rData = await rRes.json();
      const sData = await sRes.json();
      if (uData.users) setUsers(uData.users);
      if (rData.requests) setRequests(rData.requests);
      if (sData.stats) setStats(sData.stats);
    } catch (e) {
      console.error("Admin data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleVip = async (userId: string, currentVip: boolean, pkgId: string = selectedPackage) => {
    try {
      const headers = getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "toggle_vip",
          userId,
          isVip: !currentVip,
          packageId: !currentVip ? pkgId : undefined,
        }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  isVip: !currentVip,
                  role: !currentVip ? "vip" : "user",
                  vipPackage: !currentVip ? pkgId : undefined,
                  vipExpiresAt: !currentVip
                    ? new Date(
                        Date.now() + (VIP_PACKAGES.find((p) => p.id === pkgId)?.days || 30) * 86400000
                      ).toISOString()
                    : undefined,
                }
              : u
          )
        );
      }
    } catch (e) {
      alert("Failed to toggle VIP status");
    }
  };

  const handlePromoteManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteInput.trim()) return;
    const pkg = VIP_PACKAGES.find((p) => p.id === selectedPackage);
    setPromoteStatus(`Promoting user with ${pkg?.name || "VIP Pass"}...`);
    try {
      const headers = getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "promote_vip",
          identifier: promoteInput.trim(),
          isVip: true,
          packageId: selectedPackage,
          days: pkg?.days,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPromoteStatus(`✅ Successfully promoted ${data.user?.name || promoteInput} to ${pkg?.name} (${pkg?.label})!`);
        setPromoteInput("");
        loadAdminData();
      } else {
        setPromoteStatus(`❌ Error: ${data.error || "User not found"}`);
      }
    } catch (err: any) {
      setPromoteStatus(`❌ Error: ${err.message}`);
    }
    setTimeout(() => setPromoteStatus(null), 5000);
  };

  const handleRevokeAllVips = async () => {
    if (!confirm("⚠️ Are you sure you want to revoke VIP status from ALL users? Everyone will return to the Free Tier.")) {
      return;
    }
    setLoading(true);
    try {
      const headers = getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "revoke_all_vips" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully revoked VIP from ${data.count} users!`);
        loadAdminData();
      }
    } catch (e) {
      alert("Failed to revoke all VIPs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    if (!confirm(`Are you sure you want to ${currentBanned ? "unban" : "ban"} this user?`)) return;
    try {
      const headers = getAdminHeaders();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "toggle_ban", userId, isBanned: !currentBanned }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isBanned: !currentBanned } : u))
        );
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    sessionStorage.removeItem("filmfeed_admin_key");
    window.location.href = "/";
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.phone?.includes(searchUser) ||
      u.deviceId?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const vipUsersCount = users.filter((u) => u.isVip || u.role === "vip").length;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white">FILMFEED CONTROL CENTER</span>
              <span className="rounded bg-amber-500 text-black px-2 py-0.5 text-[10px] font-black">VIP & STREAM ENGINE</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Manage Users, VIP Memberships, Movie & TV Series Requests</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-bold text-gray-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white transition-all"
            >
              Exit Admin
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs">Total Users</span>
              <Users className="h-4 w-4 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.totalUsers || users.length}</p>
            <p className="text-[10px] text-gray-500 mt-1">Google Signed-In Accounts</p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-bold">Active VIP Members</span>
              <Crown className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400">{vipUsersCount}</p>
            <p className="text-[10px] text-amber-300/70 mt-1">Full 20 Movies / 5 Series Daily</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs">Total Requests</span>
              <Film className="h-4 w-4 text-white" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.totalRequests || requests.length}</p>
            <p className="text-[10px] text-gray-500 mt-1">Logged Bot Requests</p>
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4">
            <div className="flex items-center justify-between text-indigo-400 mb-2">
              <span className="text-xs font-bold">VIP WhatsApp Hotline</span>
              <Shield className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-xl font-black text-indigo-300 font-mono">078 773 2040</p>
            <p className="text-[10px] text-indigo-300/70 mt-1">Official Purchase Line</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
              activeTab === "overview" ? "bg-white text-black font-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Overview & Requests
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
              activeTab === "users" ? "bg-white text-black font-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Users ({users.length}) • VIP Management
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
              activeTab === "requests" ? "bg-white text-black font-black" : "text-gray-400 hover:text-white"
            }`}
          >
            All Requests ({requests.length})
          </button>
        </div>

        {/* Tab 1: Users Manager & VIP Control */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* VIP Promoter Panel */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#14121a] to-[#0d0c13] p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    <Crown className="h-3 w-3" />
                    <span>Instant VIP Promotion</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">Promote User to VIP Premiere</h3>
                  <p className="text-xs text-gray-400">
                    Enter any user's Google Email, User ID, or WhatsApp number to instantly grant or revoke VIP access.
                  </p>
                </div>

                <form onSubmit={handlePromoteManual} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    value={promoteInput}
                    onChange={(e) => setPromoteInput(e.target.value)}
                    placeholder="e.g. user@gmail.com or usr_xyz"
                    className="flex-1 md:w-64 rounded-xl border border-white/20 bg-black/60 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
                  />
                  <select
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="rounded-xl border border-amber-500/40 bg-black/80 px-3 py-2.5 text-xs text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                  >
                    {VIP_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.id} className="bg-neutral-900 text-white">
                        {pkg.name} — {pkg.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-black hover:bg-amber-300 transition shrink-0 shadow-lg shadow-amber-500/20"
                  >
                    <Crown className="h-3.5 w-3.5 fill-black" />
                    <span>Grant VIP</span>
                  </button>
                </form>
              </div>

              {promoteStatus && (
                <div className="mt-3 p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-semibold text-amber-200">
                  {promoteStatus}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Total VIP Members: <b className="text-amber-400 font-bold">{vipUsersCount}</b>
                </span>
                <button
                  type="button"
                  onClick={handleRevokeAllVips}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-400 hover:text-red-300 transition"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Revoke All VIP Users</span>
                </button>
              </div>
            </div>

            {/* Users Search Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Search by name, email, WhatsApp phone, device ID..."
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-white focus:outline-none"
                />
              </div>
              <span className="text-xs text-gray-400">{filteredUsers.length} users</span>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-black/40 text-gray-400">
                  <tr>
                    <th className="p-3.5">User Profile</th>
                    <th className="p-3.5">WhatsApp Phone</th>
                    <th className="p-3.5">Tier & Package</th>
                    <th className="p-3.5">Active Devices</th>
                    <th className="p-3.5">VIP Action</th>
                    <th className="p-3.5">Ban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => {
                    const isUserVip = Boolean(u.isVip || u.role === "vip");
                    const userPkg = VIP_PACKAGES.find((p) => p.id === u.vipPackage);
                    let remainingStr = "";
                    if (isUserVip && u.vipExpiresAt) {
                      const diff = new Date(u.vipExpiresAt).getTime() - Date.now();
                      if (diff <= 0) {
                        remainingStr = "Expired";
                      } else {
                        const d = Math.floor(diff / 86400000);
                        const h = Math.floor((diff % 86400000) / 3600000);
                        remainingStr = d > 0 ? `${d}d ${h}h left` : `${h}h left`;
                      }
                    }

                    return (
                      <tr key={u.id} className={u.isBanned ? "opacity-50 bg-red-950/20" : ""}>
                        <td className="p-3.5">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{u.name}</span>
                            {isUserVip && (
                              <span className="rounded bg-amber-400/20 text-amber-400 px-1.5 py-0.2 text-[9px] font-black flex items-center gap-1">
                                <Crown className="h-2.5 w-2.5" />
                                <span>VIP</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">{u.email}</div>
                          <div className="text-[9px] text-gray-600 font-mono">{u.id}</div>
                        </td>
                        <td className="p-3.5 font-mono">
                          {u.phone ? (
                            <a
                              href={`https://wa.me/${u.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <span>{u.phone}</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-gray-500">Not set</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isUserVip ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold">
                                <Crown className="h-3 w-3" />
                                <span>{userPkg ? `${userPkg.name} (${userPkg.label})` : "VIP Premiere"}</span>
                              </span>
                              {remainingStr && (
                                <span className={`text-[10px] font-mono flex items-center gap-1 ${remainingStr === "Expired" ? "text-red-400" : "text-amber-400/80"}`}>
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>{remainingStr}</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="rounded bg-white/10 text-gray-400 px-2 py-0.5 text-[10px] font-semibold">
                              Free Tier
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-[10px] text-gray-400">
                          {u.sessions && u.sessions.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {u.sessions.map((s: any, idx: number) => (
                                <span key={idx} className="truncate max-w-[150px] text-gray-300 font-sans" title={s.deviceId}>
                                  • {s.deviceLabel || s.deviceId}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="truncate max-w-[140px]" title={u.deviceId}>
                              {u.deviceId || "dev_unbound"}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isUserVip ? (
                            <button
                              onClick={() => handleToggleVip(u.id, isUserVip)}
                              className="rounded-lg px-3 py-1.5 text-[11px] font-black transition-all flex items-center gap-1.5 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                            >
                              <UserX className="h-3 w-3" />
                              <span>Revoke VIP</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={userRowPackages[u.id] || selectedPackage}
                                onChange={(e) =>
                                  setUserRowPackages((prev) => ({ ...prev, [u.id]: e.target.value }))
                                }
                                className="rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-[10px] text-amber-300 font-semibold focus:outline-none"
                              >
                                {VIP_PACKAGES.map((pkg) => (
                                  <option key={pkg.id} value={pkg.id} className="bg-neutral-900 text-white">
                                    {pkg.name} ({pkg.label})
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  handleToggleVip(u.id, isUserVip, userRowPackages[u.id] || selectedPackage)
                                }
                                className="rounded-lg px-2.5 py-1 text-[10px] font-black transition-all flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md hover:brightness-110 whitespace-nowrap"
                              >
                                <Crown className="h-3 w-3 fill-black" />
                                <span>Promote</span>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleBan(u.id, u.isBanned)}
                            className={`rounded-lg p-1.5 text-xs transition-colors ${
                              u.isBanned ? "bg-red-600 text-white" : "bg-white/10 text-gray-400 hover:text-red-400"
                            }`}
                            title={u.isBanned ? "Unban user" : "Ban user"}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Requests Stream */}
        {(activeTab === "requests" || activeTab === "overview") && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Film className="h-4 w-4 text-white" />
              <span>Real-Time Movie & TV Series Requests</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-black/40 text-gray-400">
                  <tr>
                    <th className="p-3.5">Content Title</th>
                    <th className="p-3.5">Type & Quality</th>
                    <th className="p-3.5">Requester</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Token</th>
                    <th className="p-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className="p-3.5 font-bold text-white max-w-[220px] truncate">{r.title}</td>
                      <td className="p-3.5">
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300 uppercase">
                          {r.type === "series" ? `Series S${r.season || 1}` : "Movie"} • {r.quality}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-gray-300">{r.userName}</td>
                      <td className="p-3.5 font-mono text-emerald-400">{r.userPhone || "Guest"}</td>
                      <td className="p-3.5 font-mono text-gray-400">{r.token}</td>
                      <td className="p-3.5 text-[11px] text-gray-500">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">No requests logged yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
