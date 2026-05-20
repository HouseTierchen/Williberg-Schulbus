import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { analysePlan, type PlanInput } from "@/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  const f = await req.formData();
  const school = String(f.get("school") ?? "").trim();
  const title = String(f.get("title") ?? "").trim();
  const rawText = String(f.get("rawText") ?? "").trim();
  const vf = String(f.get("validFrom") ?? "");
  const vt = String(f.get("validTo") ?? "");
  const doAnalyze = f.get("analyze") != null;
  const file = f.get("file");

  let input: PlanInput | null = null;
  let initialRawText = rawText;

  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.redirect(
        new URL(
          "/admin/plans/new?error=" +
            encodeURIComponent("Datei zu gross (max. 10 MB)"),
          req.url
        ),
        303
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const b64 = buf.toString("base64");
    if (file.type === "application/pdf") {
      input = { kind: "pdf", base64: b64 };
    } else if (file.type.startsWith("image/")) {
      input = { kind: "image", base64: b64, mediaType: file.type };
    } else {
      return NextResponse.redirect(
        new URL(
          "/admin/plans/new?error=" +
            encodeURIComponent("Nur PDF oder Bild erlaubt"),
          req.url
        ),
        303
      );
    }
    if (!initialRawText) {
      initialRawText = `[Quelle: ${file.name} – noch nicht analysiert]`;
    }
  } else if (rawText) {
    input = { kind: "text", text: rawText };
  } else {
    return NextResponse.redirect(
      new URL(
        "/admin/plans/new?error=" +
          encodeURIComponent("Bitte Datei oder Text angeben"),
        req.url
      ),
      303
    );
  }

  const plan = await prisma.schoolPlan.create({
    data: {
      school,
      title,
      rawText: initialRawText,
      validFrom: vf ? new Date(vf) : null,
      validTo: vt ? new Date(vt) : null,
      createdBy: admin.id,
    },
  });

  if (doAnalyze && input) {
    try {
      const { analysis, extractedText } = await analysePlan(school, input);
      await prisma.schoolPlan.update({
        where: { id: plan.id },
        data: {
          rawText: extractedText || initialRawText,
          aiSummary: analysis.summary,
          aiSchedule: JSON.stringify(analysis),
        },
      });
    } catch (e) {
      console.error("KI-Analyse fehlgeschlagen:", e);
    }
  }

  return NextResponse.redirect(
    new URL(`/admin/plans/${plan.id}`, req.url),
    303
  );
}
