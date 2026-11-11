import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { OperationsLoansPage } from "@/components/operations-loans-page";

describe("operações demonstrativo", () => {
  it("test_ca_07_filtra_atrasos_e_registra_devolucao_local", async () => {
    const user = userEvent.setup(); render(<OperationsLoansPage />);
    await user.click(screen.getByRole("button", { name: "Em atraso" }));
    expect(screen.getByText("Camila Duarte")).toBeInTheDocument();
    expect(screen.queryByText("Marina Alves")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Devolver" })[0]);
    expect(screen.queryByText("Camila Duarte")).not.toBeInTheDocument();
  });
});
