import { render, screen } from "@testing-library/react";
import { UserAvatar } from "~/shared/ui/user-avatar";

describe("UserAvatar", () => {
  it("normalizes legacy /avatars path to /api/avatars", () => {
    render(
      <UserAvatar
        name="Jane"
        email="jane@example.com"
        srcUploaded="/avatars/jane.webp"
        srcProvider={null}
      />,
    );
    const img = screen.getByRole("img", { name: /jane/i });
    expect(img).toHaveAttribute("src", "/api/avatars/jane.webp");
  });

  it("uses provider image when no uploaded avatar", () => {
    render(
      <UserAvatar
        name="John"
        email="john@example.com"
        srcUploaded={null}
        srcProvider="https://cdn.example.com/p.png"
      />,
    );
    const img = screen.getByRole("img", { name: /john/i });
    expect(img).toHaveAttribute("src", "https://cdn.example.com/p.png");
  });

  it("falls back to first letter when no image sources", () => {
    render(
      <UserAvatar
        name="Alice"
        email="alice@example.com"
        srcUploaded={null}
        srcProvider={null}
      />,
    );
    // No img src is expected, but fallback letter should render
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
