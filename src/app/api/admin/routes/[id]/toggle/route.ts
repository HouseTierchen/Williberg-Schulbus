import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const r = await prisma.busRoute.findUnique({ where: { id } });
  if (!r) return new NextResponse("Not found", { status: 404 });
  await prisma.busRoute.update({
    where: { id },
    data: { active: !r.active },
  });
  return NextResponse.redirect(new URL("/admin/schedule", req.url), 303);
}
