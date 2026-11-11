// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, tenantResult, memberResult, inviteUserByEmail, listUsers, deleteUser, existingMembershipResult, insertMembership } = vi.hoisted(() => ({
  getUser: vi.fn(),
  tenantResult: vi.fn(),
  memberResult: vi.fn(),
  inviteUserByEmail: vi.fn(),
  listUsers: vi.fn(),
  deleteUser: vi.fn(),
  existingMembershipResult: vi.fn(),
  insertMembership: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: table === "tenants" ? tenantResult : memberResult,
          eq: () => ({ maybeSingle: memberResult }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { inviteUserByEmail, listUsers, deleteUser } },
    from: () => ({
      insert: insertMembership,
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: existingMembershipResult }) }) }),
    }),
  }),
}));

import { POST } from "@/app/api/invitations/route";

function request(body: object, origin = "http://127.0.0.1:3000") {
  return new Request("http://127.0.0.1:3000/api/invitations", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("convites de colaborador", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "actor-1" } }, error: null });
    tenantResult.mockResolvedValue({ data: { id: "tenant-1" }, error: null });
    memberResult.mockResolvedValue({ data: { id: "member-1" }, error: null });
    inviteUserByEmail.mockResolvedValue({ data: { user: { id: "invited-1" } }, error: null });
    listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    deleteUser.mockResolvedValue({ data: {}, error: null });
    existingMembershipResult.mockResolvedValue({ data: null, error: null });
    insertMembership.mockResolvedValue({ error: null });
  });

  it("test_ca_02_rejeita_visitante_com_401_e_corpo", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Entre para enviar convites." });
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("test_ca_02_rejeita_usuario_sem_membership_com_403_e_corpo", async () => {
    memberResult.mockResolvedValue({ data: null, error: null });
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Acesso não autorizado." });
  });

  it("test_ca_02_cria_apenas_colaborador_sem_aceitar_papel_do_cliente", async () => {
    const response = await POST(request({ email: "Pessoa@Example.com", name: " Pessoa ", role: "OPERATIONS" }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ message: "Convite enviado. A pessoa receberá um link para definir a senha." });
    expect(inviteUserByEmail).toHaveBeenCalledWith("pessoa@example.com", {
      data: { name: "Pessoa" },
      redirectTo: "http://127.0.0.1:3000/auth/confirm",
    });
    expect(insertMembership).toHaveBeenCalledWith({
      tenant_id: "tenant-1", user_id: "invited-1", role: "COLLABORATOR", display_name: "Pessoa",
    });
  });

  it("test_ca_02_convite_duplicado_retorna_409_sem_membership_extra", async () => {
    listUsers.mockResolvedValue({ data: { users: [{ email: "pessoa@example.com" }] }, error: null });
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Esta pessoa já possui uma conta." });
    expect(insertMembership).not.toHaveBeenCalled();
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("test_ca_02_detecta_duplicado_em_pagina_posterior", async () => {
    listUsers.mockResolvedValueOnce({ data: { users: Array(1000).fill({ email: "outra@example.com" }) }, error: null })
      .mockResolvedValueOnce({ data: { users: [{ email: "pessoa@example.com" }] }, error: null });
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }));
    expect(response.status).toBe(409);
    expect(listUsers).toHaveBeenCalledTimes(2);
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("test_ca_02_falha_na_consulta_nao_envia_convite", async () => {
    listUsers.mockResolvedValue({ data: { users: [] }, error: { code: "unavailable" } });
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }));
    expect(response.status).toBe(502);
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("test_ca_02_falha_de_envio_nao_cria_membership", async () => {
    inviteUserByEmail.mockResolvedValue({ data: { user: null }, error: { code: "email_send_failed" } });
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: "Não foi possível enviar o convite. Tente novamente." });
    expect(insertMembership).not.toHaveBeenCalled();
  });

  it("test_ca_02_falha_de_membership_remove_usuario_criado_para_permitir_nova_tentativa", async () => {
    insertMembership.mockResolvedValue({ error: { code: "23503" } });
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: "Não foi possível concluir o convite. Tente novamente." });
    expect(insertMembership).toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalledWith("invited-1");
  });

  it("test_ca_02_falha_ao_conferir_membership_remove_usuario_criado", async () => {
    existingMembershipResult.mockResolvedValue({ data: null, error: { code: "unavailable" } });
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }));
    expect(response.status).toBe(502);
    expect(deleteUser).toHaveBeenCalledWith("invited-1");
    expect(insertMembership).not.toHaveBeenCalled();
  });

  it("test_ca_02_detecta_membership_criada_em_corrida", async () => {
    existingMembershipResult.mockResolvedValue({ data: { id: "existing" }, error: null });
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }));
    expect(response.status).toBe(409);
    expect(insertMembership).not.toHaveBeenCalled();
  });

  it("test_ca_02_rejeita_origem_externa", async () => {
    const response = await POST(request({ email: "pessoa@example.com", name: "Pessoa" }, "https://external.example"));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Origem da solicitação não autorizada." });
    expect(getUser).not.toHaveBeenCalled();
  });
});
