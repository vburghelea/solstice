import { describe, expect, it } from "vitest";
import { render, screen } from "~/tests/utils";
import { SystemHero } from "../system-hero";

describe("SystemHero", () => {
  it("shows hero image when url provided", () => {
    const { container } = render(
      <SystemHero name="Example" heroUrl="https://img" subtitle="Test" />,
    );
    const section = container.querySelector("section");
    expect(section?.style.backgroundImage).toContain("https://img");
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
});
