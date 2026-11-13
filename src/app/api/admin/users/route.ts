import { NextResponse } from "next/server";
import { getAllUsers, updateUserCoins, setUserVip, setUserBan, promoteUserVip, revokeAllVips } from "@/lib/db";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { authorized, error } = await verifyAdminRequest(req);
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized: Admin access required" }, { status: 401 });
  }

  const users = await getAllUsers();
  return NextResponse.json({ success: true, users });
}

export async function POST(req: Request) {
  try {
    const { authorized, error } = await verifyAdminRequest(req);
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized: Admin access required" }, { status: 401 });
    }

    const body = await req.json();
    const { action, userId, identifier, isVip, isBanned, packageId, days } = body;

    if (action === "promote_vip") {
      const res = await promoteUserVip(identifier || userId, isVip !== false, packageId, days);
      return NextResponse.json(res);
    }

    if (action === "revoke_all_vips") {
      const count = await revokeAllVips();
      return NextResponse.json({ success: true, count });
    }

    if (action === "toggle_vip") {
      const ok = await setUserVip(userId, isVip, packageId, days);
      return NextResponse.json({ success: ok });
    }

    if (action === "toggle_ban") {
      const ok = await setUserBan(userId, isBanned);
      return NextResponse.json({ success: ok });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
