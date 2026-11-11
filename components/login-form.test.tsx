import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";

const { push, refresh } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn().mockResolvedValue({ error: null }) }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth: { signInWithPassword } }) }));

describe("login demonstrativo", () => {
  beforeEach(() => { push.mockClear(); refresh.mockClear(); signInWithPassword.mockResolvedValue({ error: null }); });

  it("test_ca_02_exibe_hero_limites_e_campos_rotulados", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Entrar", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("itens por pessoa")).toBeInTheDocument();
    expect(within(screen.getByText("itens por pessoa").parentElement!).getByText("5")).toBeInTheDocument();
    expect(within(screen.getByText("dias úteis de prazo").parentElement!).getByText("14")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
  });

  it("test_ca_09_envia_por_teclado_e_abre_o_catalogo", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByRole("textbox", { name: "E-mail" }), "colaborador@empresa.com.br");
    await user.type(screen.getByLabelText("Senha"), "senha123{Enter}");

    expect(push).toHaveBeenCalledWith("/catalogo");
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "colaborador@empresa.com.br", password: "senha123" });
  });

  it("test_ca_09_mostra_erro_para_credenciais_invalidas", async () => {
    signInWithPassword.mockResolvedValue({ error: new Error("invalid") });
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByRole("textbox", { name: "E-mail" }), "invalido@empresa.com.br");
    await user.type(screen.getByLabelText("Senha"), "senha{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
  });

  it("test_ca_09_exige_os_campos_antes_do_envio", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(push).not.toHaveBeenCalled();
  });
});
