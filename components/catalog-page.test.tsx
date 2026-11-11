import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CatalogPage } from "@/components/catalog-page";

describe("catálogo demonstrativo", () => {
  it("test_ca_04_mostra_estados_e_somente_equipamento_disponivel_tem_acao", () => {
    render(<CatalogPage />);

    expect(screen.getAllByText("Disponível")).toHaveLength(2);
    expect(screen.getAllByText("Emprestado")).toHaveLength(2);
    expect(screen.getAllByText("Manutenção")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Ver MacBook Pro 14/ })).toHaveAttribute("href", "/catalogo/PAT-1042");
    expect(screen.queryByRole("link", { name: /Ver ThinkPad T14/ })).not.toBeInTheDocument();
  });

  it("test_ca_04_filtra_por_categoria_e_disponibilidade", async () => {
    const user = userEvent.setup();
    render(<CatalogPage />);

    await user.click(screen.getByRole("button", { name: "Monitores" }));
    expect(screen.getByText("Dell UltraSharp 27\"")).toBeInTheDocument();
    expect(screen.getByText("LG UltraFine 24\"")).toBeInTheDocument();
    expect(screen.queryByText("MacBook Pro 14\"")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Só disponíveis" }));
    expect(screen.getByText("Dell UltraSharp 27\"")).toBeInTheDocument();
    expect(screen.queryByText("LG UltraFine 24\"")).not.toBeInTheDocument();
  });
});
