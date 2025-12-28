import { z } from "zod";
import { tutorialIds } from "./tutorials.config";

export const tutorialIdSchema = z.enum(tutorialIds as [string, ...string[]]);
export const tutorialStatusSchema = z.enum(["started", "completed", "dismissed"]);

export const listTutorialProgressSchema = z
  .object({
    tutorialIds: z.array(tutorialIdSchema).optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const startTutorialSchema = z.object({
  tutorialId: tutorialIdSchema,
});

export const completeTutorialSchema = z.object({
  tutorialId: tutorialIdSchema,
});

export const dismissTutorialSchema = z.object({
  tutorialId: tutorialIdSchema,
});

export type ListTutorialProgressInput = z.infer<typeof listTutorialProgressSchema>;
