import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const w = await prisma.specialWeek.findUnique({ where: { id } });
  if (!w) return new NextResponse("Not found", { status: 404 });
  await prisma.specialWeek.update({
    where: { id },
    data: { active: !w.active },
  });
  return NextResponse.redirect(new URL("/admin/specialweeks", req.url), 303);
}
