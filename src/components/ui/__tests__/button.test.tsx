import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "~/tests/utils";
import { Button } from "../button";

describe("Button", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies default variant and size classes", () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary", "text-primary-foreground", "h-9", "px-4");
  });

  it("applies custom variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive", "text-white");
  });

  it("applies custom size classes", () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-8", "px-3");
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole("button");

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("respects disabled state", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:opacity-50");

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders as a custom component when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/link">Link Button</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Link Button" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/link");
    expect(link).toHaveClass("bg-primary");
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("forwards additional props", () => {
    render(
      <Button data-testid="custom-button" type="submit">
        Submit
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveAttribute("type", "submit");
  });
});
