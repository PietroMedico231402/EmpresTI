// @vitest-environment node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, describe, expect, it } from "vitest";

import { PrismaClient } from "../src/generated/prisma/client";

const directUrl = process.env.DIRECT_URL;
if (directUrl) {
  const url = new URL(directUrl);
  if (!["postgres:", "postgresql:"].includes(url.protocol)
    || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || url.port !== "54322") {
    throw new Error("O teste do seed só pode acessar o Supabase local na porta 54322.");
  }
}

const prisma = directUrl
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: directUrl }) })
  : undefined;
const fixed = JSON.parse(readFileSync(resolve(".agents/skills/imagens-equipamentos/references/equipamentos.json"), "utf8")) as Array<{
  patrimonio: string;
  nome: string;
  categoria: string;
  situacao: string;
}>;
const categoryByType: Record<string, string> = {
  notebook: "Notebook", monitor: "Monitor", cabo: "Cabo", camera: "Câmera",
};

describe.skipIf(!prisma)("seed dos equipamentos no PostgreSQL local", () => {
  afterAll(async () => { await prisma?.$disconnect(); });

  it("test_ca_01_ca_04_ca_06_reexecuta_sem_duplicar_e_preserva_emprestimos", async () => {
    const seed = () => execFileSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "pipe",
      timeout: 120_000,
    });
    const tenantBefore = await prisma!.tenant.findUnique({ where: { slug: "suporte_ti" } });
    const loansBefore = tenantBefore ? await prisma!.loan.count({ where: { tenantId: tenantBefore.id } }) : 0;

    seed();
    const tenant = await prisma!.tenant.findUniqueOrThrow({ where: { slug: "suporte_ti" } });
    const first = await prisma!.equipment.findMany({
      where: { tenantId: tenant.id },
      include: { category: true },
      orderBy: { assetTag: "asc" },
    });
    seed();
    const second = await prisma!.equipment.findMany({
      where: { tenantId: tenant.id },
      include: { category: true },
      orderBy: { assetTag: "asc" },
    });

    expect(first).toHaveLength(12);
    expect(second.map(({ id }) => id)).toEqual(first.map(({ id }) => id));
    expect(second.map((item) => ({
      patrimonio: item.assetTag,
      nome: item.name,
      categoria: item.category.name,
      situacao: item.status,
      retirada: item.pickupLocation,
    }))).toEqual(fixed.map((item) => ({
      patrimonio: item.patrimonio,
      nome: item.nome,
      categoria: categoryByType[item.categoria],
      situacao: item.situacao === "manutencao" ? "MAINTENANCE" : "AVAILABLE",
      retirada: "Help Desk",
    })));
    expect(await prisma!.loan.count({ where: { tenantId: tenant.id } })).toBe(loansBefore);
  }, 240_000);
});
