// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, getInitialMembership, getPrisma } = vi.hoisted(() => ({
  getUser: vi.fn(),
  getInitialMembership: vi.fn(),
  getPrisma: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/membership", () => ({ getInitialMembership }));
vi.mock("@/src/server/db", () => ({ getPrisma }));

import { createTRPCContext } from "./context";

describe("contexto tRPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPrisma.mockReturnValue({ marker: "prisma" });
  });

  it("test_ca_01_nao_resolve_tenant_para_visitante", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const context = await createTRPCContext();
    expect(context.user).toBeNull();
    expect(context.membership).toBeNull();
    expect(getInitialMembership).not.toHaveBeenCalled();
  });

  it("test_ca_09_deriva_tenant_e_papel_da_membership_do_usuario", async () => {
    const user = { id: "user-1" };
    const membership = {
      id: "membership-1",
      userId: "user-1",
      tenantId: "tenant-1",
      role: "COLLABORATOR",
    };
    getUser.mockResolvedValue({ data: { user }, error: null });
    getInitialMembership.mockResolvedValue(membership);

    const context = await createTRPCContext();
    expect(context).toMatchObject({ user, membership });
    expect(getInitialMembership).toHaveBeenCalledWith(expect.anything(), "user-1");
  });
});
