import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { pushToAllParents } from "@/lib/push";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const a = await prisma.announcement.findUnique({ where: { id } });
  if (!a) return new NextResponse("Not found", { status: 404 });
  await pushToAllParents({
    title: a.title,
    body: a.body.slice(0, 200),
    url: "/",
    tag: `ann-${a.id}`,
  });
  await prisma.announcement.update({
    where: { id },
    data: { pushSent: true },
  });
  return NextResponse.redirect(new URL("/admin/announcements", req.url), 303);
}
