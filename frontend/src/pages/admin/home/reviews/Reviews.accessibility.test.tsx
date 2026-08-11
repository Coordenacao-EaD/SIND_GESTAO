import axe from "axe-core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ADMIN_ROUTES } from "../../../../config/routes";
import ReviewDetailPage from "./ReviewDetailPage";
import ReviewsQueuePage from "./ReviewsQueuePage";

async function expectAccessible(container: HTMLElement, label: string) {
  const result = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  expect(result.violations, label).toEqual([]);
}

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ReviewsQueuePage />} path={ADMIN_ROUTES.reviews} />
        <Route element={<ReviewDetailPage />} path={ADMIN_ROUTES.reviewDetail} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("F2.2C reviews accessibility", () => {
  it.each([
    ["fila normal", `${ADMIN_ROUTES.reviews}`],
    ["fila vazia", `${ADMIN_ROUTES.reviews}?scenario=empty`],
    ["fila carregando", `${ADMIN_ROUTES.reviews}?scenario=loading`],
    ["fila 401", `${ADMIN_ROUTES.reviews}?scenario=unauthenticated`],
    ["fila 403", `${ADMIN_ROUTES.reviews}?scenario=forbidden`],
    ["fila indisponível", `${ADMIN_ROUTES.reviews}?scenario=unavailable`],
    ["detalhe pendente", `${ADMIN_ROUTES.reviews}/review-banner-1`],
    ["detalhe de contatos", `${ADMIN_ROUTES.reviews}/review-contacts-1`],
    ["detalhe de redes", `${ADMIN_ROUTES.reviews}/review-social-1`],
    ["detalhe aprovado", `${ADMIN_ROUTES.reviews}/review-banner-2`],
    ["detalhe com ajustes", `${ADMIN_ROUTES.reviews}/review-contacts-2`],
    ["detalhe cancelado", `${ADMIN_ROUTES.reviews}/review-social-2`],
    ["detalhe invalidado", `${ADMIN_ROUTES.reviews}/review-banner-3`],
    ["autoaprovação bloqueada", `${ADMIN_ROUTES.reviews}/review-banner-1?scenario=author`],
    ["envio próprio bloqueado", `${ADMIN_ROUTES.reviews}/review-banner-1?scenario=submitter`],
    ["hash divergente", `${ADMIN_ROUTES.reviews}/review-banner-1?scenario=hash_mismatch`],
    ["versão divergente", `${ADMIN_ROUTES.reviews}/review-banner-1?scenario=version_mismatch`],
    ["detalhe 401", `${ADMIN_ROUTES.reviews}/review-banner-1?scenario=unauthenticated`],
    ["detalhe 403", `${ADMIN_ROUTES.reviews}/review-banner-1?scenario=forbidden`],
    ["detalhe 422", `${ADMIN_ROUTES.reviews}/review-banner-1?scenario=validation`],
    ["detalhe indisponível", `${ADMIN_ROUTES.reviews}/review-banner-1?scenario=unavailable`],
    ["detalhe inexistente", `${ADMIN_ROUTES.reviews}/review-inexistente`],
  ])("has no DOM-level WCAG violations at %s", async (label, path) => {
    const { container } = renderRoute(path);
    await expectAccessible(container, label);
  });

  it("has no DOM-level WCAG violations on a filtered queue with no results", async () => {
    const user = userEvent.setup();
    const { container } = renderRoute(ADMIN_ROUTES.reviews);
    await user.selectOptions(screen.getByLabelText("Situação"), "cancelled");
    await user.selectOptions(screen.getByLabelText("Tipo de conteúdo"), "banner");
    await expectAccessible(container, "fila filtrada sem resultados");
  });

  it("has no DOM-level WCAG violations in the approval dialog", async () => {
    const user = userEvent.setup();
    const { container } = renderRoute(`${ADMIN_ROUTES.reviews}/review-banner-1`);
    const panel = screen.getByRole("region", { name: "Decisão" });
    await user.click(within(panel).getByRole("button", { name: /Aprovar/ }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await expectAccessible(container, "dialog de aprovação");
  });

  it("has no DOM-level WCAG violations in the request-changes dialog, including its error state", async () => {
    const user = userEvent.setup();
    const { container } = renderRoute(`${ADMIN_ROUTES.reviews}/review-banner-1`);
    const panel = screen.getByRole("region", { name: "Decisão" });
    await user.click(within(panel).getByRole("button", { name: /Solicitar ajustes/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Solicitar ajustes" }));
    expect(within(dialog).getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    await expectAccessible(container, "dialog de ajustes com erro");
  });

  it("has no DOM-level WCAG violations after a decision is recorded", async () => {
    const user = userEvent.setup();
    const { container } = renderRoute(`${ADMIN_ROUTES.reviews}/review-banner-1`);
    const panel = screen.getByRole("region", { name: "Decisão" });
    await user.click(within(panel).getByRole("button", { name: /Aprovar/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Aprovar revisão" }));
    await screen.findByText(/Conteúdo aprovado/);
    await expectAccessible(container, "detalhe após aprovação");
  });

  it("has no DOM-level WCAG violations on a concurrent conflict", async () => {
    const user = userEvent.setup();
    const { container } = renderRoute(`${ADMIN_ROUTES.reviews}/review-banner-1?scenario=concurrent`);
    const panel = screen.getByRole("region", { name: "Decisão" });
    await user.click(within(panel).getByRole("button", { name: /Aprovar/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Aprovar revisão" }));
    await screen.findByRole("alert");
    await expectAccessible(container, "conflito 409");
  });

  it("keeps the admin mobile trigger out of the desktop accessibility tree on both routes", () => {
    const queue = renderRoute(ADMIN_ROUTES.reviews);
    expect(screen.queryByRole("button", { name: "Abrir menu administrativo" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir menu administrativo", hidden: true })).toBeInTheDocument();
    queue.unmount();

    renderRoute(`${ADMIN_ROUTES.reviews}/review-banner-1`);
    expect(screen.queryByRole("button", { name: "Abrir menu administrativo" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir menu administrativo", hidden: true })).toBeInTheDocument();
  });
});
