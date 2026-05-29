import { NextRequest, NextResponse } from "next/server";
import { getDB, getJudgeByToken } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDB();
  const judge = await getJudgeByToken(db, token);
  if (!judge) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (judge.submitted_at) return NextResponse.json({ ok: true, already: true });

  await db
    .prepare("UPDATE judges SET submitted_at = datetime('now') WHERE id = ?")
    .bind(judge.id)
    .run();

  return NextResponse.json({ ok: true });
}
