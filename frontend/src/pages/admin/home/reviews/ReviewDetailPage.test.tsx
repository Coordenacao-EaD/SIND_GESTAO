import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_ROUTES } from "../../../../config/routes";
import ReviewDetailPage from "./ReviewDetailPage";

function renderDetail(reviewId = "review-banner-1", scenario?: string) {
  const search = scenario ? `?scenario=${scenario}` : "";
  return render(
    <MemoryRouter initialEntries={[`${ADMIN_ROUTES.reviews}/${reviewId}${search}`]}>
      <Routes>
        <Route element={<ReviewDetailPage />} path={ADMIN_ROUTES.reviewDetail} />
      </Routes>
    </MemoryRouter>,
  );
}

function decisionPanel() {
  return screen.getByRole("region", { name: "Decisão" });
}

function comparisonRow(label: string) {
  return screen.getByRole("rowheader", { name: label }).closest("tr")!;
}

async function openDialogAndConfirm(
  user: ReturnType<typeof userEvent.setup>,
  trigger: string | RegExp,
  opinion?: string,
) {
  await user.click(within(decisionPanel()).getByRole("button", { name: trigger }));
  const dialog = await screen.findByRole("dialog");
  if (opinion !== undefined) await user.type(within(dialog).getByRole("textbox"), opinion);
  await user.click(within(dialog).getByRole("button", { name: /Aprovar revisão|Solicitar ajustes/ }));
  return dialog;
}

afterEach(() => vi.restoreAllMocks());

