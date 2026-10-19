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

  it("test_ca_09_expoe_caminho_e_controle_com_nome_acessivel", () => {
    mockPathname.mockReturnValue("/catalogo/PAT-1042");
    render(<AppHeader />);

    const breadcrumb = screen.getByRole("navigation", { name: "Caminho da página" });
    expect(within(breadcrumb).getByRole("link", { name: "Catálogo" })).toHaveAttribute("href", "/catalogo");
    expect(within(breadcrumb).getByText("PAT-1042")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Notificações" })).toBeInTheDocument();
  });
});
