import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, updateUser, hasMembership, replace, refresh } = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  hasMembership: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { getUser, updateUser } }) }));
vi.mock("@/lib/supabase/membership", () => ({ hasInitialMembership: hasMembership }));

import AcceptInvitePage from "./page";

describe("aceite de convite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "invited-1" } }, error: null });
    hasMembership.mockResolvedValue(true);
    updateUser.mockResolvedValue({ error: null });
  });

  it("test_ca_02_define_senha_e_abre_catalogo_para_convidado", async () => {
    const user = userEvent.setup();
    render(<AcceptInvitePage />);
    await screen.findByRole("button", { name: "Definir senha" });
    await user.type(screen.getByLabelText("Nova senha"), "senha-local-123");
    await user.type(screen.getByLabelText("Confirmar senha"), "senha-local-123");
    await user.click(screen.getByRole("button", { name: "Definir senha" }));
    expect(updateUser).toHaveBeenCalledWith({ password: "senha-local-123" });
    expect(replace).toHaveBeenCalledWith("/catalogo");
  });

  it("test_ca_02_link_sem_sessao_nao_exibe_formulario", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    render(<AcceptInvitePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Convite inválido ou expirado");
    expect(screen.queryByRole("button", { name: "Definir senha" })).not.toBeInTheDocument();
  });

  it("test_ca_02_usuario_sem_membership_nao_define_senha", async () => {
    hasMembership.mockResolvedValue(false);
    render(<AcceptInvitePage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Convite inválido ou expirado");
    expect(updateUser).not.toHaveBeenCalled();
  });
});
