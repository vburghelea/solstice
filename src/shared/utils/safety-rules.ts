import { z } from "zod";
import { safetyRulesSchema, xCardSystemEnum } from "~/shared/schemas/common";

export type SafetyRules = z.infer<typeof safetyRulesSchema> | null | undefined;

export interface SafetyRuleDisplayItem {
  label: string;
  value: string;
}

export interface SafetyRuleDisplayGroup {
  title: string;
  items: SafetyRuleDisplayItem[];
}

function boolToYesNo(val: unknown): string {
  return val ? "Yes" : "No";
}

function formatToolName(
  value: z.infer<typeof xCardSystemEnum> | null | undefined,
): string {
  if (!value || value === "none") return "None";
  return value
    .toString()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type SafetyRulesShape = z.infer<typeof safetyRulesSchema>;

export function formatSafetyRules(safety: SafetyRules): SafetyRuleDisplayGroup[] {
  const safe = (safety ?? {}) as SafetyRulesShape;

  const basicItems: SafetyRuleDisplayItem[] = [
    { label: "No Alcohol", value: boolToYesNo(safe["no-alcohol"]) },
    { label: "Safe Word Required", value: boolToYesNo(safe["safe-word"]) },
    { label: "Encourage Open Communication", value: boolToYesNo(safe.openCommunication) },
  ];

  const toolItems: SafetyRuleDisplayItem[] = [
    { label: "Safety Tool", value: formatToolName(safe.xCardSystem ?? null) },
  ];
  const toolDetails = safe.xCardDetails ?? null;
  if (toolDetails) toolItems.push({ label: "Safety Tool Details", value: toolDetails });

  const consent = safe.playerBoundariesConsent ?? null;
  const consentItems: SafetyRuleDisplayItem[] = consent
    ? [{ label: "Player Boundaries / Consent", value: consent }]
    : [];

  const groups: SafetyRuleDisplayGroup[] = [];
  if (basicItems.length) groups.push({ title: "Basic Rules", items: basicItems });
  if (toolItems.length) groups.push({ title: "Safety Tools", items: toolItems });
  if (consentItems.length)
    groups.push({ title: "Boundaries & Consent", items: consentItems });

  return groups;
}