describe("F2.2C review detail", () => {
  it("renders an existing review with one main and one h1", () => {
    renderDetail();
    expect(screen.getByRole("heading", { level: 1, name: "Detalhe da revisão" })).toBeInTheDocument();
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("shows submission data, integrity and the no-publication warning", () => {
    renderDetail();
    const submission = screen.getByRole("region", { name: "Dados da submissão" });
    expect(within(submission).getByText("review-banner-1")).toBeInTheDocument();
    expect(within(submission).getByText("Pendente")).toBeInTheDocument();
    expect(within(submission).getByText("Ana Editora")).toBeInTheDocument();
    expect(within(submission).getByText("Bruno Editor")).toBeInTheDocument();

    const integrity = screen.getByRole("region", { name: "Informações de integridade" });
    // Hash submetido e hash atual coincidem num ciclo íntegro, então ambos exibem o mesmo valor.
    expect(within(integrity).getAllByText("sha256:banner:v2")).toHaveLength(2);
    expect(within(integrity).getByText(/Versão e hash conferem/)).toBeInTheDocument();

    expect(within(decisionPanel()).getByText(/nunca publica o conteúdo/i)).toBeInTheDocument();
  });

  it("presents a contextual not-found state for an unknown reviewId", () => {
    renderDetail("review-inexistente");
    expect(screen.getByRole("heading", { name: "Revisão não encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voltar para a fila de revisões/ }))
      .toHaveAttribute("href", ADMIN_ROUTES.reviews);
    expect(document.body.textContent).not.toBe("");
  });

  it("compares the banner against the current public version", () => {
    renderDetail();
    const comparison = screen.getByRole("region", { name: "Diferenças" });
    expect(within(comparison).getAllByRole("columnheader", { name: "Versão pública" }).length).toBeGreaterThan(0);
    expect(within(comparison).getAllByRole("columnheader", { name: "Conteúdo submetido" }).length).toBeGreaterThan(0);
    const row = comparisonRow("Título");
    expect(within(row).getByText("Juntos somos mais fortes.")).toBeInTheDocument();
    expect(within(row).getByText("Servidor valorizado, cidade mais forte.")).toBeInTheDocument();
    expect(within(row).getByText("Alterado")).toBeInTheDocument();
  });

  it("compares contacts with readable formatting and Não informado", () => {
    renderDetail("review-contacts-1");
    expect(within(comparisonRow("Telefone público")).getByText("(65) 99999-0000")).toBeInTheDocument();
    expect(within(comparisonRow("CEP")).getByText("78123-456")).toBeInTheDocument();
    expect(within(comparisonRow("Horário de atendimento")).getByText("Não informado")).toBeInTheDocument();
  });

  it("compares social links as one complete unit", () => {
    renderDetail("review-social-1");
    const comparison = screen.getByRole("region", { name: "Diferenças" });
    expect(within(comparison).getByText(/unidade completa/i)).toBeInTheDocument();
    expect(within(comparisonRow("Link LinkedIn")).getByText("Adicionado")).toBeInTheDocument();
    expect(within(comparisonRow("Link YouTube")).getByText("Removido")).toBeInTheDocument();
    expect(within(comparisonRow("Ordem das plataformas")).getByText("Alterado")).toBeInTheDocument();
  });

  it("offers a submission preview that states it is not published", () => {
    renderDetail();
    const preview = screen.getByRole("region", { name: "Prévia da submissão — não publicada" });
    expect(within(preview).getByText(/Nenhuma decisão desta tela altera a Home pública/)).toBeInTheDocument();
  });

  it("lets an independent reviewer decide", () => {
    renderDetail();
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeEnabled();
    expect(within(decisionPanel()).getByRole("button", { name: /Solicitar ajustes/ })).toBeEnabled();
  });

  it("blocks the author from approving and explains why", () => {
    renderDetail("review-banner-1", "author");
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeDisabled();
    expect(screen.getByText("Você é o autor deste conteúdo.")).toBeInTheDocument();
    expect(screen.getByText("A segregação de funções impede esta decisão.")).toBeInTheDocument();
  });

  it("blocks the submitter from approving and explains why", () => {
    renderDetail("review-banner-1", "submitter");
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeDisabled();
    expect(screen.getByText("Você enviou este conteúdo para revisão.")).toBeInTheDocument();
  });

  it("blocks a profile without the review capability", () => {
    renderDetail("review-banner-1", "no_review_capability");
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeDisabled();
    expect(screen.getByText(/não possui a capability site.home.review/)).toBeInTheDocument();
  });

  it("blocks a decision when the hash diverges", () => {
    renderDetail("review-banner-1", "hash_mismatch");
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeDisabled();
    expect(screen.getByText(/hash submetido não confere com o atual/)).toBeInTheDocument();
  });

  it("blocks a decision when the version diverges", () => {
    renderDetail("review-banner-1", "version_mismatch");
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeDisabled();
    expect(screen.getByText(/A versão editorial mudou após o envio/)).toBeInTheDocument();
  });

  it("keeps an already approved review read-only", () => {
    renderDetail("review-banner-2");
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeDisabled();
    expect(screen.getByText(/já foi decidida e está em modo somente leitura/)).toBeInTheDocument();
  });

  it("keeps a cancelled review read-only and shows its reason", () => {
    renderDetail("review-social-2");
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeDisabled();
    expect(within(decisionPanel()).getByRole("button", { name: /Solicitar ajustes/ })).toBeDisabled();
    expect(screen.getByText(/Corrigir o rótulo acessível antes de reenviar/)).toBeInTheDocument();
  });

  it("keeps an invalidated review read-only and shows its reason", () => {
    renderDetail("review-banner-3");
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeDisabled();
    const submission = screen.getByRole("region", { name: "Dados da submissão" });
    expect(within(submission).getByText("Motivo da invalidação")).toBeInTheDocument();
    expect(within(submission).getByText("Invalidada")).toBeInTheDocument();
  });

  it("approves a valid review, records the reviewer and never publishes", async () => {
    const user = userEvent.setup();
    renderDetail();
    await openDialogAndConfirm(user, /Aprovar/, "Texto aprovado conforme a comunicação institucional.");

    expect(await screen.findByText("Conteúdo aprovado. A publicação exige uma ação separada.")).toBeInTheDocument();
    const submission = screen.getByRole("region", { name: "Dados da submissão" });
    expect(within(submission).getByText("Aprovada")).toBeInTheDocument();
    expect(within(submission).getByText("Carla Revisora")).toBeInTheDocument();
    // A versão pública vigente permanece intocada.
    expect(within(submission).getByText("v1")).toBeInTheDocument();
  });

  it("blocks a second decision on the same cycle after approving", async () => {
    const user = userEvent.setup();
    renderDetail();
    await openDialogAndConfirm(user, /Aprovar/);
    await screen.findByText(/Conteúdo aprovado/);
    expect(within(decisionPanel()).getByRole("button", { name: /Aprovar/ })).toBeDisabled();
    expect(within(decisionPanel()).getByRole("button", { name: /Solicitar ajustes/ })).toBeDisabled();
  });

  it("requests changes and returns the content to draft", async () => {
    const user = userEvent.setup();
    renderDetail();
    await openDialogAndConfirm(user, /Solicitar ajustes/, "Ajuste o texto complementar antes de reenviar.");

    expect(await screen.findByText(/O conteúdo voltou para rascunho/)).toBeInTheDocument();
    const submission = screen.getByRole("region", { name: "Dados da submissão" });
    expect(within(submission).getByText("Ajustes solicitados")).toBeInTheDocument();
    expect(within(submission).getByText("Rascunho")).toBeInTheDocument();
  });

  it("rejects an empty justification and keeps focus on the field", async () => {
    const user = userEvent.setup();
    renderDetail();
    await user.click(within(decisionPanel()).getByRole("button", { name: /Solicitar ajustes/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Solicitar ajustes" }));

    const textarea = within(dialog).getByRole("textbox");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(document.getElementById(textarea.getAttribute("aria-describedby")!))
      .toHaveTextContent(/entre 10 e 1000 caracteres/);
    expect(textarea).toHaveFocus();
    expect(screen.queryByText(/Ajustes solicitados\./)).not.toBeInTheDocument();
  });

  it("rejects a justification shorter than ten characters", async () => {
    const user = userEvent.setup();
    renderDetail();
    await openDialogAndConfirm(user, /Solicitar ajustes/, "curto");
    expect(within(screen.getByRole("dialog")).getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("accepts approval without an opinion because it is optional", async () => {
    const user = userEvent.setup();
    renderDetail();
    await openDialogAndConfirm(user, /Aprovar/);
    expect(await screen.findByText(/Conteúdo aprovado/)).toBeInTheDocument();
  });

  it("closes the decision dialog with Escape and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    renderDetail();
    const trigger = within(decisionPanel()).getByRole("button", { name: /Aprovar/ });
    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toHaveAttribute("aria-modal", "true");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("does not simulate success on a concurrent decision", async () => {
    const user = userEvent.setup();
    renderDetail("review-banner-1", "concurrent");
    await openDialogAndConfirm(user, /Aprovar/, "Parecer suficiente para aprovar.");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("409");
    expect(alert).toHaveTextContent(/já foi decidida por outra pessoa/);
    expect(screen.queryByText(/Conteúdo aprovado/)).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Dados da submissão" })).getByText("Pendente")).toBeInTheDocument();
  });

  it("offers a reload path after a conflict and shows the most recent state", async () => {
    const user = userEvent.setup();
    renderDetail("review-banner-1", "concurrent");
    await openDialogAndConfirm(user, /Aprovar/, "Parecer suficiente para aprovar.");
    await user.click(await screen.findByRole("button", { name: /Recarregar dados/ }));
    expect(await screen.findByText(/Dados simulados recarregados/)).toBeInTheDocument();
  });

  it("maps a simulated 422 to the opinion field", () => {
    renderDetail("review-banner-1", "validation");
    expect(screen.getByRole("alert")).toHaveTextContent("422");
  });

  it("represents 401 and 403 without decision actions", () => {
    const first = renderDetail("review-banner-1", "unauthenticated");
    expect(screen.getByRole("alert")).toHaveTextContent("401");
    expect(screen.queryByRole("region", { name: "Decisão" })).not.toBeInTheDocument();
    first.unmount();
    renderDetail("review-banner-1", "forbidden");
    expect(screen.getByRole("alert")).toHaveTextContent("403");
    expect(screen.queryByRole("region", { name: "Decisão" })).not.toBeInTheDocument();
  });

  it("represents the loading state", () => {
    renderDetail("review-banner-1", "loading");
    expect(screen.getByRole("heading", { name: "Carregando a revisão" })).toBeInTheDocument();
  });

  it("preserves a typed opinion when the service is unavailable", async () => {
    const user = userEvent.setup();
    renderDetail("review-banner-1", "unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent(/indisponível/i);
    expect(screen.getByRole("link", { name: /Voltar para a fila/ })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Voltar para a fila/ }));
  });

  it("gives every button an accessible name", () => {
    renderDetail();
    screen.getAllByRole("button").forEach((button) => {
      expect(button).toHaveAccessibleName();
    });
  });

  it("does not call fetch or browser storage while deciding", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const storageSpy = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();
    renderDetail();
    await openDialogAndConfirm(user, /Aprovar/, "Parecer suficiente para aprovar.");
    await screen.findByText(/Conteúdo aprovado/);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
  });

  it("keeps the decision out of any published resource", async () => {
    const user = userEvent.setup();
    renderDetail();
    await openDialogAndConfirm(user, /Aprovar/);
    await screen.findByText(/Conteúdo aprovado/);
    // A comparação continua apontando para a mesma versão pública de antes da decisão.
    expect(within(comparisonRow("Título")).getByText("Juntos somos mais fortes.")).toBeInTheDocument();
  });

  it("waits for the reviewer before showing any decision metadata", () => {
    renderDetail();
    const submission = screen.getByRole("region", { name: "Dados da submissão" });
    expect(within(submission).getByText("Nenhum")).toBeInTheDocument();
    expect(within(submission).getByText("Não registrada")).toBeInTheDocument();
  });
});
