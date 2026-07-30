import { render, screen } from "@testing-library/react";
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

  it("falls back to a solid background when the hero image fails to load", () => {
    render(
      <MemoryRouter>
        <HeroSection content={{ ...heroContentMock, imageUrl: "/does-not-exist.jpg" }} />
      </MemoryRouter>,
    );

    const image = screen.getByRole("img", { name: heroContentMock.imageAlt });
    image.dispatchEvent(new Event("error"));

    expect(screen.queryByRole("img", { name: heroContentMock.imageAlt })).not.toBeInTheDocument();
  });
});
