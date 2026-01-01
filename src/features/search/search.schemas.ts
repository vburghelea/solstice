import { z } from "zod";

export const globalSearchSchema = z.object({
  query: z.string().trim().min(1),
  limit: z.number().int().min(1).max(15).optional(),
});

export type GlobalSearchInput = z.infer<typeof globalSearchSchema>;

export type GlobalSearchResultType =
  | "organization"
  | "form"
  | "reporting_task"
  | "template"
  | "data_catalog"
  | "support_request";

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle?: string | null;
  href: string;
};
