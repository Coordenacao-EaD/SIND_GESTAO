import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SafeLink } from "./SafeLink";

function renderLink(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("SafeLink", () => {
  // 1-2. Rota interna
  it("uses the SPA router for a valid internal route", () => {
    renderLink(<SafeLink href="/noticias">Notícias</SafeLink>);
    const link = screen.getByRole("link", { name: "Notícias" });
    expect(link).toHaveAttribute("href", "/noticias");
  });

  it("does not open a new tab for an internal route", () => {
    renderLink(<SafeLink href="/filie-se">Filie-se</SafeLink>);
    const link = screen.getByRole("link", { name: "Filie-se" });
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  // 3-6. URL externa
  it("renders a real anchor for an HTTPS external destination", () => {
    renderLink(<SafeLink href="https://example.org/comunicado">Comunicado</SafeLink>);
    const link = screen.getByRole("link", { name: /Comunicado/ });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "https://example.org/comunicado");
  });

  it("opens an external destination in a new tab", () => {
    renderLink(<SafeLink href="https://example.org/comunicado">Comunicado</SafeLink>);
    const link = screen.getByRole("link", { name: /Comunicado/ });
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("protects an external destination with rel=noopener noreferrer", () => {
    renderLink(<SafeLink href="https://example.org/comunicado">Comunicado</SafeLink>);
    const link = screen.getByRole("link", { name: /Comunicado/ });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("keeps noopener and noreferrer in rel even when an aria-label is provided", () => {
    renderLink(
      <SafeLink href="https://example.org" ariaLabel="Site institucional">
        Saiba mais
      </SafeLink>,
    );
    const link = screen.getByRole("link", { name: /Site institucional/ });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("gives external links an accessible new-tab indication", () => {
    renderLink(<SafeLink href="https://example.org/comunicado">Comunicado</SafeLink>);
    expect(screen.getByRole("link", { name: /Comunicado.*abre em uma nova aba/ })).toBeInTheDocument();
  });

  it("does not visually duplicate the new-tab text when aria-label already carries it", () => {
    renderLink(
      <SafeLink href="https://example.org" ariaLabel="Facebook">
        F
      </SafeLink>,
    );
    const link = screen.getByRole("link", { name: "Facebook (abre em uma nova aba)" });
    expect(link).toHaveTextContent("F");
    expect(link.textContent).toBe("F");
  });

  // 7-9. Destinos especiais (fora do contrato do SafeLink)
  it("does not render an actionable link for mailto: (outside the SafeLink contract)", () => {
    renderLink(<SafeLink href="mailto:contato@sindicato.org">E-mail</SafeLink>);
    expect(screen.queryByRole("link", { name: /E-mail/ })).not.toBeInTheDocument();
    expect(screen.getByText("E-mail")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not render an actionable link for tel: (outside the SafeLink contract)", () => {
    renderLink(<SafeLink href="tel:+551140028922">Telefone</SafeLink>);
    expect(screen.queryByRole("link", { name: /Telefone/ })).not.toBeInTheDocument();
    expect(screen.getByText("Telefone")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not render an actionable link for a bare fragment (outside the SafeLink contract)", () => {
    renderLink(<SafeLink href="#conteudo">Ir para o conteúdo</SafeLink>);
    expect(screen.queryByRole("link", { name: /Ir para o conteúdo/ })).not.toBeInTheDocument();
    expect(screen.getByText("Ir para o conteúdo")).toHaveAttribute("aria-disabled", "true");
  });

  // 10-14. Destinos inválidos / protocolos perigosos
  it("renders no actionable link for an empty string destination", () => {
    renderLink(<SafeLink href="">Vazio</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Vazio")).toHaveAttribute("aria-disabled", "true");
  });

  it("renders no actionable link for a whitespace-only destination", () => {
    renderLink(<SafeLink href="   ">Espaços</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Espaços")).toHaveAttribute("aria-disabled", "true");
  });

  it("rejects a javascript: destination", () => {
    renderLink(<SafeLink href="javascript:alert(1)">Perigoso</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Perigoso")).toHaveAttribute("aria-disabled", "true");
  });

  it("rejects a data: destination", () => {
    renderLink(<SafeLink href="data:text/html,<script>alert(1)</script>">Perigoso</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Perigoso")).toHaveAttribute("aria-disabled", "true");
  });

  it("rejects an unknown protocol", () => {
    renderLink(<SafeLink href="ftp://example.org/arquivo">Arquivo</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Arquivo")).toHaveAttribute("aria-disabled", "true");
  });

  it("rejects a malformed URL", () => {
    renderLink(<SafeLink href="https://">Malformado</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Malformado")).toHaveAttribute("aria-disabled", "true");
  });

  it("rejects an unprotected http: destination", () => {
    renderLink(<SafeLink href="http://example.org">Inseguro</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Inseguro")).toHaveAttribute("aria-disabled", "true");
  });

  it("rejects an external host with no protocol", () => {
    renderLink(<SafeLink href="example.org/pagina">Sem protocolo</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Sem protocolo")).toHaveAttribute("aria-disabled", "true");
  });

  it("rejects an external host disguised as an internal route via backslashes", () => {
    renderLink(<SafeLink href="/\\evil.com">Disfarçado</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Disfarçado")).toHaveAttribute("aria-disabled", "true");
  });

  it("rejects an external host disguised as an internal route via a tab character", () => {
    renderLink(<SafeLink href={"/\t/evil.com"}>Disfarçado</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Disfarçado")).toHaveAttribute("aria-disabled", "true");
  });

  it("rejects a protocol-relative destination (//)", () => {
    renderLink(<SafeLink href="//evil.com">Disfarçado</SafeLink>);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Disfarçado")).toHaveAttribute("aria-disabled", "true");
  });

  it("does not render a link when explicitly disabled", () => {
    renderLink(
      <SafeLink href="/area-do-filiado" disabled>
        Indisponível
      </SafeLink>,
    );
    expect(screen.queryByRole("link", { name: "Indisponível" })).not.toBeInTheDocument();
    expect(screen.getByText("Indisponível")).toHaveAttribute("aria-disabled", "true");
  });

  // 15-17. Preservação de props / acessibilidade
  it("preserves className and content for a valid internal link", () => {
    renderLink(
      <SafeLink href="/noticias" className="nav-link">
        Notícias
      </SafeLink>,
    );
    const link = screen.getByRole("link", { name: "Notícias" });
    expect(link).toHaveClass("nav-link");
    expect(link).toHaveTextContent("Notícias");
  });

  it("never produces an actionable element without href for an invalid destination", () => {
    renderLink(<SafeLink href="javascript:alert(1)">Perigoso</SafeLink>);
    const span = screen.getByText("Perigoso");
    expect(span.tagName).toBe("SPAN");
    expect(span).not.toHaveAttribute("href");
  });

  it("never renders a focusable control without an accessible name", () => {
    renderLink(
      <SafeLink href="https://example.org" ariaLabel="Instagram">
        <strong aria-hidden="true">I</strong>
      </SafeLink>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAccessibleName();
  });
});
