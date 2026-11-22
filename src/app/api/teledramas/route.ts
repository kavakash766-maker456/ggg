import { NextRequest, NextResponse } from "next/server";
import { getTeledramas } from "@/lib/teledramas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "24", 10);
  const channel = searchParams.get("channel") || undefined;

  const data = getTeledramas(page, limit, channel);

  return NextResponse.json(data);
}
