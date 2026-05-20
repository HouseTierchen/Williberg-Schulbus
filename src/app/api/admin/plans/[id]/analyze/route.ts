import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { analyseSchulplan } from "@/lib/anthropic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  const plan = await prisma.schoolPlan.findUnique({ where: { id } });
  if (!plan) return new NextResponse("Not found", { status: 404 });

  try {
    const result = await analyseSchulplan(plan.rawText, plan.school);
    await prisma.schoolPlan.update({
      where: { id },
      data: {
        aiSummary: result.summary,
        aiSchedule: JSON.stringify(result),
      },
    });
  } catch (e) {
    console.error("KI-Analyse fehlgeschlagen:", e);
    return NextResponse.redirect(
      new URL(`/admin/plans/${id}?error=ki`, req.url),
      303
    );
  }
  return NextResponse.redirect(new URL(`/admin/plans/${id}`, req.url), 303);
}
