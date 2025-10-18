import { z } from "zod";
import { tCommon } from "~/lib/i18n/server-translations";

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
  opportunityId: z.string().min(1, tCommon("validation.opportunity_id_required")),
  noteId: z.string().min(1, tCommon("validation.note_id_required")),
  content: z
    .string()
    .trim()
    .min(1, tCommon("validation.note_context_required"))
    .max(2000, tCommon("validation.note_character_limit")),
  lastSyncedAt: z.string().datetime().nullable(),
});
