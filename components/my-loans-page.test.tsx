import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MyLoansPage } from "@/components/my-loans-page";

describe("meus empréstimos demonstrativo", () => {
  it("test_ca_06_devolve_item_localmente_e_atualiza_o_limite", async () => {
    const user = userEvent.setup();
    render(<MyLoansPage />);
    expect(screen.getByText("2 de 5 itens · nenhum em atraso")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Devolver" })[0]);
    expect(screen.getByText("1 de 5 itens · nenhum em atraso")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Devolver" }));
    expect(screen.getByText("Você não está com nenhum equipamento.")).toBeInTheDocument();
  });
});
