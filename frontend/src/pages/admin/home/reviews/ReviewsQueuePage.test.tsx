import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_ROUTES } from "../../../../config/routes";
import ReviewsQueuePage from "./ReviewsQueuePage";

function renderQueue(scenario?: string) {
  const search = scenario ? `?scenario=${scenario}` : "";
  return render(
    <MemoryRouter initialEntries={[`${ADMIN_ROUTES.reviews}${search}`]}>
      <Routes>
        <Route element={<ReviewsQueuePage />} path={ADMIN_ROUTES.reviews} />
      </Routes>
    </MemoryRouter>,
  );
}

function queueItems() {
  return screen.queryAllByRole("listitem").filter((item) => within(item).queryByRole("link", { name: /Analisar revisão/ }));
}

/** O identificador do ciclo é o primeiro `dd` de cada item da fila. */
function queueIds() {
  return queueItems().map((item) => item.querySelectorAll("dd")[0]?.textContent ?? "");
}

afterEach(() => vi.restoreAllMocks());

describe("F2.2C reviews queue", () => {
  it("renders the queue route with a single main and a single h1", () => {
    renderQueue();
    expect(screen.getByRole("heading", { level: 1, name: "Revisões da Página Inicial" })).toBeInTheDocument();
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("reaches the queue from the administrative menu instead of a coming-soon label", () => {
    renderQueue();
    const navigation = screen.getByRole("navigation", { name: "Navegação administrativa" });
    expect(within(navigation).getByRole("link", { name: /Revisões/ })).toHaveAttribute("href", ADMIN_ROUTES.reviews);
    expect(screen.getByText(/Histórico e restauração/)).toBeInTheDocument();
    expect(screen.queryByText("Revisão completa")).not.toBeInTheDocument();
  });

  it("lists the three content types among the pending reviews", () => {
    renderQueue();
    expect(queueItems()).toHaveLength(3);
    ["Banner", "Contatos", "Redes sociais"].forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  it("shows author, submitter, versions, date and a shortened hash for each review", () => {
    renderQueue();
    const first = queueItems()[0]!;
    const values = [...first.querySelectorAll("dd")].map((node) => node.textContent);
    expect(values).toEqual([
      "review-banner-1",
      "v2",
      "v1",
      "Ana Editora",
      "Bruno Editor",
      "02/08/2026, 09:00",
      "v2",
      "Revisor independente",
    ]);
    const labels = [...first.querySelectorAll("dt")].map((node) => node.textContent);
    expect(labels).toContain("Hash submetido");
    expect(labels).toContain("Versão pública vigente");
  });

  it("filters by decision", async () => {
    const user = userEvent.setup();
    renderQueue();
    await user.selectOptions(screen.getByLabelText("Situação"), "approved");
    expect(queueIds()).toEqual(["review-banner-2"]);
  });

  it("filters by content type", async () => {
    const user = userEvent.setup();
    renderQueue();
    await user.selectOptions(screen.getByLabelText("Tipo de conteúdo"), "footer_contacts");
    expect(queueIds()).toEqual(["review-contacts-1"]);
  });

  it("filters by the actor responsible for the submission", async () => {
    const user = userEvent.setup();
    renderQueue();
    await user.selectOptions(screen.getByLabelText("Responsável pelo envio"), "actor-editor-1");
    expect(queueIds()).toEqual(["review-contacts-1"]);
  });

  it("filters to only the reviews the simulated author may decide", async () => {
    const user = userEvent.setup();
    renderQueue("author");
    await user.click(screen.getByLabelText("Somente itens que posso revisar"));
    expect(queueIds()).toEqual(["review-social-1"]);
  });

  it("shows a contextual empty state when no review matches the filters", async () => {
    const user = userEvent.setup();
    renderQueue();
    await user.selectOptions(screen.getByLabelText("Situação"), "cancelled");
    await user.selectOptions(screen.getByLabelText("Tipo de conteúdo"), "banner");
    expect(screen.getByRole("heading", { name: /Nenhum resultado para os filtros atuais/ })).toBeInTheDocument();
    expect(queueItems()).toHaveLength(0);
  });

  it("restores the full scenario list when filters are cleared", async () => {
    const user = userEvent.setup();
    renderQueue();
    await user.selectOptions(screen.getByLabelText("Tipo de conteúdo"), "banner");
    expect(queueItems()).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: /Limpar filtros/ }));
    expect(queueItems()).toHaveLength(7);
  });

  it("announces the visible count without shouting every keystroke", async () => {
    const user = userEvent.setup();
    renderQueue();
    expect(screen.getByRole("status")).toHaveTextContent("3 de 7 revisões em exibição.");
    await user.selectOptions(screen.getByLabelText("Tipo de conteúdo"), "banner");
    expect(screen.getByRole("status")).toHaveTextContent("1 de 7 revisões em exibição.");
  });

  it("flags a diverging hash directly in the queue", () => {
    renderQueue("hash_mismatch");
    expect(within(queueItems()[0]!).getByText("Hash divergente")).toBeInTheDocument();
  });

  it("flags a diverging version directly in the queue", () => {
    renderQueue("version_mismatch");
    expect(within(queueItems()[0]!).getByText("Versão divergente")).toBeInTheDocument();
  });

  it("represents the loading state without exposing the queue", () => {
    renderQueue("loading");
    expect(screen.getByRole("heading", { name: "Carregando revisões" })).toBeInTheDocument();
    expect(queueItems()).toHaveLength(0);
  });

  it("represents an empty queue with a contextual state", () => {
    renderQueue("empty");
    expect(screen.getByRole("heading", { name: "Nenhuma revisão neste cenário" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao painel" })).toHaveAttribute("href", ADMIN_ROUTES.home);
  });

  it("represents 401 without listing reviews", () => {
    renderQueue("unauthenticated");
    expect(screen.getByRole("alert")).toHaveTextContent("401");
    expect(queueItems()).toHaveLength(0);
  });

  it("represents 403 without listing reviews", () => {
    renderQueue("forbidden");
    expect(screen.getByRole("alert")).toHaveTextContent("403");
    expect(queueItems()).toHaveLength(0);
  });

  it("offers a retry path when the service is unavailable", () => {
    renderQueue("unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent(/indisponível/i);
    expect(screen.getByRole("button", { name: /Tentar novamente/ })).toBeInTheDocument();
  });

  it("represents an unexpected error without internal details", () => {
    renderQueue("unexpected");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Não foi possível/);
    expect(alert.textContent).not.toMatch(/stack|Error:|at \w+\./i);
  });

  it("shows the simulated identity and its capabilities", () => {
    renderQueue();
    const identity = screen.getByRole("region", { name: "Identidade simulada" });
    expect(within(identity).getByText("Carla Revisora")).toBeInTheDocument();
    expect(within(identity).getByText("site.home.review")).toBeInTheDocument();
    expect(within(identity).getByText(/A autorização real será implementada na F3/)).toBeInTheDocument();
  });

  it("gives every queue action a unique accessible name", () => {
    renderQueue();
    const names = screen.getAllByRole("link", { name: /Analisar revisão/ }).map((link) => link.textContent);
    expect(new Set(names).size).toBe(names.length);
  });

  it("does not call fetch or browser storage", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();
    renderQueue();
    await user.selectOptions(screen.getByLabelText("Situação"), "approved");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });
});
