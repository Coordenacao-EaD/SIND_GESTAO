import axe from "axe-core";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import HomeManagementPage from "./HomeManagementPage";

async function audit(path: string) {
  const { container } = render(<MemoryRouter initialEntries={[path]}><HomeManagementPage /></MemoryRouter>);
  const result = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  expect(result.violations).toEqual([]);
}

describe("HomeManagementPage accessibility", () => {
  it("has no DOM-level WCAG violations in its editing state", async () => {
    await audit("/admin/home");
    expect(screen.getByRole("heading", { level: 1, name: "Página Inicial" })).toBeInTheDocument();
  });

  it("has no DOM-level WCAG violations in loading, empty and error states", async () => {
    for (const scenario of ["loading", "empty", "unauthenticated", "forbidden", "conflict", "validation"]) {
      const view = render(<MemoryRouter initialEntries={[`/admin/home?scenario=${scenario}`]}><HomeManagementPage /></MemoryRouter>);
      const result = await axe.run(view.container, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        rules: { "color-contrast": { enabled: false } },
      });
      expect(result.violations, scenario).toEqual([]);
      view.unmount();
    }
  });
});
