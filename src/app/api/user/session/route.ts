import { NextResponse } from "next/server";
import { revokeUserSession } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { userId, sessionId } = body;

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "Missing userId or sessionId" }, { status: 400 });
    }

    const success = await revokeUserSession(userId, sessionId);
    return NextResponse.json({ success });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
