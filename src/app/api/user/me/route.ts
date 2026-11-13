import { NextResponse } from "next/server";
import { getUserByDeviceId, getUserById, getUserByEmail } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const deviceId = searchParams.get("deviceId");
  const email = searchParams.get("email");

  let user = null;
  if (email) user = await getUserByEmail(email);
  if (!user && userId) user = await getUserById(userId);
  if (!user && deviceId && deviceId !== "dev_default") user = await getUserByDeviceId(deviceId);

  if (!user) {
    return NextResponse.json({ user: null, authenticated: false });
  }

  return NextResponse.json({
    user,
    authenticated: true,
  });
}
