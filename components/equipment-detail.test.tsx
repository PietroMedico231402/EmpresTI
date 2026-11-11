import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EquipmentDetail } from "@/components/equipment-detail";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("detalhe demonstrativo", () => {
  it("test_ca_05_abre_dialogo_com_prazo_e_confirma_para_meus_emprestimos", async () => {
    const user = userEvent.setup();
    render(<EquipmentDetail />);

    expect(screen.getByText("14 dias úteis")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Solicitar empréstimo" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Você ficará com 3 de 5 itens");
    await user.click(screen.getByRole("button", { name: "Confirmar solicitação" }));
    expect(push).toHaveBeenCalledWith("/meus-emprestimos");
  });
});
