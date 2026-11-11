// @vitest-environment node

import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/src/generated/prisma/client";
import { LoanRequestError, requestLoan } from "./loan-request";

type OpenLoan = { id: string; tenantId: string; equipmentId: string; borrowerMembershipId: string; dueAt: Date; returnedAt: null };

function database(options: { status?: "AVAILABLE" | "MAINTENANCE" | "RETIRED"; initialLoans?: OpenLoan[] } = {}) {
  const equipment = new Map([
    ["equipment-1", { id: "equipment-1", tenantId: "tenant-1", status: options.status ?? "AVAILABLE" }],
    ["equipment-2", { id: "equipment-2", tenantId: "tenant-1", status: "AVAILABLE" as const }],
    ["equipment-other", { id: "equipment-other", tenantId: "tenant-2", status: "AVAILABLE" as const }],
  ]);
  const loans = [...(options.initialLoans ?? [])];
  const audits: { resourceId: string }[] = [];
  let queue = Promise.resolve();

  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: "membership-1" }]),
    equipment: {
      findFirst: vi.fn(async ({ where }: { where: { id: string; tenantId: string } }) => {
        const item = equipment.get(where.id);
        return item?.tenantId === where.tenantId ? item : null;
      }),
    },
    loan: {
      findFirst: vi.fn(async ({ where }: { where: { equipmentId?: string; borrowerMembershipId?: string; dueAt?: { lt: Date } } }) => {
        if (where.equipmentId) return loans.find((loan) => loan.equipmentId === where.equipmentId) ?? null;
        if (where.borrowerMembershipId && where.dueAt) {
          return loans.find((loan) => loan.borrowerMembershipId === where.borrowerMembershipId && loan.dueAt < where.dueAt!.lt) ?? null;
        }
        return null;
      }),
      count: vi.fn(async ({ where }: { where: { borrowerMembershipId: string } }) =>
        loans.filter((loan) => loan.borrowerMembershipId === where.borrowerMembershipId).length),
      create: vi.fn(async ({ data }: { data: { tenantId: string; equipmentId: string; borrowerMembershipId: string } }) => {
        const loan: OpenLoan = { id: randomUUID(), ...data, dueAt: new Date("2099-01-01"), returnedAt: null };
        loans.push(loan);
        return loan;
      }),
    },
    auditLog: { create: vi.fn(async ({ data }: { data: { resourceId: string } }) => { audits.push(data); return data; }) },
  };

  const prisma = {
    $transaction: vi.fn(async (operation: (client: typeof tx) => Promise<unknown>) => {
      let release: () => void = () => {};
      const previous = queue;
      queue = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      try { return await operation(tx); } finally { release(); }
    }),
  } as unknown as PrismaClient;

  return { prisma, tx, loans, audits };
}

const input = (equipmentId = "equipment-1") => ({ tenantId: "tenant-1", membershipId: "membership-1", equipmentId });
const openLoan = (overrides: Partial<OpenLoan> = {}): OpenLoan => ({
  id: randomUUID(), tenantId: "tenant-1", equipmentId: randomUUID(), borrowerMembershipId: "membership-1",
  dueAt: new Date("2099-01-01"), returnedAt: null, ...overrides,
});

describe("solicitação de empréstimo", () => {
  it("test_ca_02_recusa_item_de_outro_tenant_ou_em_manutencao", async () => {
    await expect(requestLoan(database().prisma, input("equipment-other"))).rejects.toMatchObject({ reason: "EQUIPMENT_UNAVAILABLE" });
    await expect(requestLoan(database({ status: "MAINTENANCE" }).prisma, input())).rejects.toMatchObject({ reason: "EQUIPMENT_UNAVAILABLE" });
  });

  it("test_ca_03_cria_emprestimo_e_auditoria_na_mesma_transacao", async () => {
    const db = database();
    const loan = await requestLoan(db.prisma, input());
    expect(loan.equipmentId).toBe("equipment-1");
    expect(db.loans).toHaveLength(1);
    expect(db.audits).toEqual([{ tenantId: "tenant-1", actorMembershipId: "membership-1", action: "LOAN_CREATED", resourceType: "loan", resourceId: loan.id, metadata: { equipmentId: "equipment-1" } }]);
  });

  it("test_ca_05_recusa_limite_e_atraso_sem_criar_auditoria", async () => {
    const atLimit = database({ initialLoans: Array.from({ length: 5 }, () => openLoan()) });
    await expect(requestLoan(atLimit.prisma, input())).rejects.toMatchObject({ reason: "LIMIT_REACHED" });
    expect(atLimit.audits).toHaveLength(0);

    const overdue = database({ initialLoans: [openLoan({ dueAt: new Date("2020-01-01") })] });
    await expect(requestLoan(overdue.prisma, input())).rejects.toMatchObject({ reason: "OVERDUE_LOAN" });
    expect(overdue.audits).toHaveLength(0);
  });

  it("test_ca_06_duas_solicitacoes_simultaneas_do_mesmo_item_criam_uma", async () => {
    const db = database();
    const results = await Promise.allSettled([requestLoan(db.prisma, input()), requestLoan(db.prisma, input())]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected" && result.reason instanceof LoanRequestError)).toHaveLength(1);
    expect(db.loans).toHaveLength(1);
    expect(db.audits).toHaveLength(1);
  });

  it("test_ca_05_serializa_pedidos_da_mesma_pessoa_no_limite", async () => {
    const db = database({ initialLoans: Array.from({ length: 4 }, () => openLoan()) });
    const results = await Promise.allSettled([requestLoan(db.prisma, input()), requestLoan(db.prisma, input("equipment-2"))]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(db.loans).toHaveLength(5);
    expect(db.audits).toHaveLength(1);
  });
});
