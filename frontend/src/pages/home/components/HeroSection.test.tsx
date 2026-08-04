import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HeroSection } from "./HeroSection";
import { heroContentMock } from "../mocks/home.mock";

describe("HeroSection", () => {
  it("renders the title, description and both actions", () => {
    render(
      <MemoryRouter>
        <HeroSection content={heroContentMock} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: heroContentMock.title })).toBeInTheDocument();
    expect(screen.getByText(heroContentMock.description)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: heroContentMock.primaryAction.label })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: heroContentMock.secondaryAction.label })).toBeInTheDocument();
  });

  it("prioritizes the responsive hero image without changing its accessible name", () => {
    render(
      <MemoryRouter>
        <HeroSection content={heroContentMock} />
      </MemoryRouter>,
    );

    const image = screen.getByRole("img", { name: heroContentMock.imageAlt });
    expect(image).toHaveAttribute("srcset", heroContentMock.imageSrcSet);
    expect(image).toHaveAttribute("sizes", heroContentMock.imageSizes);
    expect(image).toHaveAttribute("width", "1672");
    expect(image).toHaveAttribute("height", "941");
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveAttribute("decoding", "async");
  });

  it("does not mount or reserve space for a disabled optional action", () => {
    const disabledAction = {
      label: "Ação opcional indisponível",
      href: "/contato",
      variant: "secondary" as const,
      enabled: false,
    };

    render(
      <MemoryRouter>
        <HeroSection content={{ ...heroContentMock, optionalAction: disabledAction }} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(disabledAction.label)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: disabledAction.label })).not.toBeInTheDocument();
  });

  it("renders an enabled optional action", () => {
    const enabledAction = {
      label: "Ação opcional disponível",
      href: "/contato",
      variant: "secondary" as const,
      enabled: true,
    };

    render(
      <MemoryRouter>
        <HeroSection content={{ ...heroContentMock, optionalAction: enabledAction }} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: enabledAction.label })).toHaveAttribute(
      "href",
      enabledAction.href,
    );
  });

  it("preserves the hero image accessible name when loading fails", () => {
    const { container } = render(
      <MemoryRouter>
        <HeroSection content={{ ...heroContentMock, imageUrl: "/does-not-exist.jpg" }} />
      </MemoryRouter>,
    );

    const image = screen.getByRole("img", { name: heroContentMock.imageAlt });
    fireEvent.error(image);

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: heroContentMock.imageAlt })).toBeInTheDocument();
  });
});
