import { NextRequest, NextResponse } from "next/server";
import { getJudgeByAccessCode, createSession } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const judge = await getJudgeByAccessCode(code.trim().toUpperCase());

  if (!judge) {
    return NextResponse.redirect(new URL("/login?error=invalid", req.url));
  }

  const token = await createSession(judge.id);

  // Overwrite any existing session cookie — this is what makes judge links
  // always log in as the correct judge regardless of who is currently signed in.
  const res = NextResponse.redirect(new URL("/judge", req.url));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
