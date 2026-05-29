import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { sql } from "@/lib/pg";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { name } = await req.json() as { name?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  await sql`UPDATE judges SET name = ${name.trim()} WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
