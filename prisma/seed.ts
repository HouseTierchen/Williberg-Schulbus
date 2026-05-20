import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@wiliberg.ch";
  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!exists) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Gemeinderat Wiliberg",
        passwordHash: await bcrypt.hash("wiliberg-admin", 10),
        role: "ADMIN",
      },
    });
    console.log("Admin angelegt: admin@wiliberg.ch / wiliberg-admin");
  }
}

main().finally(() => prisma.$disconnect());
