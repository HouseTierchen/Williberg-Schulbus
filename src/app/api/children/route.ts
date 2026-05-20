import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const f = await req.formData();
  const birth = String(f.get("birthDate") ?? "");
  await prisma.child.create({
    data: {
      firstName: String(f.get("firstName") ?? "").trim(),
      lastName: String(f.get("lastName") ?? "").trim(),
      birthDate: birth ? new Date(birth) : null,
      school: String(f.get("school") ?? "").trim(),
      grade: String(f.get("grade") ?? "").trim(),
      stopName: String(f.get("stopName") ?? "").trim() || null,
      notes: String(f.get("notes") ?? "").trim() || null,
      parentId: user.id,
    },
  });
  return NextResponse.redirect(new URL("/dashboard", req.url), 303);
}
