import { z } from "zod";

export const gmPipelineStageIdSchema = z.enum([
  "discovery",
  "scoping",
  "enablement",
  "launch",
  "retention",
]);

export const gmPipelineRoleSchema = z.enum(["story_guide", "ops", "platform_admin"]);

export const gmPipelineNoteUpdateOutcomeSchema = z.enum(["updated", "conflict"]);

export const updateGmPipelineNoteSchema = z.object({
  opportunityId: z.string().min(1, "Opportunity id is required"),
  noteId: z.string().min(1, "Note id is required"),
  content: z
    .string()
    .trim()
    .min(1, "Add a little context before saving")
    .max(2000, "Notes are limited to 2000 characters"),
  lastSyncedAt: z.string().datetime().nullable(),
});
