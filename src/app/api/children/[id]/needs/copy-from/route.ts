import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const f = await req.formData();
  const fromId = String(f.get("from") ?? "");
  if (!fromId) return new NextResponse("from fehlt", { status: 400 });

  const [target, source] = await Promise.all([
    prisma.child.findFirst({ where: { id, parentId: user.id } }),
    prisma.child.findFirst({ where: { id: fromId, parentId: user.id } }),
  ]);
  if (!target || !source)
    return new NextResponse("Not found", { status: 404 });

  const sourceNeeds = await prisma.transportNeed.findMany({
    where: { childId: source.id },
  });

  await prisma.$transaction([
    prisma.transportNeed.deleteMany({ where: { childId: target.id } }),
    ...sourceNeeds.map((n) =>
      prisma.transportNeed.create({
        data: {
          childId: target.id,
          dayOfWeek: n.dayOfWeek,
          slot: n.slot,
          mode: n.mode,
          customTime: n.customTime,
          customStop: n.customStop,
          notes: n.notes,
        },
      })
    ),
  ]);

  return NextResponse.redirect(
    new URL(`/dashboard/children/${target.id}/needs?saved=1`, req.url),
    303
  );
}
