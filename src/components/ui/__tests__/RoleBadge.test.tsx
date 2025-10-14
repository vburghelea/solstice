import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleBadge } from "~/components/ui/RoleBadge";

describe("RoleBadge", () => {
  it("should render organizer badge correctly", () => {
    render(<RoleBadge role="owner" />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("👑")).toBeInTheDocument();
    expect(screen.getByText("Organizer")).toBeInTheDocument();
  });

  it("should render player badge with approved status", () => {
    render(<RoleBadge role="player" status="approved" />);

    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText("Participant")).toBeInTheDocument();
  });

  it("should render player badge with pending status", () => {
    render(<RoleBadge role="player" status="pending" />);

    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("should render invitee badge", () => {
    render(<RoleBadge role="invited" />);

    expect(screen.getByText("📧")).toBeInTheDocument();
    expect(screen.getByText("Invitee")).toBeInTheDocument();
  });

  it("should render requested badge", () => {
    render(<RoleBadge role="applicant" status="pending" />);

    expect(screen.getByText("📝")).toBeInTheDocument();
    expect(screen.getByText("Requested")).toBeInTheDocument();
  });

  it("should render compact version", () => {
    render(<RoleBadge role="owner" compact />);

    // In compact version, content is directly in the badge
    expect(screen.getByRole("status")).toHaveTextContent(/👑.*Organizer/);
  });

  it("should apply correct variant for different roles", () => {
    const { rerender } = render(<RoleBadge role="player" />);

    // Test player variant (secondary)
    expect(screen.getByRole("status")).toHaveClass("bg-secondary");

    // Rerender as owner
    rerender(<RoleBadge role="owner" />);
    expect(screen.getByRole("status")).toHaveClass("bg-primary");

    // Rerender as invited
    rerender(<RoleBadge role="invited" />);
    expect(screen.getByRole("status")).toHaveClass("text-foreground");
  });

  it("should handle custom className", () => {
    render(<RoleBadge role="owner" className="custom-class" />);

    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });

  it("should handle missing status gracefully", () => {
    render(<RoleBadge role="player" />);

    // Should still render without status - defaults to "Pending" for player without approved status
    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("should handle missing status gracefully", () => {
    render(<RoleBadge role="player" />);

    // Should still render without status
    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
