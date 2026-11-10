import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const categoryNames = ["Notebook", "Monitor", "Cabo", "Câmera", "Projetor"];

function localDirectUrl(): string {
  const value = process.env.DIRECT_URL;
  if (!value) {
    throw new Error("DIRECT_URL deve apontar para o Supabase local.");
  }

  const url = new URL(value);
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.port !== "54322"
  ) {
    throw new Error("O seed só pode acessar o PostgreSQL local do Supabase na porta 54322.");
  }

  return value;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: localDirectUrl() }),
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.tenant.createMany({
        data: [{ slug: "suporte_ti", name: "Suporte TI" }],
        skipDuplicates: true,
      });

      const tenant = await tx.tenant.findUniqueOrThrow({
        where: { slug: "suporte_ti" },
      });

      await tx.equipmentCategory.createMany({
        data: categoryNames.map((name) => ({ tenantId: tenant.id, name })),
        skipDuplicates: true,
      });
    });

    console.info("Seed local concluído: tenant suporte_ti e categorias iniciais conferidos.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error("Seed local falhou. Confira a conexão e as migrations do Supabase local.");
  process.exitCode = 1;
});
