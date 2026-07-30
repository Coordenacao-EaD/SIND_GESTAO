import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { routes } from "./router";
import { ROUTES } from "../config/routes";

function renderAt(path: string) {
  const memoryRouter = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<RouterProvider router={memoryRouter} />);
}

describe("app router", () => {
  it("renders the Home page at /", async () => {
    renderAt(ROUTES.home);
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the NotFound page for an unknown route", () => {
    renderAt("/esta-rota-nao-existe");
    expect(screen.getByRole("heading", { name: "Página não encontrada" })).toBeInTheDocument();
  });

  it("renders a coming-soon placeholder for routes not implemented yet", () => {
    renderAt(ROUTES.union);
    expect(screen.getByRole("heading", { name: "O Sindicato" })).toBeInTheDocument();
    expect(screen.getByText(/Página em construção/)).toBeInTheDocument();
  });
});
