import { cookies } from "next/headers";
import { getDB, getJudgeByToken } from "./db";

export const SESSION_COOKIE = "iada_jury_session";

export async function getSessionJudge() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const db = getDB();
    return await getJudgeByToken(db, token);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}
