import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LoginPage from "@/app/login/page";

const { push, refresh, signIn } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), signIn: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/app/login/actions", () => ({ signIn }));

describe("login com Supabase Auth", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    signIn.mockReset();
  });

  it("test_ca_02_exibe_hero_limites_e_campos_rotulados", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Entrar", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("itens por pessoa")).toBeInTheDocument();
    expect(screen.getByText("dias úteis de prazo")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "E-mail" })).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Senha")).toHaveAttribute("type", "password");
  });

  it("test_ca_01_09_envia_por_teclado_e_abre_o_catalogo_apos_auth", async () => {
    signIn.mockResolvedValue({});
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByRole("textbox", { name: "E-mail" }), "colaborador@empresa.com.br");
    await user.type(screen.getByLabelText("Senha"), "senha123{Enter}");

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(signIn).toHaveBeenCalledWith("colaborador@empresa.com.br", "senha123");
    expect(push).toHaveBeenCalledWith("/catalogo");
    expect(refresh).toHaveBeenCalled();
  });

  it("test_ca_01_mostra_erro_de_credenciais_sem_abrir_o_catalogo", async () => {
    signIn.mockResolvedValue({ error: "E-mail ou senha inválidos." });
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.type(screen.getByRole("textbox", { name: "E-mail" }), "invalido@empresa.com.br");
    await user.type(screen.getByLabelText("Senha"), "errada{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
    expect(push).not.toHaveBeenCalled();
  });

  it("test_ca_09_exige_os_campos_antes_do_envio", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(push).not.toHaveBeenCalled();
  });
});
