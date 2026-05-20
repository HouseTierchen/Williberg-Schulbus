import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const f = await req.formData();
  const from = new Date(String(f.get("fromDate")));
  const to = new Date(String(f.get("toDate")));
  if (to < from) return new NextResponse("Ungültig", { status: 400 });
  await prisma.schoolHoliday.create({
    data: {
      name: String(f.get("name") ?? "").trim(),
      fromDate: from,
      toDate: to,
      notes: String(f.get("notes") ?? "").trim() || null,
    },
  });
  return NextResponse.redirect(new URL("/admin/holidays", req.url), 303);
}
