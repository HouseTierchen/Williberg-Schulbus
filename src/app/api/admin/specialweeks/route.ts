import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const f = await req.formData();
  const year = Number(f.get("year"));
  const weekNumber = Number(f.get("weekNumber"));
  if (!year || !weekNumber)
    return new NextResponse("Ungültig", { status: 400 });
  const w = await prisma.specialWeek.upsert({
    where: { year_weekNumber: { year, weekNumber } },
    update: {
      title: String(f.get("title") ?? "").trim(),
      description: String(f.get("description") ?? "").trim() || null,
      active: true,
    },
    create: {
      year,
      weekNumber,
      title: String(f.get("title") ?? "").trim(),
      description: String(f.get("description") ?? "").trim() || null,
    },
  });
  return NextResponse.redirect(
    new URL(`/admin/specialweeks/${w.id}`, req.url),
    303
  );
}
