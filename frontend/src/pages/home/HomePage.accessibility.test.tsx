import axe from "axe-core";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomeDataProvider } from "./HomeDataProvider";
import { HomePage } from "./HomePage";
import { homePageDataMock } from "./mocks/home.mock";
import type { HomeRepository } from "./services/home.repository";
import type { HomePageData } from "./types/home.types";

function renderHomeState(repository: HomeRepository) {
  return render(
    <MemoryRouter>
      <HomeDataProvider repository={repository}>
        <HomePage />
      </HomeDataProvider>
    </MemoryRouter>,
  );
}

async function expectNoWcagViolations(container: HTMLElement) {
  const result = await axe.run(container, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    },
    rules: {
      // jsdom has no layout/canvas engine, so contrast is covered by the
      // unchanged Chrome-headless audit:a11y gate instead of being faked here.
      "color-contrast": { enabled: false },
    },
  });
  expect(result.violations).toEqual([]);
}

describe("HomePage state accessibility", () => {
  it("audits the global loading state in rendered DOM", async () => {
    const repository: HomeRepository = {
      getHomePage: () => new Promise<HomePageData>(() => {}),
    };
    const { container } = renderHomeState(repository);

    expect(screen.getByRole("heading", { level: 1, name: "Página Inicial" })).toBeInTheDocument();
    await expectNoWcagViolations(container);
  });

  it("audits empty section states in rendered DOM", async () => {
    const repository: HomeRepository = {
      getHomePage: async () => ({
        ...homePageDataMock,
        quickLinks: [],
        news: { status: "empty" },
        notices: { status: "empty" },
        documents: { status: "empty" },
      }),
    };
    const { container } = renderHomeState(repository);

    expect(await screen.findByText("Nenhuma notícia publicada")).toBeInTheDocument();
    expect(screen.getByText("Nenhum comunicado publicado")).toBeInTheDocument();
    expect(screen.getByText("Os documentos aparecerão aqui em breve.")).toBeInTheDocument();
    await expectNoWcagViolations(container);
  });

  it("audits the handled global error state in rendered DOM", async () => {
    const repository: HomeRepository = {
      getHomePage: () => Promise.reject(new Error("internal detail")),
    };
    const { container } = renderHomeState(repository);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar a Página Inicial no momento.",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Erro ao carregar a Página Inicial" })).toBeInTheDocument();
    await expectNoWcagViolations(container);
  });

  it("audits the isolated News error required by CA-HOM-007", async () => {
    const repository: HomeRepository = {
      getHomePage: async () => ({
        ...homePageDataMock,
        news: {
          status: "error",
          message: "Não foi possível carregar as notícias no momento.",
        },
      }),
    };
    const { container } = renderHomeState(repository);

    const newsSection = await screen.findByRole("region", { name: "Últimas Notícias" });
    expect(within(newsSection).getByRole("alert")).toHaveTextContent(
      "Não foi possível carregar as notícias no momento.",
    );
    expect(within(newsSection).queryByRole("link", { name: "Ver todas as notícias" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: homePageDataMock.hero.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comunicados Recentes" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    await expectNoWcagViolations(container);
  });
});
