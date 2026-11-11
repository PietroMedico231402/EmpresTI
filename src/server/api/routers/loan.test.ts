// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TRPCContext } from "../context";
import { appRouter } from "../root";

const { requestLoanMock } = vi.hoisted(() => ({ requestLoanMock: vi.fn() }));
vi.mock("@/src/server/services/loan-request", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/src/server/services/loan-request")>(),
  requestLoan: requestLoanMock,
}));

function context(role: "COLLABORATOR" | "OPERATIONS" = "COLLABORATOR"): TRPCContext {
  return {
    prisma: {} as TRPCContext["prisma"],
    user: { id: "user-1" } as TRPCContext["user"],
    membership: { id: "membership-1", userId: "user-1", tenantId: "tenant-session", role },
  };
}

describe("procedimento de solicitação", () => {
  beforeEach(() => requestLoanMock.mockReset().mockResolvedValue({ id: "loan-1" }));

  it("test_ca_02_usa_identidade_e_tenant_da_sessao", async () => {
    const caller = appRouter.createCaller(context());
    await caller.loan.request({ equipmentId: "4f64057a-b63c-4c57-a2bb-5d3b8cd8046b" });
    expect(requestLoanMock).toHaveBeenCalledWith(expect.anything(), {
      tenantId: "tenant-session", membershipId: "membership-1", equipmentId: "4f64057a-b63c-4c57-a2bb-5d3b8cd8046b",
    });
  });

  it("test_ca_02_rejeita_tenant_forjado_e_papel_de_operacoes", async () => {
    const collaborator = appRouter.createCaller(context());
    await expect(collaborator.loan.request({ equipmentId: "4f64057a-b63c-4c57-a2bb-5d3b8cd8046b", tenantId: "attacker" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const operations = appRouter.createCaller(context("OPERATIONS"));
    await expect(operations.loan.request({ equipmentId: "4f64057a-b63c-4c57-a2bb-5d3b8cd8046b" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
