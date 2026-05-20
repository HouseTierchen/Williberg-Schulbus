import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  const c = await prisma.child.findFirst({
    where: { id, parentId: user.id },
  });
  if (!c) return new NextResponse("Not found", { status: 404 });
  const f = await req.formData();
  const birth = String(f.get("birthDate") ?? "");
  await prisma.child.update({
    where: { id: c.id },
    data: {
      firstName: String(f.get("firstName") ?? "").trim(),
      lastName: String(f.get("lastName") ?? "").trim(),
      birthDate: birth ? new Date(birth) : null,
      school: String(f.get("school") ?? "").trim(),
      grade: String(f.get("grade") ?? "").trim(),
      stopName: String(f.get("stopName") ?? "").trim() || null,
      notes: String(f.get("notes") ?? "").trim() || null,
    },
  });
  return NextResponse.redirect(new URL("/dashboard", req.url), 303);
}
