import { NextRequest, NextResponse } from "next/server";
import { getJudgeByToken } from "@/lib/db";
import { sql } from "@/lib/pg";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const judge = await getJudgeByToken(token);
  if (!judge) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (judge.submitted_at) return NextResponse.json({ ok: true, already: true });

  await sql`UPDATE judges SET submitted_at = NOW()::text WHERE id = ${judge.id}`;

  return NextResponse.json({ ok: true });
}
