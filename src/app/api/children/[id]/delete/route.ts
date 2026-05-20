import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  const { id } = await params;
  await prisma.child.deleteMany({ where: { id, parentId: user.id } });
  return NextResponse.redirect(new URL("/dashboard", req.url), 303);
}
