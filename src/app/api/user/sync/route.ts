import { NextResponse } from "next/server";
import { upsertUser, logRequest } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let {
      name,
      email,
      phone,
      deviceId,
      image,
      deviceLabel,
      replaceSessionId,
      transferSession,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    if (!deviceId || deviceId === "dev_default") {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
    }

    // Client sync cannot self-grant VIP status. VIP can only be modified via Admin promotion API.
    const { user, error } = await upsertUser({
      name: name || email.split("@")[0],
      email,
      phone,
      deviceId,
      deviceLabel,
      image,
      replaceSessionId,
      transferSession,
    });

    if (error) {
      return NextResponse.json({ error, user }, { status: 403 });
    }

    return NextResponse.json({ success: true, user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
