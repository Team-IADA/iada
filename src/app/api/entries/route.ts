import { NextRequest, NextResponse } from "next/server";
import { getEntriesForJudge, getJudgeByToken } from "@/lib/db";
import { getTokenFromRequest, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? getTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const judge = await getJudgeByToken(token);
  if (!judge) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await getEntriesForJudge(judge.id);
  return NextResponse.json({ entries });
}
