import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ADMIN_ROUTES } from "../../../../config/routes";
import HistoryDetailPage from "./HistoryDetailPage";
import HistoryPage from "./HistoryPage";
import PublicationPage from "./PublicationPage";

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route element={<PublicationPage />} path={ADMIN_ROUTES.publication} />
    <Route element={<HistoryPage />} path={ADMIN_ROUTES.history} />
    <Route element={<HistoryDetailPage />} path={ADMIN_ROUTES.historyDetail} />
  </Routes></MemoryRouter>);
}

describe("F2.2D publication interface", () => {
  it("renders the publication route and three separate actions", async () => {
    renderAt(ADMIN_ROUTES.publication);
    expect(await screen.findByRole("heading", { level: 1, name: "Publicação simulada" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Publicar banner" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Publicar contatos" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Publicar redes sociais" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /publicar tudo/i })).not.toBeInTheDocument();
  });
  it("opens a labelled modal with the simulated warning", async () => {
    const user = userEvent.setup(); renderAt(ADMIN_ROUTES.publication);
    await user.click(await screen.findByRole("button", { name: "Publicar banner" }));
    const dialog = screen.getByRole("dialog", { name: "Publicar banner" });
    expect(dialog).toHaveAttribute("aria-modal", "true"); expect(within(dialog).getByText(/não altera a Home pública real/)).toBeInTheDocument();
  });
  it("cancels without publishing and returns focus", async () => {
    const user = userEvent.setup(); renderAt(ADMIN_ROUTES.publication); const trigger = await screen.findByRole("button", { name: "Publicar banner" });
    await user.click(trigger); await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(trigger).toHaveFocus(); expect(screen.queryByText(/publicado no mock/i)).not.toBeInTheDocument();
  });
  it("closes on Escape and returns focus", async () => {
    const user = userEvent.setup(); renderAt(ADMIN_ROUTES.publication); const trigger = await screen.findByRole("button", { name: "Publicar contatos" });
    await user.click(trigger); await user.keyboard("{Escape}"); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(trigger).toHaveFocus();
  });
  it("publishes only the selected resource after confirmation", async () => {
    const user = userEvent.setup(); renderAt(ADMIN_ROUTES.publication); await user.click(await screen.findByRole("button", { name: "Publicar contatos" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Publicar contatos" }));
    expect(await screen.findByText(/Contatos publicado no mock/)).toBeInTheDocument(); expect(screen.getByRole("button", { name: "Publicar banner" })).toBeEnabled();
  });
  it("blocks all publication actions without capabilities", async () => {
    renderAt(`${ADMIN_ROUTES.publication}?scenario=readonly`); expect(await screen.findByRole("button", { name: "Publicar banner" })).toBeDisabled(); expect(screen.getAllByText(/não possui a capability específica/)).toHaveLength(3);
  });
  it("shows conflict feedback without false success", async () => {
    const user = userEvent.setup(); renderAt(`${ADMIN_ROUTES.publication}?scenario=publication_conflict`); await user.click(await screen.findByRole("button", { name: "Publicar banner" })); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Publicar banner" }));
    expect(await screen.findByText(/Outra publicação alterou/)).toBeInTheDocument(); expect(screen.queryByText(/publicado no mock/)).not.toBeInTheDocument();
  });
});

describe("F2.2D history interface", () => {
  it("renders history and exposes its real menu route", async () => { renderAt(ADMIN_ROUTES.history); expect(await screen.findByRole("heading", { level: 1, name: "Histórico de versões" })).toBeInTheDocument(); expect(screen.getByRole("link", { name: /Histórico e restauração/ })).toHaveAttribute("href", ADMIN_ROUTES.history); });
  it("filters history by type", async () => { const user = userEvent.setup(); renderAt(ADMIN_ROUTES.history); await screen.findByText(/4 de 4 versões/); await user.selectOptions(screen.getByLabelText("Tipo"), "footer_contacts"); expect(screen.getByText(/1 de 4 versões/)).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "Versão editorial v1" })).toBeInTheDocument(); });
  it("filters by current public version", async () => { const user = userEvent.setup(); renderAt(ADMIN_ROUTES.history); await screen.findByText(/4 de 4 versões/); await user.click(screen.getByLabelText("Somente versão pública atual")); expect(screen.getByText(/3 de 4 versões/)).toBeInTheDocument(); });
  it("shows contextual empty state", async () => { renderAt(`${ADMIN_ROUTES.history}?scenario=empty`); expect(await screen.findByRole("heading", { name: "Nenhuma versão encontrada" })).toBeInTheDocument(); });
  it("renders an immutable historical detail", async () => { renderAt(`${ADMIN_ROUTES.history}/history-banner-v0`); expect(await screen.findByRole("heading", { level: 1, name: "Versão editorial v0" })).toBeInTheDocument(); expect(screen.getByText(/nunca é editado diretamente/)).toBeInTheDocument(); expect(screen.queryByRole("textbox")).not.toBeInTheDocument(); });
  it("restores as a draft and offers the correct editor", async () => { const user = userEvent.setup(); renderAt(`${ADMIN_ROUTES.history}/history-banner-v0`); await user.click(await screen.findByRole("button", { name: "Restaurar como novo rascunho" })); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Restaurar como novo rascunho" })); expect(await screen.findByText(/Novo rascunho criado/)).toBeInTheDocument(); expect(screen.getByRole("link", { name: "Abrir novo rascunho" })).toHaveAttribute("href", expect.stringContaining("scenario=restored")); });
  it("blocks restore without capability", async () => { renderAt(`${ADMIN_ROUTES.history}/history-banner-v0?scenario=readonly`); expect(await screen.findByRole("button", { name: "Restaurar como novo rascunho" })).toBeDisabled(); expect(screen.getByText(/capability site.home.version.restore ausente/)).toBeInTheDocument(); });
});
