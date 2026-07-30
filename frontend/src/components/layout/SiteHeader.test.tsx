import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./SiteHeader";

function renderHeader() {
  return render(
    <MemoryRouter>
      <SiteHeader />
    </MemoryRouter>,
  );
}

describe("SiteHeader", () => {
  it("renders every required item in the desktop menu", () => {
    renderHeader();
    const desktopNav = screen.getByRole("navigation", { name: "Menu principal" });

    [
      "Início",
      "Serviços",
      "Notícias",
      "Comunicações",
      "Transparência",
      "Documentos",
      "Fale Conosco",
    ].forEach((label) => {
      expect(within(desktopNav).getByRole("link", { name: label })).toBeInTheDocument();
    });

    expect(within(desktopNav).getByRole("button", { name: /Institucional/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Área do Filiado/ })).toBeInTheDocument();
  });

  it("opens the mobile menu, moves focus inside it, and closes on Escape", async () => {
    const user = userEvent.setup();
    renderHeader();

    const toggle = screen.getByRole("button", { name: "Abrir menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const mobileNav = screen.getByRole("navigation", { name: "Menu principal mobile" });
    const firstLink = within(mobileNav).getByRole("link", { name: "Início" });
    expect(firstLink).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("closes the mobile menu when the close button is activated", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: "Abrir menu" }));
    await user.click(screen.getByRole("button", { name: "Fechar menu" }));

    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the mobile menu when clicking the backdrop", async () => {
    const user = userEvent.setup();
    const { container } = renderHeader();
    const toggle = screen.getByRole("button", { name: "Abrir menu" });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const backdrop = container.querySelector('[data-testid="menu-backdrop"]');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as Element);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("reaches the brand link and the member button by keyboard alone", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.tab();
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "SINDGESTÃO — Início" })).toHaveFocus();

    const memberButton = screen.getByRole("link", { name: /Área do Filiado/ });
    await user.tab({ shift: false });
    // Keep tabbing until we reach the member button or run out of reasonable attempts.
    for (let attempts = 0; attempts < 15 && document.activeElement !== memberButton; attempts += 1) {
      await user.tab();
    }

    expect(memberButton).toHaveFocus();
  });
});
