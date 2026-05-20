import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const f = await req.formData();
  const childId = String(f.get("childId") ?? "");
  const c = await prisma.child.findFirst({
    where: { id: childId, parentId: user.id },
  });
  if (!c) return new NextResponse("Not found", { status: 404 });
  const from = new Date(String(f.get("fromDate")));
  const to = new Date(String(f.get("toDate")));
  if (to < from)
    return new NextResponse("Ungültiger Zeitraum", { status: 400 });
  await prisma.absence.create({
    data: {
      childId,
      fromDate: from,
      toDate: to,
      reason: String(f.get("reason") ?? "").trim() || null,
    },
  });
  return NextResponse.redirect(new URL("/dashboard", req.url), 303);
}
