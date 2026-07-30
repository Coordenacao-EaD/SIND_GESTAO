import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeDataProvider } from "./HomeDataProvider";
import { HomePage } from "./HomePage";
import type { HomeRepository } from "./services/home.repository";
import { HomeMockRepository } from "./services/home.mock.repository";
import {
  homePageDataEmptyNewsMock,
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

  it("renders every Home section for the default scenario", async () => {
    renderHomePage(new HomeMockRepository("default"));

    await screen.findByRole("heading", { level: 1 });

    expect(screen.getByRole("heading", { name: "Últimas Notícias" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comunicados Recentes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: homePageDataMock.about.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documentos Importantes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: homePageDataMock.membershipCta.title })).toBeInTheDocument();
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
  });

  it("shows an empty state for a section with no items, without breaking the rest of the page", async () => {
    const repository: HomeRepository = { getHomePage: async () => homePageDataEmptyNewsMock };
    renderHomePage(repository);

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByText("Nenhuma notícia publicada")).toBeInTheDocument();
    // Notices section (a different, unaffected section) still renders normally.
    expect(screen.getByRole("heading", { name: "Comunicados Recentes" })).toBeInTheDocument();
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

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(callCount).toBe(2));
    expect(await screen.findByRole("heading", { level: 1, name: homePageDataMock.hero.title })).toBeInTheDocument();
  });

  it("never issues a network request while loading Home data", async () => {
    renderHomePage(new HomeMockRepository("default"));
    await screen.findByRole("heading", { level: 1 });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts any HomeRepository implementation without the visual components knowing about it", async () => {
    const customRepository: HomeRepository = {
      getHomePage: async () => ({
        ...homePageDataMock,
        hero: { ...homePageDataMock.hero, title: "Título alternativo de teste" },
      }),
    };
    renderHomePage(customRepository);

    expect(await screen.findByRole("heading", { level: 1, name: "Título alternativo de teste" })).toBeInTheDocument();
  });
});
