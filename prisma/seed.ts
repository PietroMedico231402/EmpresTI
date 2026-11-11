import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for the local seed.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "suporte_ti" },
    update: { name: "Suporte TI" },
    create: { slug: "suporte_ti", name: "Suporte TI" },
  });

  for (const name of ["Notebook", "Monitor", "Cabo", "Câmera", "Projetor"]) {
    const existing = await prisma.equipmentCategory.findFirst({
      where: { tenantId: tenant.id, name: { equals: name, mode: "insensitive" } },
    });
    if (!existing) await prisma.equipmentCategory.create({ data: { tenantId: tenant.id, name } });
  }

  const categoryCount = await prisma.equipmentCategory.count({ where: { tenantId: tenant.id } });
  console.info(`Seed local concluído: tenant ${tenant.slug}, ${categoryCount} categorias.`);
}

main().finally(() => prisma.$disconnect());
