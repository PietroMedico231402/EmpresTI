import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NewEquipmentPage } from "@/components/new-equipment-page";

describe("cadastro demonstrativo", () => {
  it("test_ca_08_atualiza_previa_e_comunica_manutencao", async () => {
    const user = userEvent.setup(); render(<NewEquipmentPage />);
    const name = screen.getByRole("textbox", { name: "Nome" }); await user.clear(name); await user.type(name, "Projetor portátil");
    expect(screen.getByRole("heading", { name: "Projetor portátil" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Manutenção" }));
    expect(screen.getAllByText("Manutenção").length).toBeGreaterThan(1);
  });
});
