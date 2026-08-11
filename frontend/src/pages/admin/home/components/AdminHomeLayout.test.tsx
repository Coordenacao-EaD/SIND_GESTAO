import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AdminHomeLayout } from "./AdminHomeLayout";

// The mobile header is `display: none` outside the `max-width: 760px` media query, and jsdom never
// evaluates `@media` rules — it only applies the base declaration. The trigger is therefore always
// outside the accessible tree here, whatever `window.innerWidth` says, so these tests query it with
// `hidden: true` and cover the disclosure *logic* only. Its rendered mobile accessibility (visible,
// in the accessible tree, axe-clean while open) is proven in a real 390x844 Chrome viewport by the
// `admin-social-menu-open` scenario in `scripts/accessibility-audit.mjs` and by the admin mobile
// menu checks in `e2e/home.spec.ts`.
function renderLayout() {
  render(
    <MemoryRouter initialEntries={["/admin/home"]}>
      <AdminHomeLayout><p>Conteúdo administrativo</p></AdminHomeLayout>
    </MemoryRouter>,
  );
  return screen.getByRole("button", { name: "Abrir menu administrativo", hidden: true });
}

describe("AdminHomeLayout mobile menu", () => {
  it("exposes an accessible name and starts collapsed", () => {
    const trigger = renderLayout();
    expect(trigger).toHaveAccessibleName("Abrir menu administrativo");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", "admin-navigation");
    expect(document.getElementById("admin-navigation")).toBeInTheDocument();
  });

  it("opens the navigation and relabels the trigger", async () => {
    const user = userEvent.setup();
    const trigger = renderLayout();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAccessibleName("Fechar menu administrativo");
    const navigation = document.getElementById("admin-navigation")!;
    expect(within(navigation).getByText("Contatos públicos")).toBeInTheDocument();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    const trigger = renderLayout();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAccessibleName("Abrir menu administrativo");
    expect(trigger).toHaveFocus();
  });

  it("collapses again when the trigger is activated a second time", async () => {
    const user = userEvent.setup();
    const trigger = renderLayout();

    await user.click(trigger);
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores Escape while the menu is already collapsed", async () => {
    const user = userEvent.setup();
    const trigger = renderLayout();

    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).not.toHaveFocus();
  });
});
