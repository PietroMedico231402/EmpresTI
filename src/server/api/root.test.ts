// @vitest-environment node

import { describe, expect, it } from "vitest";

import { appRouter } from "./root";
import type { TRPCContext } from "./context";

function context(overrides: Partial<TRPCContext> = {}): TRPCContext {
  return {
    prisma: {} as TRPCContext["prisma"],
    user: { id: "user-1" } as TRPCContext["user"],
    membership: {
      id: "membership-1",
      userId: "user-1",
      tenantId: "tenant-1",
      role: "COLLABORATOR",
    },
    ...overrides,
  };
}

describe("router raiz", () => {
  it("test_ca_09_retorna_identidade_derivada_do_contexto", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.session.current()).resolves.toEqual({
      userId: "user-1",
      membershipId: "membership-1",
      tenantId: "tenant-1",
      role: "COLLABORATOR",
    });
  });

  it("test_ca_09_cliente_nao_escolhe_tenant_nem_papel", async () => {
    const caller = appRouter.createCaller(context());
    await expect(caller.session.current({
      tenantId: "tenant-atacante",
      role: "OPERATIONS",
    } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("test_ca_01_rejeita_usuario_sem_membership", async () => {
    const caller = appRouter.createCaller(context({ membership: null }));
    await expect(caller.session.current()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
