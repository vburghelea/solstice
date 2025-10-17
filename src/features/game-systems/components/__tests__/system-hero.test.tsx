import { describe, expect, it } from "vitest";
import { render, screen } from "~/tests/utils";
import { SystemHero } from "../system-hero";

// The i18n mock is already set up in src/tests/mocks/i18n.ts
// This will load the actual locale data from the JSON files

describe("SystemHero", () => {
  it("shows hero image when url provided", () => {
    const { container } = render(
      <SystemHero
        name="Example"
        heroUrl="https://img"
        renderBackground={true}
        subtitle="Test"
      />,
    );
    const img = container.querySelector("img");
    expect(img?.src).toContain("https://img");
    expect(screen.queryByText("Image pending moderation")).not.toBeInTheDocument();
  });

  it("shows moderation message when image missing", () => {
    const { container } = render(
      <SystemHero name="Example" heroUrl={null} subtitle="Test" />,
    );
    const section = container.querySelector("section");
    expect(section?.style.backgroundImage).toBe("");
    expect(screen.getByText("Image pending moderation")).toBeInTheDocument();
  });

  it("omits background image when renderBackground is false", () => {
    const { container } = render(
      <SystemHero
        name="Example"
        heroUrl="https://img"
        subtitle="Test"
        renderBackground={false}
      />,
    );
    const section = container.querySelector("section");
    expect(section?.style.backgroundImage).toBe("");
    expect(screen.queryByText("Image pending moderation")).not.toBeInTheDocument();
  });
});
