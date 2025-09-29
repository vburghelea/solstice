import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackComingSoonFeedbackMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);

vi.mock("~/features/roles/role-analytics", () => ({
  trackComingSoonFeedback: trackComingSoonFeedbackMock,
}));

import { getGuestPersonaResolution } from "~/features/roles/persona-resolver";
import { trackComingSoonFeedback } from "~/features/roles/role-analytics";
import { RoleSwitcherProvider } from "~/features/roles/role-switcher-context";
import { setFeatureFlagOverride } from "~/lib/feature-flags";
import { render, screen, waitFor } from "~/tests/utils";
import { PersonaComingSoon } from "../persona-coming-soon";

const trackComingSoonFeedbackSpy = vi.mocked(trackComingSoonFeedback);

const guestResolution = getGuestPersonaResolution();

function renderComingSoon() {
  return render(
    <RoleSwitcherProvider initialResolution={guestResolution}>
      <PersonaComingSoon
        title="Help us shape the visitor experience"
        description="Tell us which stories and signals should greet newcomers first."
      />
    </RoleSwitcherProvider>,
  );
}

describe("PersonaComingSoon", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setFeatureFlagOverride("persona-coming-soon-visitor", null);
    trackComingSoonFeedbackSpy.mockClear();
  });

  it("renders persona messaging when enabled", () => {
    renderComingSoon();

    expect(screen.getByText("Help us shape the visitor experience")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("respects feature flag overrides", () => {
    setFeatureFlagOverride("persona-coming-soon-visitor", false);

    renderComingSoon();

    expect(
      screen.queryByText("Help us shape the visitor experience"),
    ).not.toBeInTheDocument();
  });

  it("tracks quick feedback interactions", async () => {
    const user = userEvent.setup();
    renderComingSoon();

    await user.click(screen.getByRole("button", { name: /i'm excited/i }));

    expect(trackComingSoonFeedbackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ impressionEvent: expect.any(String) }),
      expect.objectContaining({
        personaId: "visitor",
        namespacePath: "/visit",
        feedbackType: "like",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/your perspective is shaping the visitor workspace/i),
      ).toBeInTheDocument();
    });
  });

  it("submits persona suggestions with message payload", async () => {
    const user = userEvent.setup();
    renderComingSoon();

    const textarea = screen.getByRole("textbox", {
      name: /what should the visitor experience unlock first/i,
    });
    await user.type(textarea, "Add more community highlights");
    await user.click(screen.getByRole("button", { name: /share suggestion/i }));

    expect(trackComingSoonFeedbackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ impressionEvent: expect.any(String) }),
      expect.objectContaining({
        personaId: "visitor",
        namespacePath: "/visit",
        feedbackType: "suggest",
        message: "Add more community highlights",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/your perspective is shaping the visitor workspace/i),
      ).toBeInTheDocument();
    });
  });
});
