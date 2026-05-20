import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { DAYS, SLOTS, MODES, type Mode } from "@/lib/transport";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const f = await req.formData();
  const childId = String(f.get("childId") ?? "");
  if (!childId) return new NextResponse("childId fehlt", { status: 400 });

  for (const d of DAYS) {
    for (const slot of SLOTS) {
      const base = `o_${d}_${slot}`;
      const modeRaw = String(f.get(`${base}_mode`) ?? "");
      const customTime =
        String(f.get(`${base}_time`) ?? "").trim() || null;
      const customStop =
        String(f.get(`${base}_stop`) ?? "").trim() || null;
      const where = {
        specialWeekId_childId_dayOfWeek_slot: {
          specialWeekId: id,
          childId,
          dayOfWeek: d,
          slot,
        },
      };
      if (!modeRaw) {
        await prisma.specialNeed.deleteMany({
          where: { specialWeekId: id, childId, dayOfWeek: d, slot },
        });
        continue;
      }
      const mode = modeRaw as Mode;
      if (!MODES.includes(mode)) continue;
      await prisma.specialNeed.upsert({
        where,
        update: { mode, customTime, customStop },
        create: {
          specialWeekId: id,
          childId,
          dayOfWeek: d,
          slot,
          mode,
          customTime,
          customStop,
        },
      });
    }
  }

  const url = new URL(`/admin/specialweeks/${id}`, req.url);
  url.searchParams.set("child", childId);
  url.searchParams.set("saved", "1");
  return NextResponse.redirect(url, 303);
}
