import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeDataProvider } from "./HomeDataProvider";
import { HomePage } from "./HomePage";
import type { HomeRepository } from "./services/home.repository";
import { HomeMockRepository } from "./services/home.mock.repository";
import {
  homePageDataEmptyNewsMock,
  homePageDataEmptyDocumentsMock,
  homePageDataEmptyNoticesMock,
  homePageDataMock,
  homePageDataPartialErrorMock,
} from "./mocks/home.mock";
import type { HomePageData } from "./types/home.types";

function renderHomePage(repository: HomeRepository) {
  return render(
    <MemoryRouter>
      <HomeDataProvider repository={repository}>
        <HomePage />
      </HomeDataProvider>
    </MemoryRouter>,
  );
}

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

describe("HomePage", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("renders the hero content once data resolves", async () => {
    renderHomePage(new HomeMockRepository("default"));

    expect(await screen.findByRole("heading", { level: 1, name: homePageDataMock.hero.title })).toBeInTheDocument();
    expect(screen.getByText(homePageDataMock.hero.description)).toBeInTheDocument();
  });

  it("returns a complete footer contract from the default repository", async () => {
    const data = await new HomeMockRepository("default").getHomePage();

    expect(data.footer.institutionName).toBeTruthy();
    expect(data.footer.linkGroups.length).toBeGreaterThan(0);
    expect(data.footer.linkGroups.every((group) => group.links.length > 0)).toBe(true);
    expect(data.footer.phone).toBeTruthy();
    expect(data.footer.email).toBeTruthy();
    expect(data.footer.address).toBeTruthy();
    expect(data.footer.socialLinks.length).toBeGreaterThan(0);
    expect(data.footer.privacyPolicyHref).toBeTruthy();
    expect(data.footer.termsOfUseHref).toBeTruthy();
    expect(data.footer.copyrightLabel).toBeTruthy();
  });

  it("renders the footer delivered by HomeRepository after the Home content", async () => {
    renderHomePage(new HomeMockRepository("default"));

    const footer = await screen.findByRole("contentinfo");
    expect(within(footer).getByText(homePageDataMock.footer.institutionName)).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: homePageDataMock.footer.phone })).toBeInTheDocument();
    expect(within(footer).getByRole("navigation", {
      name: homePageDataMock.footer.linkGroups[0]!.title,
    })).toBeInTheDocument();
  });

  it("renders every Home section for the default scenario", async () => {
    renderHomePage(new HomeMockRepository("default"));

    await screen.findByRole("heading", { level: 1 });

    expect(screen.getByRole("heading", { name: "Últimas Notícias" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comunicados Recentes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: homePageDataMock.about.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documentos Importantes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: homePageDataMock.membershipCta.title })).toBeInTheDocument();
  });

  it("preserves a news image accessible name when loading fails", async () => {
    const { container } = renderHomePage(new HomeMockRepository("default"));
    const news = homePageDataMock.news.status === "ready" ? homePageDataMock.news.data[0] : undefined;

    if (!news) {
      throw new Error("The default Home mock must include at least one news item.");
    }

    const image = await screen.findByRole("img", { name: news.imageAlt });
    fireEvent.error(image);

    expect(container.querySelector(`img[alt="${news.imageAlt}"]`)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: news.imageAlt })).toBeInTheDocument();
  });

  it("points hero CTAs at the routes configured in the mock", async () => {
    renderHomePage(new HomeMockRepository("default"));
    await screen.findByRole("heading", { level: 1 });

    const primary = screen.getByRole("link", { name: homePageDataMock.hero.primaryAction.label });
    const secondary = screen.getByRole("link", { name: homePageDataMock.hero.secondaryAction.label });

    expect(primary).toHaveAttribute("href", homePageDataMock.hero.primaryAction.href);
    expect(secondary).toHaveAttribute("href", homePageDataMock.hero.secondaryAction.href);
  });

  it("shows the loading state before data resolves", () => {
    const pendingRepository: HomeRepository = {
      getHomePage: () => new Promise<HomePageData>(() => {}),
    };
    renderHomePage(pendingRepository);

    expect(screen.getByText("Carregando a Página Inicial...")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Página Inicial" })).toBeInTheDocument();
    expect(screen.queryByText(homePageDataMock.hero.title)).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("replaces the global loading state with final content after the repository resolves", async () => {
    const deferred = createDeferred<HomePageData>();
    const repository: HomeRepository = { getHomePage: () => deferred.promise };
    renderHomePage(repository);

    expect(screen.getByText("Carregando a Página Inicial...")).toBeInTheDocument();
    expect(screen.queryByText(homePageDataMock.hero.title)).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();

    await act(async () => deferred.resolve(homePageDataMock));

    expect(await screen.findByRole("heading", { level: 1, name: homePageDataMock.hero.title })).toBeInTheDocument();
    expect(screen.queryByText("Carregando a Página Inicial...")).not.toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("keeps other content available while one section is loading", async () => {
    const repository: HomeRepository = {
      getHomePage: async () => ({
        ...homePageDataMock,
        news: { status: "loading" },
      }),
    };
    renderHomePage(repository);

    expect(await screen.findByText("Carregando notícias...")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comunicados Recentes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: homePageDataMock.membershipCta.title })).toBeInTheDocument();
  });

  it("shows an empty state for a section with no items, without breaking the rest of the page", async () => {
    const repository: HomeRepository = { getHomePage: async () => homePageDataEmptyNewsMock };
    renderHomePage(repository);

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Nenhuma notícia publicada")).toBeInTheDocument();
    const newsSection = screen.getByRole("region", { name: "Últimas Notícias" });
    expect(within(newsSection).queryByRole("link", { name: "Ver todas as notícias" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comunicados Recentes" })).toBeInTheDocument();
  });

  it("renders an empty notices state without hiding news", async () => {
    renderHomePage({ getHomePage: async () => homePageDataEmptyNoticesMock });

    expect(await screen.findByText("Nenhum comunicado publicado")).toBeInTheDocument();
    const noticesSection = screen.getByRole("region", { name: "Comunicados Recentes" });
    expect(within(noticesSection).queryByRole("link", { name: "Ver todos os comunicados" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Últimas Notícias" })).toBeInTheDocument();
  });

  it("renders an empty documents state without an orphan action or broken label", async () => {
    renderHomePage({ getHomePage: async () => homePageDataEmptyDocumentsMock });

    expect(await screen.findByText("Os documentos aparecerão aqui em breve.")).toBeInTheDocument();
    const documentsSection = screen.getByRole("region", { name: "Documentos Importantes" });
    expect(within(documentsSection).queryByRole("link", { name: "Ver documentos" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Últimas Notícias" })).toBeInTheDocument();
  });

  it("omits the quick-links region when the collection is empty and preserves the Home", async () => {
    renderHomePage({
      getHomePage: async () => ({ ...homePageDataMock, quickLinks: [] }),
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: homePageDataMock.hero.title }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Acesso rápido aos serviços" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Últimas Notícias" })).toBeInTheDocument();
  });

  it("shows a partial section error without taking down the whole Home page", async () => {
    const repository: HomeRepository = { getHomePage: async () => homePageDataPartialErrorMock };
    renderHomePage(repository);

    await screen.findByRole("heading", { level: 1 });
    expect(await screen.findByRole("alert")).toHaveTextContent(homePageDataPartialErrorMock.notices.status === "error" ? homePageDataPartialErrorMock.notices.message : "");
    // Hero and other sections are unaffected by the notices failure.
    expect(screen.getByRole("heading", { name: "Últimas Notícias" })).toBeInTheDocument();
  });

  it("shows a full-page error state when the repository rejects, with a working retry", async () => {
    const user = userEvent.setup();
    let callCount = 0;
    const repository: HomeRepository = {
      getHomePage: () => {
        callCount += 1;
        return callCount === 1 ? Promise.reject(new Error("boom")) : Promise.resolve(homePageDataMock);
      },
    };
    renderHomePage(repository);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Não foi possível carregar a Página Inicial no momento.");
    expect(alert).not.toHaveTextContent("boom");
    expect(screen.getByRole("heading", { level: 1, name: "Erro ao carregar a Página Inicial" })).toBeInTheDocument();
    expect(screen.queryByText(homePageDataMock.hero.title)).not.toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(callCount).toBe(2));
    expect(await screen.findByRole("heading", { level: 1, name: homePageDataMock.hero.title })).toBeInTheDocument();
  });

  it("never issues a network request while loading Home data", async () => {
    renderHomePage(new HomeMockRepository("default"));
    await screen.findByRole("heading", { level: 1 });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("finishes the normal Home flow without unexpected console errors or warnings", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      renderHomePage(new HomeMockRepository("default"));
      expect(
        await screen.findByRole("heading", { level: 1, name: homePageDataMock.hero.title }),
      ).toBeInTheDocument();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });

  it("updates both hero and footer when the HomeRepository implementation changes", async () => {
    const alternateFooter = {
      ...homePageDataMock.footer,
      institutionName: "Sindicato Alternativo",
      shortDescription: "Conteúdo fornecido por outro adaptador.",
      linkGroups: [
        {
          title: "Navegação alternativa",
          links: [{ label: "Página alternativa", href: "/" as const }],
        },
      ],
      phone: "(65) 99999-0000",
      email: "alternativo@example.org",
      address: "Endereço alternativo",
      socialLinks: [
        { id: "alternate-social", label: "Rede alternativa", href: "https://example.org/social" },
      ],
      privacyPolicyHref: "/politica-alternativa",
      termsOfUseHref: "/termos-alternativos",
      copyrightLabel: "Rodapé alternativo.",
    };
    const customRepository: HomeRepository = {
      getHomePage: async () => ({
        ...homePageDataMock,
        hero: { ...homePageDataMock.hero, title: "Título alternativo de teste" },
        footer: alternateFooter,
      }),
    };
    renderHomePage(customRepository);

    expect(await screen.findByRole("heading", { level: 1, name: "Título alternativo de teste" })).toBeInTheDocument();
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(alternateFooter.institutionName)).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: alternateFooter.phone })).toHaveAttribute(
      "href",
      "tel:65999990000",
    );
    expect(within(footer).getByRole("navigation", {
      name: "Navegação alternativa",
    })).toBeInTheDocument();
    expect(within(footer).getByRole("link", {
      name: "Rede alternativa (abre em uma nova aba)",
    })).toHaveAttribute("href", "https://example.org/social");
    expect(within(footer).getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute(
      "href",
      alternateFooter.privacyPolicyHref,
    );
    expect(within(footer).getByRole("link", { name: "Termos de Uso" })).toHaveAttribute(
      "href",
      alternateFooter.termsOfUseHref,
    );
    expect(within(footer).queryByText(homePageDataMock.footer.institutionName)).not.toBeInTheDocument();
    expect(within(footer).queryByText(homePageDataMock.footer.phone)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", {
      level: 1,
      name: homePageDataMock.hero.title,
    })).not.toBeInTheDocument();
  });
});
