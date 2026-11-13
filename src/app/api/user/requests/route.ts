import { NextResponse } from "next/server";
import { getAllRequests } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();
    const userName = searchParams.get("userName")?.toLowerCase().trim();
    const userPhone = searchParams.get("userPhone")?.replace(/\D/g, "");

    const allRequests = await getAllRequests();

    if (!userId && !userName && !userPhone) {
      return NextResponse.json({ success: true, requests: [] });
    }

    const filtered = allRequests.filter((r: any) => {
      if (userId && r.userId === userId) return true;
      if (userName && r.userName && r.userName.toLowerCase().trim() === userName) return true;
      if (userPhone && r.userPhone && r.userPhone.replace(/\D/g, "").includes(userPhone)) return true;
      return false;
    });

    return NextResponse.json({ success: true, requests: filtered.slice(0, 30) });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
