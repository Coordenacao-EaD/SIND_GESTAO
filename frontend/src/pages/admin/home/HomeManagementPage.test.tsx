import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomeManagementPage from "./HomeManagementPage";

function renderAdmin(path = "/admin/home") {
  return render(<MemoryRouter initialEntries={[path]}><HomeManagementPage /></MemoryRouter>);
}

afterEach(() => vi.restoreAllMocks());

describe("HomeManagementPage", () => {
  it("renders the administrative route without the public navigation", () => {
    renderAdmin();
    expect(screen.getByRole("heading", { level: 1, name: "Página Inicial" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação administrativa" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Menu principal" })).not.toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Nenhuma alteração é persistida");
  });

  it("reuses the administrative banner contract in the form and preview", () => {
    renderAdmin();
    expect(screen.getByRole("heading", { name: "Banner principal" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Título do banner/)).toHaveValue("Juntos somos mais fortes.");
    expect(screen.getByRole("heading", { level: 3, name: "Juntos somos mais fortes." })).toBeInTheDocument();
    expect(screen.getByText("hero-union-1672")).toBeInTheDocument();
  });

  it("updates the administrative preview while editing", async () => {
    const user = userEvent.setup();
    renderAdmin();
    const title = screen.getByLabelText(/^Título do banner/);
    await user.clear(title);
    await user.type(title, "Servidor público em primeiro lugar");
    expect(screen.getByRole("heading", { level: 3, name: "Servidor público em primeiro lugar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar rascunho" })).toBeEnabled();
  });

  it("switches between disabled, internal and external CTA contracts", async () => {
    const user = userEvent.setup();
    renderAdmin();
    const mode = screen.getByLabelText(/^Tipo de CTA/);
    await user.selectOptions(mode, "disabled");
    expect(screen.queryByLabelText(/^Texto do botão/)).not.toBeInTheDocument();
    await user.selectOptions(mode, "external");
    expect(screen.getByLabelText(/^URL de destino/)).toHaveValue("https://");
    await user.selectOptions(mode, "internal");
    expect(screen.getByLabelText(/^Página de destino/)).toBeInTheDocument();
  });

  it("simulates saving a draft only in repository memory", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    renderAdmin();
    await user.type(screen.getByLabelText(/^Título do banner/), " atualizado");
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    expect(await screen.findByText("Rascunho salvo somente na memória desta demonstração.")).toBeInTheDocument();
    expect(screen.getByText("r1")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("simulates sending changed content to review", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await user.type(screen.getByLabelText(/^Descrição/), " Conteúdo revisado.");
    await user.click(screen.getByRole("button", { name: "Enviar para revisão" }));
    expect(await screen.findByText(/Banner enviado para uma revisão simulada/)).toBeInTheDocument();
    expect(screen.getByText("Em revisão")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Título do banner/)).toBeDisabled();
  });

  it("shows local 422 validation with an associated field message", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await user.clear(screen.getByLabelText(/^Título do banner/));
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("422");
    expect(screen.getByLabelText(/^Título do banner/)).toHaveAttribute("aria-invalid", "true");
  });

  it.each([
    ["loading", "Carregando gestão da Home"],
    ["empty", "Nenhum banner configurado"],
    ["unauthenticated", "401"],
    ["forbidden", "403"],
    ["conflict", "409"],
    ["validation", "422"],
  ])("represents the %s administrative state", (scenario, expected) => {
    renderAdmin(`/admin/home?scenario=${scenario}`);
    if (["401", "403", "409", "422"].includes(expected)) {
      expect(screen.getByRole("alert")).toHaveTextContent(expected);
    } else {
      expect(screen.getByRole("heading", { name: expected })).toBeInTheDocument();
    }
  });

  it("returns from an error representation to the deterministic demo", async () => {
    const user = userEvent.setup();
    renderAdmin("/admin/home?scenario=conflict");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Banner principal" })).toBeInTheDocument());
  });

  it("keeps unfinished content areas explicitly outside the active interface", () => {
    renderAdmin();
    const navigation = screen.getByRole("navigation", { name: "Navegação administrativa" });
    expect(within(navigation).queryByText(/Contatos|Redes sociais/)).not.toBeInTheDocument();
    expect(screen.getByText(/Contatos, redes sociais e revisão completa/)).toBeInTheDocument();
  });
});
