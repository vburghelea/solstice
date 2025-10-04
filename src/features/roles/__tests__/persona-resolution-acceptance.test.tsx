import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getGuestPersonaResolution,
  resolvePersonaForContext,
} from "~/features/roles/persona-resolver";
import {
  RoleSwitcherProvider,
  useRoleSwitcher,
} from "~/features/roles/role-switcher-context";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function ActivePersonaIndicator() {
  const { resolution } = useRoleSwitcher();

  return <span data-testid="active-persona">{resolution.activePersonaId}</span>;
}

function PersonaSwitchButton({
  personaId,
}: {
  personaId: "visitor" | "player" | "ops" | "gm" | "admin";
}) {
  const { switchPersona } = useRoleSwitcher();

  return (
    <button
      type="button"
      onClick={() => {
        void switchPersona(personaId);
      }}
    >
      Switch to {personaId}
    </button>
  );
}

describe("persona resolution acceptance criteria", () => {
  it("enforces guest fallback when unauthenticated", () => {
    const resolution = getGuestPersonaResolution();
    const availableIds = resolution.personas
      .filter((persona) => persona.availability === "available")
      .map((persona) => persona.id);

    expect(resolution.activePersonaId).toBe("visitor");
    expect(availableIds).toContain("visitor");
    expect(
      resolution.personas.find((persona) => persona.id === "player")?.availability,
    ).toBe("restricted");
    expect(
      resolution.personas.find((persona) => persona.id === "ops")?.availability,
    ).toBe("restricted");
  });

  it("activates the player persona for single-role users", () => {
    const resolution = resolvePersonaForContext(
      {
        isAuthenticated: true,
        roleNames: ["Player"],
      },
      { preferredPersonaId: null },
    );

    const playerPersona = resolution.personas.find((persona) => persona.id === "player");
    const visitorPersona = resolution.personas.find(
      (persona) => persona.id === "visitor",
    );

    expect(resolution.activePersonaId).toBe("player");
    expect(playerPersona?.availability).toBe("available");
    expect(visitorPersona?.availability).toBe("available");
    expect(
      resolution.personas.find((persona) => persona.id === "ops")?.availability,
    ).toBe("restricted");
  });

  it("prioritizes the highest-scope persona for multi-role users", () => {
    const resolution = resolvePersonaForContext(
      {
        isAuthenticated: true,
        roleNames: ["Player", "Roundup Games Admin"],
      },
      { preferredPersonaId: null },
    );

    const adminPersona = resolution.personas.find((persona) => persona.id === "admin");
    const gmPersona = resolution.personas.find((persona) => persona.id === "gm");
    const opsPersona = resolution.personas.find((persona) => persona.id === "ops");

    expect(resolution.activePersonaId).toBe("admin");
    expect(adminPersona?.availability).toBe("available");
    expect(gmPersona?.availability).toBe("available");
    expect(opsPersona?.availability).toBe("available");
  });

  it("falls back when a preferred persona is no longer available", () => {
    const initialResolution = resolvePersonaForContext(
      {
        isAuthenticated: true,
        roleNames: ["Game Master"],
      },
      { preferredPersonaId: "gm" },
    );

    expect(initialResolution.activePersonaId).toBe("gm");

    const downgradedResolution = resolvePersonaForContext(
      {
        isAuthenticated: true,
        roleNames: ["Player"],
      },
      { preferredPersonaId: "gm" },
    );

    const gmPersona = downgradedResolution.personas.find(
      (persona) => persona.id === "gm",
    );

    expect(downgradedResolution.activePersonaId).toBe("player");
    expect(gmPersona?.availability).toBe("restricted");
  });
});

describe("RoleSwitcherProvider persistence", () => {
  const adminResolution = resolvePersonaForContext(
    {
      isAuthenticated: true,
      roleNames: ["Player", "Roundup Games Admin"],
    },
    { preferredPersonaId: null },
  );

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("persists persona switches to local storage", async () => {
    render(
      <RoleSwitcherProvider initialResolution={adminResolution}>
        <ActivePersonaIndicator />
        <PersonaSwitchButton personaId="player" />
      </RoleSwitcherProvider>,
    );

    expect(screen.getByTestId("active-persona").textContent).toBe("admin");

    await userEvent.click(screen.getByRole("button", { name: "Switch to player" }));

    await waitFor(() => {
      expect(screen.getByTestId("active-persona").textContent).toBe("player");
    });

    expect(window.localStorage.getItem("roundup.activePersona")).toBe("player");
  });

  it("falls back to the highest available persona when stored preference is invalid", () => {
    window.localStorage.setItem("roundup.activePersona", "gm");

    const playerOnlyResolution = resolvePersonaForContext(
      {
        isAuthenticated: true,
        roleNames: ["Player"],
      },
      { preferredPersonaId: null },
    );

    render(
      <RoleSwitcherProvider initialResolution={playerOnlyResolution}>
        <ActivePersonaIndicator />
      </RoleSwitcherProvider>,
    );

    expect(screen.getByTestId("active-persona").textContent).toBe("player");
  });
});
