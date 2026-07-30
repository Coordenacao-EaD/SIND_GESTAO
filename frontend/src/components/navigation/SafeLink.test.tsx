import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SafeLink } from "./SafeLink";

describe("SafeLink", () => {
  it("uses the SPA router for an internal destination", () => {
    render(
      <MemoryRouter>
        <SafeLink href="/noticias">Notícias</SafeLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Notícias" })).toHaveAttribute("href", "/noticias");
  });

  it("protects an external HTTPS destination", () => {
    render(
      <MemoryRouter>
        <SafeLink href="https://example.org/comunicado">Comunicado</SafeLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: "Comunicado" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not create a link for a disabled or unsafe destination", () => {
    render(
      <MemoryRouter>
        <SafeLink href="http://example.org" disabled>Indisponível</SafeLink>
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: "Indisponível" })).not.toBeInTheDocument();
    expect(screen.getByText("Indisponível")).toHaveAttribute("aria-disabled", "true");
  });
});
