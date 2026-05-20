import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const f = await req.formData();
  await prisma.busStop.create({
    data: {
      routeId: String(f.get("routeId")),
      name: String(f.get("name") ?? "").trim(),
      orderIdx: Number(f.get("orderIdx") ?? 0),
      arriveAt: String(f.get("arriveAt") ?? "").trim(),
    },
  });
  return NextResponse.redirect(new URL("/admin/schedule", req.url), 303);
}
