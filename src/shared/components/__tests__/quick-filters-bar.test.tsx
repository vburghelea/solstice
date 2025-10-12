import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "~/tests/utils";

import { QuickFiltersBar, type QuickFilterButton } from "../quick-filters-bar";

const buildFilters = (overrides?: Partial<QuickFilterButton>[]): QuickFilterButton[] => {
  const base: QuickFilterButton[] = [
    { id: "city", label: "In Portland", active: false, onToggle: vi.fn() },
    { id: "favorites", label: "Favorites", active: true, onToggle: vi.fn() },
  ];

  if (!overrides) {
    return base;
  }

  return base.map((filter, index) => ({
    ...filter,
    ...(overrides[index] ?? {}),
  }));
};

describe("QuickFiltersBar", () => {
  it("renders provided filters and toggles on click", async () => {
    const user = userEvent.setup();
    const filters = buildFilters();

    render(<QuickFiltersBar filters={filters} />);

    const cityButton = screen.getByRole("button", { name: "In Portland" });
    const favoritesButton = screen.getByRole("button", { name: "Favorites" });

    expect(cityButton).toBeInTheDocument();
    expect(favoritesButton).toHaveClass("border-primary", "bg-primary/10");

    await user.click(cityButton);
    expect(filters[0].onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders a clear button when onClear is provided", async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();
    const filters = buildFilters();

    render(<QuickFiltersBar filters={filters} onClear={handleClear} />);

    const clearButton = screen.getByRole("button", { name: "Clear filters" });

    await user.click(clearButton);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when there are no filters", () => {
    const { container } = render(<QuickFiltersBar filters={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
