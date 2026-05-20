import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.redirect(new URL("/login?error=1", req.url), 303);
  }
  await createSession({
    sub: user.id,
    role: user.role as "PARENT" | "ADMIN",
    email: user.email,
    name: user.name,
  });
  const target =
    next && next.startsWith("/")
      ? next
      : user.role === "ADMIN"
      ? "/admin"
      : "/dashboard";
  return NextResponse.redirect(new URL(target, req.url), 303);
}
