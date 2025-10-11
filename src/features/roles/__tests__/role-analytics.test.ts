import { afterEach, describe, expect, it, vi } from "vitest";
import { captureEvent } from "~/lib/analytics/posthog";
import { getPersonaDefinitions } from "../persona-resolver";
import {
  trackComingSoonFeedback,
  trackPersonaNavigationImpression,
  trackPersonaSwitch,
} from "../role-analytics";

vi.mock("~/lib/analytics/posthog", () => ({
  captureEvent: vi.fn().mockResolvedValue(undefined),
}));

const [visitorPersona] = getPersonaDefinitions();

if (!visitorPersona) {
  throw new Error("Expected at least one persona definition for tests");
}

describe("role analytics helpers", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("tracks persona navigation impressions", async () => {
    await trackPersonaNavigationImpression(visitorPersona.analytics, {
      personaId: visitorPersona.id,
      namespacePath: visitorPersona.namespacePath,
      pathname: "/", // hypothetical path inside visitor namespace
      source: "layout",
    });

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith(visitorPersona.analytics.impressionEvent, {
      persona: visitorPersona.id,
      namespace: visitorPersona.namespacePath,
      pathname: "/",
      source: "layout",
    });
  });

  it("tracks persona switches", async () => {
    await trackPersonaSwitch(visitorPersona.analytics, {
      personaId: visitorPersona.id,
      namespacePath: visitorPersona.namespacePath,
      previousPersonaId: "player",
      intent: "manual",
      reason: "user-selected",
    });

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith(visitorPersona.analytics.switchEvent, {
      persona: visitorPersona.id,
      namespace: visitorPersona.namespacePath,
      previousPersona: "player",
      intent: "manual",
      reason: "user-selected",
    });
  });

  it("tracks coming soon feedback", async () => {
    await trackComingSoonFeedback(visitorPersona.analytics, {
      personaId: visitorPersona.id,
      namespacePath: visitorPersona.namespacePath,
      feedbackType: "suggest",
      message: "Add more public spotlights",
    });

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith(visitorPersona.analytics.feedbackEvent, {
      persona: visitorPersona.id,
      namespace: visitorPersona.namespacePath,
      feedbackType: "suggest",
      message: "Add more public spotlights",
    });
  });
});
