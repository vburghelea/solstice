import { captureEvent } from "~/lib/analytics/posthog";

import type { PersonaAnalyticsConfig, PersonaId } from "~/features/roles/persona.types";

interface PersonaNavigationPayload {
  personaId: PersonaId;
  namespacePath: string;
  pathname: string;
  source: "layout" | "navigation" | "switcher" | string;
}

interface PersonaSwitchPayload {
  personaId: PersonaId;
  namespacePath: string;
  previousPersonaId: PersonaId;
  intent: "manual" | "auto" | string;
  reason?: string;
}

interface ComingSoonFeedbackPayload {
  personaId: PersonaId;
  namespacePath: string;
  feedbackType: "like" | "dislike" | "suggest" | string;
  message?: string;
}

export async function trackPersonaNavigationImpression(
  analytics: PersonaAnalyticsConfig,
  payload: PersonaNavigationPayload,
): Promise<void> {
  await captureEvent(analytics.impressionEvent, {
    persona: payload.personaId,
    namespace: payload.namespacePath,
    pathname: payload.pathname,
    source: payload.source,
  });
}

export async function trackPersonaSwitch(
  analytics: PersonaAnalyticsConfig,
  payload: PersonaSwitchPayload,
): Promise<void> {
  await captureEvent(analytics.switchEvent, {
    persona: payload.personaId,
    namespace: payload.namespacePath,
    previousPersona: payload.previousPersonaId,
    intent: payload.intent,
    reason: payload.reason,
  });
}

export async function trackComingSoonFeedback(
  analytics: PersonaAnalyticsConfig,
  payload: ComingSoonFeedbackPayload,
): Promise<void> {
  await captureEvent(analytics.feedbackEvent, {
    persona: payload.personaId,
    namespace: payload.namespacePath,
    feedbackType: payload.feedbackType,
    message: payload.message,
  });
}
