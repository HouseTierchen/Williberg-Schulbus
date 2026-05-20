import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const phone = String(form.get("phone") ?? "").trim() || null;
  const address = String(form.get("address") ?? "").trim() || null;
  const adminCode = String(form.get("adminCode") ?? "").trim();

  if (!name || !email || password.length < 8) {
    return redirectError(req, "Bitte alle Pflichtfelder ausfüllen.");
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return redirectError(req, "Diese E-Mail ist bereits registriert.");

  const role =
    adminCode && adminCode === process.env.ADMIN_REGISTRATION_CODE
      ? "ADMIN"
      : "PARENT";

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      phone,
      address,
    },
  });
  await createSession({
    sub: user.id,
    role: user.role as "PARENT" | "ADMIN",
    email: user.email,
    name: user.name,
  });
  return NextResponse.redirect(
    new URL(role === "ADMIN" ? "/admin" : "/dashboard", req.url),
    303
  );
}

function redirectError(req: NextRequest, msg: string) {
  return NextResponse.redirect(
    new URL(`/register?error=${encodeURIComponent(msg)}`, req.url),
    303
  );
}
