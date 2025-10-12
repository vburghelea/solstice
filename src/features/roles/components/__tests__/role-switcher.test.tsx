import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { RoleSwitcher } from "~/features/roles/components/role-switcher";
import { resolvePersonaForContext } from "~/features/roles/persona-resolver";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";

describe("RoleSwitcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("only renders personas that are available", async () => {
    const resolution = resolvePersonaForContext(
      { isAuthenticated: true, roleNames: [] },
      { preferredPersonaId: "player" },
    );

    render(
      <RoleSwitcherProvider initialResolution={resolution}>
        <RoleSwitcher />
      </RoleSwitcherProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /persona/i }));

    expect(screen.getByRole("button", { name: /player/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /visitor/i })).toBeVisible();
    expect(screen.queryByRole("button", { name: /operations/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /game master/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /platform admin/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/locked/i)).not.toBeInTheDocument();
  });
});
