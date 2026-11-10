// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, hasMembership } = vi.hoisted(() => ({
  getUser: vi.fn(),
  hasMembership: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/supabase/config", () => ({
  publicSupabaseConfig: () => ({ url: "http://127.0.0.1:54321", key: "test-public-key" }),
}));
vi.mock("@/lib/supabase/membership", () => ({ hasInitialMembership: hasMembership }));

import { proxy } from "@/proxy";

describe("proteção de rotas", () => {
  beforeEach(() => {
    getUser.mockReset();
    hasMembership.mockReset();
  });

  it("test_ca_01_api_sem_sessao_retorna_401_e_corpo", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const response = await proxy(new NextRequest("http://localhost/api/equipment"));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Acesso não autorizado." });
  });

  it("test_ca_01_api_sem_membership_retorna_403_e_corpo", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    hasMembership.mockResolvedValue(false);
    const response = await proxy(new NextRequest("http://localhost/api/equipment"));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Acesso não autorizado." });
  });

  it("test_ca_01_pagina_sem_sessao_redireciona_para_login", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const response = await proxy(new NextRequest("http://localhost/catalogo"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("test_ca_01_membership_valida_pode_acessar_a_pagina", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    hasMembership.mockResolvedValue(true);
    const response = await proxy(new NextRequest("http://localhost/catalogo"));
    expect(response.status).toBe(200);
  });
});
