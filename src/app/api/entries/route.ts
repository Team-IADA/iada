import { NextRequest, NextResponse } from "next/server";
import { getDB, getEntriesForJudge } from "@/lib/db";
import { getTokenFromRequest, SESSION_COOKIE } from "@/lib/auth";
import { getJudgeByToken } from "@/lib/db";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDB();
  const judge = await getJudgeByToken(db, token);
  if (!judge) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await getEntriesForJudge(db, judge.id);
  return NextResponse.json({ entries });
}
