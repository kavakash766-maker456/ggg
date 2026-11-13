import { NextResponse } from "next/server";
import { listVipSubmissions, updateVipSubmissionStatus } from "@/lib/firestore";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { authorized, error } = await verifyAdminRequest(req);
  if (!authorized) {
    return NextResponse.json({ error: error || "Unauthorized: Admin access required" }, { status: 401 });
  }

  const submissions = await listVipSubmissions();
  return NextResponse.json({ success: true, submissions });
}

export async function POST(req: Request) {
  try {
    const { authorized, error } = await verifyAdminRequest(req);
    if (!authorized) {
      return NextResponse.json({ error: error || "Unauthorized: Admin access required" }, { status: 401 });
    }

    const body = await req.json();
    const { submissionId, status } = body;

    if (!submissionId || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const ok = await updateVipSubmissionStatus(submissionId, status);
    return NextResponse.json({ success: ok });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
