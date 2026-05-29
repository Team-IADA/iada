import { NextRequest, NextResponse } from "next/server";
import { getDB, getJudgeByAccessCode, createSession } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { access_code } = (await req.json()) as { access_code?: string };

  if (!access_code || typeof access_code !== "string") {
    return NextResponse.json({ error: "Access code required" }, { status: 400 });
  }

  const db = getDB();
  const judge = await getJudgeByAccessCode(db, access_code.trim().toUpperCase());

  if (!judge) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  }

  const token = await createSession(db, judge.id);

  const res = NextResponse.json({ judge: { id: judge.id, name: judge.name } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
