import { z } from "zod";

export const SYSTEM_EDITOR_TAB_VALUES = [
  "overview",
  "content",
  "media",
  "taxonomy",
  "crawl",
] as const;

export const systemEditorSearchSchema = z.object({
  tab: z.enum(SYSTEM_EDITOR_TAB_VALUES).optional(),
});

export const systemEditorParamsSchema = z.object({
  systemId: z.string(),
});

export type SystemEditorSearchParams = z.infer<typeof systemEditorSearchSchema>;
