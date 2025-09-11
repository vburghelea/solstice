import { describe, expect, it } from "vitest";
import { render, screen } from "~/tests/utils";
import { StickyActionBar } from "../sticky-action-bar";

describe("StickyActionBar", () => {
  it("renders content and applies safe-area padding", () => {
    render(
      <StickyActionBar>
        <button type="button">Primary Action</button>
      </StickyActionBar>,
    );

    const bar = screen.getByRole("button", { name: /primary action/i }).parentElement;
    expect(bar).toBeInTheDocument();
    // Default: mobileOnly = true applies lg:hidden class
    expect(bar?.className).toContain("lg:hidden");
    // Has padding style for safe area
    expect(bar?.getAttribute("style")).toContain("safe-area-inset-bottom");
  });

  it("shows on desktop when mobileOnly is false", () => {
    render(
      <StickyActionBar mobileOnly={false}>
        <div>Content</div>
      </StickyActionBar>,
    );
    const bar = screen.getByText("Content").parentElement;
    expect(bar?.className).not.toContain("lg:hidden");
  });
});
