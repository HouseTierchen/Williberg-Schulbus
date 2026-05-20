import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DAYS, SLOTS, MODES, type Mode, type Slot } from "@/lib/transport";

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

  for (const d of DAYS) {
    for (const slot of SLOTS) {
      const base = `n_${d}_${slot}`;
      const mode = String(f.get(`${base}_mode`) ?? "BUS") as Mode;
      const customTime =
        String(f.get(`${base}_time`) ?? "").trim() || null;
      const customStop =
        String(f.get(`${base}_stop`) ?? "").trim() || null;
      if (!MODES.includes(mode)) continue;
      await prisma.transportNeed.upsert({
        where: {
          childId_dayOfWeek_slot: {
            childId: c.id,
            dayOfWeek: d,
            slot: slot as Slot,
          },
        },
        update: { mode, customTime, customStop },
        create: {
          childId: c.id,
          dayOfWeek: d,
          slot,
          mode,
          customTime,
          customStop,
        },
      });
    }
  }

  return NextResponse.redirect(
    new URL(`/dashboard/children/${c.id}/needs?saved=1`, req.url),
    303
  );
}
