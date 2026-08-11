import axe from "axe-core";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import HomeManagementPage from "./HomeManagementPage";

async function expectAccessible(container: HTMLElement) {
  const result = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  expect(result.violations).toEqual([]);
}

async function audit(path: string) {
  const { container } = render(<MemoryRouter initialEntries={[path]}><HomeManagementPage /></MemoryRouter>);
  await expectAccessible(container);
}

describe("HomeManagementPage accessibility", () => {
  it("has no DOM-level WCAG violations in its editing state", async () => {
    await audit("/admin/home");
    expect(screen.getByRole("heading", { level: 1, name: "Página Inicial" })).toBeInTheDocument();
  });

  it.each([
    "/admin/home/contacts",
    "/admin/home/social",
    "/admin/home/contacts?scenario=forbidden",
    "/admin/home/social?scenario=forbidden",
  ])("has no DOM-level WCAG violations at %s", async (path) => {
    await audit(path);
  });

  it("has no DOM-level WCAG violations with associated contact validation errors", async () => {
    const { container } = render(<MemoryRouter initialEntries={["/admin/home/contacts"]}><HomeManagementPage /></MemoryRouter>);
    const email = screen.getByLabelText(/^E-mail institucional/);
    fireEvent.change(email, { target: { value: "email-inválido" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    expect(screen.getAllByText(/e-mail institucional válido/i).length).toBeGreaterThan(0);
    expect(email).toHaveAttribute("aria-invalid", "true");
    const messageId = email.getAttribute("aria-describedby");
    expect(messageId).toBe("email-error");
    expect(document.getElementById(messageId!)).toHaveTextContent(/e-mail institucional válido/i);
    expect(email).toHaveValue("email-inválido");
    expect(screen.queryByText(/Rascunho salvo/i)).not.toBeInTheDocument();
    await waitFor(() => expect(email).toHaveFocus());

    await expectAccessible(container);
  });

  it("has no DOM-level WCAG violations with contacts pending review", async () => {
    const { container } = render(<MemoryRouter initialEntries={["/admin/home/contacts"]}><HomeManagementPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/^Município/), { target: { value: "Cuiabá Centro" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar para revisão" }));
    expect(await screen.findByRole("button", { name: "Cancelar envio" })).toBeInTheDocument();
    await expectAccessible(container);
  });

  // The mobile trigger is `display: none` on this desktop-width DOM, so it is legitimately absent from
  // the accessible tree and must not be asserted here. Its markup, disclosure logic and focus handling
  // are covered by AdminHomeLayout.test.tsx; the open menu is audited by axe in a real 390x844 Chrome
  // viewport through the `admin-social-menu-open` scenario of scripts/accessibility-audit.mjs.
  it("has no DOM-level WCAG violations in social review state, without exposing the mobile trigger on desktop", async () => {
    const { container } = render(<MemoryRouter initialEntries={["/admin/home/social"]}><HomeManagementPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole("switch", { name: "Inativar Facebook" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar para revisão" }));
    expect(await screen.findByRole("button", { name: "Cancelar envio" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Abrir menu administrativo" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir menu administrativo", hidden: true })).toBeInTheDocument();
    await expectAccessible(container);
  });

  it("has no DOM-level WCAG violations in loading, empty and error states", async () => {
    for (const resourcePath of ["/admin/home", "/admin/home/contacts", "/admin/home/social"]) {
      for (const scenario of ["loading", "empty", "unauthenticated", "conflict", "validation", "unexpected"]) {
        const path = `${resourcePath}?scenario=${scenario}`;
        const view = render(<MemoryRouter initialEntries={[path]}><HomeManagementPage /></MemoryRouter>);
        const result = await axe.run(view.container, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
          rules: { "color-contrast": { enabled: false } },
        });
        expect(result.violations, path).toEqual([]);
        view.unmount();
      }
    }
  });
});
