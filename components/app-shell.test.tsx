import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

const { mockPathname } = vi.hoisted(() => ({ mockPathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: mockPathname }));

describe("shell autenticado", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/catalogo");
  });

  it("test_ca_03_identifica_grupos_e_rota_ativa_no_catalogo", () => {
    render(<AppSidebar />);

    const navigation = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(within(navigation).getByText("Colaborador")).toBeInTheDocument();
    expect(within(navigation).getByText("Operações")).toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Catálogo" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByRole("link", { name: /Meus empréstimos/ })).not.toHaveAttribute("aria-current");
  });

  it("test_ca_03_mantem_catalogo_ativo_no_detalhe", () => {
    mockPathname.mockReturnValue("/catalogo/PAT-1042");
    render(<AppSidebar />);

    expect(screen.getByRole("link", { name: "Catálogo" })).toHaveAttribute("aria-current", "page");
  });

  it("test_ca_02_mostra_usuario_demonstrativo_e_busca_no_catalogo", () => {
    render(<AppSidebar />);
    render(<AppHeader />);

    expect(screen.getByText("Marina Alves")).toBeInTheDocument();
    expect(screen.getByText("Design · 2 itens")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Buscar equipamentos" })).toBeInTheDocument();
    expect(screen.getByText("2 de 5 itens com você")).toBeInTheDocument();
  });

  it("test_ca_03_marca_operacoes_ativa_e_mostra_usuario_do_balcao", () => {
    mockPathname.mockReturnValue("/operacoes/emprestimos");
    render(<AppSidebar />);

    expect(screen.getByRole("link", { name: "Empréstimos em aberto" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Balcão · 2º andar")).toBeInTheDocument();
  });

  it("test_ca_09_expoe_breadcrumb_na_lista_de_emprestimos", () => {
    mockPathname.mockReturnValue("/meus-emprestimos");
    render(<AppHeader />);

    const breadcrumb = screen.getByRole("navigation", { name: "Caminho da página" });
    expect(within(breadcrumb).getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    expect(within(breadcrumb).getByText("Meus empréstimos")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pegar emprestado" })).toHaveAttribute("href", "/catalogo");
  });

  it("test_ca_09_expoe_caminho_e_controle_com_nome_acessivel", () => {
    mockPathname.mockReturnValue("/catalogo/PAT-1042");
    render(<AppHeader />);

    const breadcrumb = screen.getByRole("navigation", { name: "Caminho da página" });
    expect(within(breadcrumb).getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    expect(within(breadcrumb).getByText("PAT-1042")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Notificações" })).toBeInTheDocument();
  });

  it("test_ca_02_oferece_convite_a_qualquer_membro_no_cabecalho", () => {
    render(<AppHeader />);
    expect(screen.getByRole("link", { name: "Convidar colaborador" })).toHaveAttribute("href", "/convidar");
  });
});
