import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/db";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { authorized, error } = await verifyAdminRequest(req);
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized: Admin access required" }, { status: 401 });
  }

  const stats = await getAdminStats();
  return NextResponse.json({ success: true, stats });
}
