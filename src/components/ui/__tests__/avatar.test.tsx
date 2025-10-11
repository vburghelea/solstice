import { render, screen } from "@testing-library/react";
import { Avatar } from "~/components/ui/avatar";

describe("Avatar", () => {
  it("normalizes legacy /avatars path to /api/avatars", () => {
    render(
      <Avatar
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
      <Avatar
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
      <Avatar
        name="Alice"
        email="alice@example.com"
        srcUploaded={null}
        srcProvider={null}
      />,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("links to the user profile when a userId is provided", () => {
    render(
      <Avatar
        name="Link"
        email="link@example.com"
        userId="user-123"
        srcUploaded={null}
        srcProvider={null}
      />,
    );

    const link = screen.getByRole("link", { name: /link/i });
    expect(link).toHaveAttribute("href", "/profile/user-123");
  });
});
