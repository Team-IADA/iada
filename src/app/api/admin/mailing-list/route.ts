import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";
import { getDB } from "@/lib/db";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  if (!await verifyAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDB();
  const result = await db
    .prepare(`
      SELECT submitter_name, contact_first_name, contact_last_name, mailing_address, country
      FROM entries
      WHERE is_active = 1
      ORDER BY CAST(entry_code AS INTEGER) ASC
    `)
    .all<{
      submitter_name: string;
      contact_first_name: string | null;
      contact_last_name: string | null;
      mailing_address: string | null;
      country: string | null;
    }>();

  const lines = result.results.map((e, i) => {
    const contactName = [e.contact_first_name, e.contact_last_name].filter(Boolean).join(" ");
    const addressLine = [e.mailing_address, e.country].filter(Boolean).join(", ");
    return `${i + 1}. Participate: ${e.submitter_name}\n${contactName}\n${addressLine}`;
  });

  const body = lines.join("\n\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="iada-mailing-list.txt"`,
    },
  });
}
