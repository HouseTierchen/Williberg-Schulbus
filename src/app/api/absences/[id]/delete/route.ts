import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const a = await prisma.absence.findUnique({
    where: { id },
    include: { child: true },
  });
  if (!a || a.child.parentId !== user.id)
    return new NextResponse("Not found", { status: 404 });
  await prisma.absence.delete({ where: { id } });
  return NextResponse.redirect(
    new URL(req.headers.get("referer") ?? "/dashboard", req.url),
    303
  );
}
