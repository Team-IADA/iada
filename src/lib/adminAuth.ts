import { cookies } from "next/headers";
import { sql } from "@/lib/pg";

export const ADMIN_SESSION_COOKIE = "iada_admin_session";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "iada-admin-2025";

export function checkAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function createAdminSession(): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO admin_sessions (token, expires_at) VALUES (${token}, ${expiresAt})
  `;
  return token;
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const rows = await sql<{ token: string }>`
      SELECT token FROM admin_sessions
      WHERE token = ${token} AND expires_at::timestamptz > NOW()
    `;
    return rows.length > 0;
  } catch {
    return false;
  }
}

export function getAdminTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${ADMIN_SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export async function verifyAdminRequest(req: Request): Promise<boolean> {
  const token = getAdminTokenFromRequest(req);
  if (!token) return false;
  try {
    const rows = await sql<{ token: string }>`
      SELECT token FROM admin_sessions
      WHERE token = ${token} AND expires_at::timestamptz > NOW()
    `;
    return rows.length > 0;
  } catch {
    return false;
  }
}
