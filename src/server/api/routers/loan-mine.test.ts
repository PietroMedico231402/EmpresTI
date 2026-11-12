// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import type { TRPCContext } from "../context";
import { appRouter } from "../root";

function context(prisma: TRPCContext["prisma"]): TRPCContext {
  return { prisma, user: { id: "user-1" } as TRPCContext["user"], membership: { id: "membership-1", userId: "user-1", tenantId: "tenant-1", role: "COLLABORATOR" } };
}

describe("meus empréstimos", () => {
  it("test_ca_07_lista_somente_os_emprestimos_abertos_do_usuario", async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: "loan-1", borrowedAt: new Date(), dueAt: new Date(Date.now() + 86_400_000), equipment: { name: "Notebook", assetTag: "TI-0001", category: { name: "Notebook" } } }]);
    const caller = appRouter.createCaller(context({ loan: { findMany } } as unknown as TRPCContext["prisma"]));
    await expect(caller.loan.listMine()).resolves.toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "tenant-1", borrowerMembershipId: "membership-1", returnedAt: null } }));
  });

  it("test_ca_07_devolve_apenas_o_emprestimo_do_proprio_usuario", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const create = vi.fn().mockResolvedValue({});
    const caller = appRouter.createCaller(context({ loan: { updateMany }, auditLog: { create } } as unknown as TRPCContext["prisma"]));
    await caller.loan.returnMine({ loanId: "4f64057a-b63c-4c57-a2bb-5d3b8cd8046b" });
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ borrowerMembershipId: "membership-1", tenantId: "tenant-1", returnedAt: null }) }));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "LOAN_RETURNED", actorMembershipId: "membership-1" }) }));
  });
});
