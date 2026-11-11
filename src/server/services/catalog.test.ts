import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/src/generated/prisma/client";
import { getCatalogItem, listCatalog } from "./catalog";

describe("catálogo por tenant", () => {
  it("retorna estado vazio e sempre consulta o tenant da sessão", async () => {
    const findMany = vi.fn().mockResolvedValueOnce([]);
    const prisma = {
      equipment: { findMany },
      equipmentCategory: { findMany: vi.fn().mockResolvedValueOnce([]) },
    } as unknown as PrismaClient;

    const result = await listCatalog(prisma, "tenant-session", { availability: "ALL" });

    expect(result.items).toEqual([]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenant-session" }) }));
  });

  it("deriva indisponibilidade de empréstimo em aberto", async () => {
    const prisma = {
      equipment: { findMany: vi.fn().mockResolvedValueOnce([{ id: "eq-1", name: "Notebook", assetTag: "PAT-1", pickupLocation: "Balcão", status: "AVAILABLE", category: { name: "Notebooks" }, loans: [{ returnedAt: null }] }]) },
      equipmentCategory: { findMany: vi.fn().mockResolvedValueOnce([{ name: "Notebooks" }]) },
    } as unknown as PrismaClient;

    const result = await listCatalog(prisma, "tenant-session", { availability: "ALL" });

    expect(result.items[0]?.availability).toBe("LOANED");
    expect(result.available).toBe(0);
  });

  it("busca detalhe apenas pelo patrimônio e tenant da sessão", async () => {
    const findFirst = vi.fn().mockResolvedValueOnce(null);
    const prisma = { equipment: { findFirst } } as unknown as PrismaClient;

    await expect(getCatalogItem(prisma, "tenant-session", "PAT-2")).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "tenant-session", assetTag: "PAT-2" } }));
  });
});
