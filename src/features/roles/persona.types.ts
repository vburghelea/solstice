import { z } from "zod";

export const personaIdSchema = z.enum(["visitor", "player", "ops", "gm", "admin"]);

export type PersonaId = z.infer<typeof personaIdSchema>;

export type PersonaAvailabilityStatus = "available" | "restricted" | "coming-soon";

export interface PersonaAnalyticsConfig {
  impressionEvent: string;
  switchEvent: string;
  feedbackEvent: string;
}

export interface PersonaDefinition {
  id: PersonaId;
  label: string;
  shortLabel: string;
  description: string;
  namespacePath: string;
  defaultRedirect: string;
  priority: number;
  analytics: PersonaAnalyticsConfig;
  access?: PersonaAccessEvaluator;
}

export interface PersonaState extends Omit<PersonaDefinition, "access"> {
  availability: PersonaAvailabilityStatus;
  availabilityReason?: string;
}

export type PersonaResolutionSource = "guest" | "user" | "system";

export interface PersonaResolutionMeta {
  source: PersonaResolutionSource;
  resolvedAt: string;
  preferredPersonaId: PersonaId | null;
}

export interface PersonaResolution {
  activePersonaId: PersonaId;
  personas: PersonaState[];
  meta: PersonaResolutionMeta;
}

export interface PersonaAccessContext {
  isAuthenticated: boolean;
  roleNames: string[];
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
}

export interface PersonaAccessResult {
  availability: PersonaAvailabilityStatus;
  reason?: string;
}

export type PersonaAccessEvaluator = (
  context: PersonaAccessContext,
) => PersonaAccessResult;
