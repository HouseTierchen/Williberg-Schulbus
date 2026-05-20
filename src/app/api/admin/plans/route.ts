import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { analyseSchulplan } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  const f = await req.formData();
  const school = String(f.get("school") ?? "").trim();
  const title = String(f.get("title") ?? "").trim();
  const rawText = String(f.get("rawText") ?? "").trim();
  const vf = String(f.get("validFrom") ?? "");
  const vt = String(f.get("validTo") ?? "");
  const doAnalyze = f.get("analyze") != null;

  const plan = await prisma.schoolPlan.create({
    data: {
      school,
      title,
      rawText,
      validFrom: vf ? new Date(vf) : null,
      validTo: vt ? new Date(vt) : null,
      createdBy: admin.id,
    },
  });

  if (doAnalyze) {
    try {
      const result = await analyseSchulplan(rawText, school);
      await prisma.schoolPlan.update({
        where: { id: plan.id },
        data: {
          aiSummary: result.summary,
          aiSchedule: JSON.stringify(result),
        },
      });
    } catch (e) {
      console.error("KI-Analyse fehlgeschlagen:", e);
    }
  }

  return NextResponse.redirect(new URL(`/admin/plans/${plan.id}`, req.url), 303);
}
