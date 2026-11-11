import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import equipment from "../.agents/skills/imagens-equipamentos/references/equipamentos.json";

const categoryNames = ["Notebook", "Monitor", "Cabo", "Câmera", "Projetor"];
const categoryByType: Record<string, string> = {
  notebook: "Notebook",
  monitor: "Monitor",
  cabo: "Cabo",
  camera: "Câmera",
};

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

      const categories = await tx.equipmentCategory.findMany({
        where: { tenantId: tenant.id, name: { in: categoryNames } },
        select: { id: true, name: true },
      });
      const categoryIds = new Map(categories.map(({ name, id }) => [name, id]));

      if (equipment.length !== 12 || new Set(equipment.map((item) => item.patrimonio)).size !== 12) {
        throw new Error("A referência deve conter 12 patrimônios distintos.");
      }

      for (const item of equipment) {
        const categoryName = categoryByType[item.categoria];
        const categoryId = categoryIds.get(categoryName);
        if (!categoryId) throw new Error(`Categoria ausente para ${item.patrimonio}.`);

        const data = {
          categoryId,
          name: item.nome,
          pickupLocation: "Help Desk",
          status: item.situacao === "manutencao" ? "MAINTENANCE" as const : "AVAILABLE" as const,
        };
        await tx.equipment.upsert({
          where: { tenantId_assetTag: { tenantId: tenant.id, assetTag: item.patrimonio } },
          create: { tenantId: tenant.id, assetTag: item.patrimonio, ...data },
          update: data,
        });
      }
    });

    console.info("Seed local concluído: tenant suporte_ti, categorias e 12 equipamentos conferidos.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error("Seed local falhou. Confira a conexão e as migrations do Supabase local.");
  process.exitCode = 1;
});
