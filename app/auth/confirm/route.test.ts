// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyOtp } = vi.hoisted(() => ({ verifyOtp: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { verifyOtp } }),
}));

import { GET } from "./route";

describe("confirmação de convite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyOtp.mockResolvedValue({ error: null });
  });

  it("test_ca_02_troca_token_de_convite_por_sessao", async () => {
    const request = new NextRequest("http://127.0.0.1:3000/auth/confirm?token_hash=hash-local&type=invite");
    const response = await GET(request);

    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "hash-local", type: "invite" });
    expect(new URL(response.headers.get("location")!).pathname).toBe("/aceitar-convite");
  });

  it("test_ca_02_rejeita_tipo_ou_token_invalido", async () => {
    const request = new NextRequest("http://127.0.0.1:3000/auth/confirm?token_hash=hash-local&type=recovery");
    const response = await GET(request);

    expect(verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("/aceitar-convite?erro=convite-invalido");
  });
});
