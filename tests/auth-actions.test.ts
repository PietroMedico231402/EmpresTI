// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithPassword, signOut, hasMembership } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  hasMembership: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signInWithPassword, signOut } }),
}));
vi.mock("@/lib/supabase/membership", () => ({ hasInitialMembership: hasMembership }));

import { signIn } from "@/app/login/actions";

describe("login", () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signOut.mockReset();
    hasMembership.mockReset();
  });

  it("test_ca_01_rejeita_credenciais_invalidas_sem_revelar_o_usuario", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error: new Error("Invalid login credentials") });
    expect(await signIn("pessoa@empresa.com.br", "incorreta")).toEqual({ error: "E-mail ou senha inválidos." });
    expect(hasMembership).not.toHaveBeenCalled();
  });

  it("test_ca_01_informa_quando_login_por_email_esta_desativado", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "email_provider_disabled" },
    });
    expect(await signIn("pessoa@empresa.com.br", "senha")).toEqual({
      error: "Login por e-mail indisponível. Fale com Operações.",
    });
  });

  it("test_ca_01_encerra_sessao_de_usuario_sem_membership", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    hasMembership.mockResolvedValue(false);
    expect(await signIn("pessoa@empresa.com.br", "correta")).toEqual({ error: "Acesso não autorizado. Fale com Operações." });
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("test_ca_01_permite_usuario_com_membership", async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    hasMembership.mockResolvedValue(true);
    expect(await signIn("pessoa@empresa.com.br", "correta")).toEqual({});
    expect(signOut).not.toHaveBeenCalled();
  });
});
