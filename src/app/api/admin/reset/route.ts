import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { getDB } from "@/lib/db";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDB();
  await db.batch([
    db.prepare("DELETE FROM scores"),
    db.prepare("DELETE FROM entries"),
    db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('entries', 'scores')"),
  ]);

  return NextResponse.json({ ok: true });
}
