import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { footerDataMock } from "../../pages/home/mocks/home.mock";
import type { FooterData } from "../../pages/home/types/home.types";
import { SiteFooter } from "./SiteFooter";

function renderFooter(data: FooterData = footerDataMock) {
  return render(
    <MemoryRouter>
      <SiteFooter data={data} />
    </MemoryRouter>,
  );
}

describe("SiteFooter", () => {
  it("renders the institutional brand, contact, navigation groups, legal links, and copyright", () => {
    renderFooter();
    const footer = screen.getByRole("contentinfo");

    expect(within(footer).getAllByText(footerDataMock.institutionName).length).toBeGreaterThan(0);
    expect(within(footer).getByRole("heading", { name: "Contato" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: footerDataMock.phone })).toHaveAttribute(
      "href",
      `tel:${footerDataMock.phone.replace(/\D/g, "")}`,
    );
    expect(within(footer).getByRole("link", { name: footerDataMock.email })).toHaveAttribute(
      "href",
      `mailto:${footerDataMock.email}`,
    );

    footerDataMock.linkGroups.forEach((group) => {
      const navigation = within(footer).getByRole("navigation", { name: group.title });
      group.links.forEach((link) => {
        expect(within(navigation).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
      });
    });

    expect(within(footer).getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute(
      "href",
      footerDataMock.privacyPolicyHref,
    );
    expect(within(footer).getByRole("link", { name: "Termos de Uso" })).toHaveAttribute(
      "href",
      footerDataMock.termsOfUseHref,
    );
    expect(within(footer).getByText(footerDataMock.copyrightLabel)).toBeInTheDocument();
  });

  it("protects every external social link and gives it a contextual accessible name", () => {
    const { container } = renderFooter();

    footerDataMock.socialLinks.forEach((social) => {
      expect(screen.getByRole("link", {
        name: `${social.label} (abre em uma nova aba)`,
      })).toBeInTheDocument();
      const links = [
        ...container.querySelectorAll<HTMLAnchorElement>(
          `a[aria-label="${social.label} (abre em uma nova aba)"]`,
        ),
      ];
      expect(links).toHaveLength(2);
      links.forEach((link) => {
        expect(link).toHaveAttribute("href", social.href);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    const links = [...container.querySelectorAll<HTMLAnchorElement>("a")];
    expect(links.every((link) => Boolean(link.getAttribute("href")))).toBe(true);
    expect(links.every((link) => !link.getAttribute("href")?.startsWith("http://"))).toBe(true);
  });

  it("does not render empty social regions when no social links are provided", () => {
    renderFooter({ ...footerDataMock, socialLinks: [] });

    expect(screen.queryByRole("list", { name: "Redes sociais" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contato" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Política de Privacidade" })).toBeInTheDocument();
  });

  it("omits empty optional blocks without leaving orphan headings or regions", () => {
    renderFooter({
      ...footerDataMock,
      shortDescription: undefined,
      linkGroups: [{ title: "Grupo vazio", links: [] }],
      phone: "",
      email: "",
      address: "",
      socialLinks: [],
      privacyPolicyHref: "",
      termsOfUseHref: "",
    });

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText(footerDataMock.institutionName)).toBeInTheDocument();
    expect(screen.queryByText(footerDataMock.shortDescription ?? "")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Grupo vazio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Contato" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Política de Privacidade" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Termos de Uso" })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Redes sociais" })).not.toBeInTheDocument();
    expect(screen.getByText(footerDataMock.copyrightLabel)).toBeInTheDocument();
  });

  it("renders invalid configured destinations as non-actionable content", () => {
    renderFooter({
      ...footerDataMock,
      linkGroups: [
        {
          title: "Links configuráveis",
          links: [{ label: "Destino inválido", href: "javascript:alert(1)" as never }],
        },
      ],
      socialLinks: [{ id: "unsafe", label: "Rede insegura", href: "http://example.com" }],
      privacyPolicyHref: "javascript:alert(1)",
      termsOfUseHref: "",
      phone: "telefone inválido",
      email: "email-inválido",
    });

    expect(screen.queryByRole("link", { name: "Destino inválido" })).not.toBeInTheDocument();
    expect(screen.getByText("Destino inválido")).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("link", { name: /Rede insegura/ })).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Rede insegura")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Política de Privacidade" })).not.toBeInTheDocument();
    expect(screen.getByText("Política de Privacidade")).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("link", { name: "telefone inválido" })).not.toBeInTheDocument();
    expect(screen.getByText("telefone inválido")).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("link", { name: "email-inválido" })).not.toBeInTheDocument();
    expect(screen.getByText("email-inválido")).toHaveAttribute("aria-disabled", "true");
  });
});
