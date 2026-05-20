import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  await requireAdmin();
  const f = await req.formData();
  await prisma.busTrip.create({
    data: {
      routeId: String(f.get("routeId")),
      dayOfWeek: Number(f.get("dayOfWeek") ?? 1),
      departureAt: String(f.get("departureAt") ?? "").trim(),
      direction: String(f.get("direction") ?? "HIN").trim(),
      notes: String(f.get("notes") ?? "").trim() || null,
    },
  });
  return NextResponse.redirect(new URL("/admin/schedule", req.url), 303);
}
