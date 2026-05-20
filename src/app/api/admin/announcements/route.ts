import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { pushToAllParents } from "@/lib/push";

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  const f = await req.formData();
  const title = String(f.get("title") ?? "").trim();
  const body = String(f.get("body") ?? "").trim();
  const sendPush = f.get("sendPush") != null;
  if (!title || !body) return new NextResponse("Ungültig", { status: 400 });

  const a = await prisma.announcement.create({
    data: { title, body, createdBy: admin.id, pushSent: sendPush },
  });
  if (sendPush) {
    await pushToAllParents({
      title,
      body: body.slice(0, 200),
      url: "/",
      tag: `ann-${a.id}`,
    });
  }
  return NextResponse.redirect(new URL("/admin/announcements", req.url), 303);
}
