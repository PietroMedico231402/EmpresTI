// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { TRPCContext } from "../context";
import { appRouter } from "../root";

function context(role: "COLLABORATOR" | "OPERATIONS", prisma: TRPCContext["prisma"]): TRPCContext {
  return {
    prisma,
    user: { id: "user-1" } as TRPCContext["user"],
    membership: { id: "membership-1", userId: "user-1", tenantId: "tenant-1", role },
  };
}

describe("operações de empréstimos", () => {
  it("test_ca_01_restringe_lista_de_operacoes_ao_papel_operacoes", async () => {
    const caller = appRouter.createCaller(context("COLLABORATOR", {} as TRPCContext["prisma"]));
    await expect(caller.operations.listOpenLoans()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("test_ca_01_lista_apenas_emprestimos_abertos_do_tenant", async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: "loan-1", borrowedAt: new Date("2026-01-01T10:00:00Z"), dueAt: new Date("2026-01-20T23:59:00Z"), borrower: { displayName: "Pietro" }, equipment: { name: "Notebook", assetTag: "TI-0001" } }]);
    const caller = appRouter.createCaller(context("OPERATIONS", { loan: { findMany } } as unknown as TRPCContext["prisma"]));

    await expect(caller.operations.listOpenLoans()).resolves.toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "tenant-1", returnedAt: null } }));
  });

  it("test_ca_01_registra_devolucao_com_a_membership_de_operacoes", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const create = vi.fn().mockResolvedValue({});
    const caller = appRouter.createCaller(context("OPERATIONS", { loan: { updateMany }, auditLog: { create } } as unknown as TRPCContext["prisma"]));

    await caller.operations.returnLoan({ loanId: "4f64057a-b63c-4c57-a2bb-5d3b8cd8046b" });
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: "tenant-1", returnedAt: null }) }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actorMembershipId: "membership-1", action: "LOAN_RETURNED" }) }));
  });

  it("test_ca_01_cadastra_equipamento_no_tenant_da_operacao", async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: "4f64057a-b63c-4c57-a2bb-5d3b8cd8046b" });
    const create = vi.fn().mockResolvedValue({ id: "equipment-1", assetTag: "TI-0099" });
    const auditCreate = vi.fn().mockResolvedValue({});
    const caller = appRouter.createCaller(context("OPERATIONS", { equipmentCategory: { findFirst }, equipment: { create }, auditLog: { create: auditCreate } } as unknown as TRPCContext["prisma"]));
    await caller.operations.createEquipment({ name: "Notebook", assetTag: "TI-0099", categoryId: "4f64057a-b63c-4c57-a2bb-5d3b8cd8046b", pickupLocation: "Help Desk", status: "AVAILABLE" });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: "tenant-1", assetTag: "TI-0099" }) }));
    expect(auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "EQUIPMENT_CREATED" }) }));
  });
});
