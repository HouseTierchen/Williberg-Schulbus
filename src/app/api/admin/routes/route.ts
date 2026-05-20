import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const f = await req.formData();
  await prisma.busRoute.create({
    data: {
      name: String(f.get("name") ?? "").trim(),
      description: String(f.get("description") ?? "").trim() || null,
    },
  });
  return NextResponse.redirect(new URL("/admin/schedule", req.url), 303);
}
