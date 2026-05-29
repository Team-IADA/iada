import { NextRequest, NextResponse } from "next/server";
import { getDB, getJudgeByToken, getJudgeScoresForEntry, upsertScore } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDB();
  const judge = await getJudgeByToken(db, token);
  if (!judge) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entryId = Number(req.nextUrl.searchParams.get("entry_id"));
  if (!entryId) return NextResponse.json({ error: "entry_id required" }, { status: 400 });

  const questions = await getJudgeScoresForEntry(db, judge.id, entryId);
  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDB();
  const judge = await getJudgeByToken(db, token);
  if (!judge) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (judge.submitted_at) {
    return NextResponse.json({ error: "Scores are locked after submission" }, { status: 403 });
  }

  const { entry_id, question_id, score } = (await req.json()) as {
    entry_id?: unknown;
    question_id?: unknown;
    score?: unknown;
  };

  if (!entry_id || !question_id || score == null) {
    return NextResponse.json({ error: "entry_id, question_id, score required" }, { status: 400 });
  }

  if (typeof score !== "number" || score < 1 || score > 10) {
    return NextResponse.json({ error: "Score must be 1–10" }, { status: 400 });
  }

  await upsertScore(db, judge.id, Number(entry_id), Number(question_id), score);
  return NextResponse.json({ ok: true });
}
