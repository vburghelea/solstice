import { z } from "zod";

export const locationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeId: z.string().optional(),
});

export const minimumRequirementsSchema = z.object({
  languageLevel: z.enum(["beginner", "intermediate", "advanced", "fluent"]).optional(),
  minPlayers: z.number().int().positive().optional(),
  maxPlayers: z.number().int().positive().optional(),
  playerRadiusKm: z.number().int().min(1).max(10).optional(),
});

// Standardized safety tools/rules used across campaigns and game sessions
export const xCardSystemEnum = z.enum([
  "none",
  "x-card",
  "open-door",
  "script-change",
  "consent-flowers",
  "lines-and-veils",
  "other",
]);

export const safetyRulesSchema = z.object({
  // Legacy/common toggles
  "no-alcohol": z.boolean().optional(),
  "safe-word": z.boolean().optional(),

  // Communication & boundaries
  openCommunication: z.boolean().optional(),
  playerBoundariesConsent: z.string().max(1000).nullable().optional(),

  // Safety tool selection and details
  xCardSystem: xCardSystemEnum.nullable().optional(),
  xCardDetails: z.string().max(500).nullable().optional(),
});
