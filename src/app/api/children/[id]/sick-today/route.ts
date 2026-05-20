import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { pushToAdmins } from "@/lib/push";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const child = await prisma.child.findFirst({
    where: { id, parentId: user.id },
  });
  if (!child) return new NextResponse("Not found", { status: 404 });

  const today = new Date();
  const dayStart = new Date(today.toDateString());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  // Doppelmeldungen vermeiden
  const existing = await prisma.absence.findFirst({
    where: {
      childId: child.id,
      fromDate: { lte: dayEnd },
      toDate: { gte: dayStart },
    },
  });
  if (!existing) {
    await prisma.absence.create({
      data: {
        childId: child.id,
        fromDate: dayStart,
        toDate: dayStart,
        reason: "Krank (Schnellmeldung)",
      },
    });
    await pushToAdmins({
      title: "Krankmeldung Schulbus",
      body: `${child.firstName} ${child.lastName} (${child.school}) ist heute krank.`,
      url: "/admin/dayplan",
      tag: `sick-${child.id}`,
    });
  }

  return NextResponse.redirect(
    new URL(req.headers.get("referer") ?? "/dashboard", req.url),
    303
  );
}
