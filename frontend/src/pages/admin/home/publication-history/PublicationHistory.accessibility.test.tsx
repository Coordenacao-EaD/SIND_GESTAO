import axe from "axe-core";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ADMIN_ROUTES } from "../../../../config/routes";
import HistoryDetailPage from "./HistoryDetailPage";
import HistoryPage from "./HistoryPage";
import PublicationPage from "./PublicationPage";

async function accessible(container: HTMLElement, label: string) {
  const result = await axe.run(container, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }, rules: { "color-contrast": { enabled: false } } });
  expect(result.violations, label).toEqual([]);
}
function renderAt(path: string) { return render(<MemoryRouter initialEntries={[path]}><Routes><Route element={<PublicationPage />} path={ADMIN_ROUTES.publication} /><Route element={<HistoryPage />} path={ADMIN_ROUTES.history} /><Route element={<HistoryDetailPage />} path={ADMIN_ROUTES.historyDetail} /></Routes></MemoryRouter>); }

describe("F2.2D accessibility", () => {
  it.each([
    ["publicação", ADMIN_ROUTES.publication], ["publicação sem capability", `${ADMIN_ROUTES.publication}?scenario=readonly`],
    ["aprovação expirada", `${ADMIN_ROUTES.publication}?scenario=approval_expired`], ["hash divergente", `${ADMIN_ROUTES.publication}?scenario=hash_mismatch`],
    ["conflito", `${ADMIN_ROUTES.publication}?scenario=publication_conflict`], ["histórico", ADMIN_ROUTES.history],
    ["histórico vazio", `${ADMIN_ROUTES.history}?scenario=empty`], ["histórico 403", `${ADMIN_ROUTES.history}?scenario=readonly`],
    ["detalhe", `${ADMIN_ROUTES.history}/history-banner-v0`], ["detalhe atual", `${ADMIN_ROUTES.history}/history-contacts-v1`],
    ["restore sem capability", `${ADMIN_ROUTES.history}/history-banner-v0?scenario=readonly`], ["detalhe inexistente", `${ADMIN_ROUTES.history}/inexistente`],
  ])("has no DOM WCAG violations at %s", async (label, path) => { const view = renderAt(path); await screen.findByRole("heading", { level: 1 }); await accessible(view.container, label); });
  it("audits the publication dialog", async () => { const user = userEvent.setup(); const view = renderAt(ADMIN_ROUTES.publication); await user.click(await screen.findByRole("button", { name: "Publicar banner" })); expect(screen.getByRole("dialog")).toBeInTheDocument(); await accessible(view.container, "publication dialog"); });
  it("audits the restoration dialog", async () => { const user = userEvent.setup(); const view = renderAt(`${ADMIN_ROUTES.history}/history-banner-v0`); await user.click(await screen.findByRole("button", { name: "Restaurar como novo rascunho" })); expect(within(screen.getByRole("dialog")).getByText(/versão pública atual não será alterada/i)).toBeInTheDocument(); await accessible(view.container, "restore dialog"); });
});
