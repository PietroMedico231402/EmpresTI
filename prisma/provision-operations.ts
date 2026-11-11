import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const userId = "6a110a35-fd52-4ac2-b8e8-667ce57b93fd";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "suporte_ti" } });
  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId } },
    update: { role: "OPERATIONS", displayName: "Pietro Medico" },
    create: { tenantId: tenant.id, userId, role: "OPERATIONS", displayName: "Pietro Medico" },
  });
  console.info("Membership OPERATIONS local provisionada.");
}

main().finally(() => prisma.$disconnect());
