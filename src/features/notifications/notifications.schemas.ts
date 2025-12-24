import { z } from "zod";
import { jsonRecordSchema } from "~/shared/lib/json";

export const notificationCategorySchema = z.enum([
  "reporting",
  "security",
  "support",
  "system",
]);

export const notificationFrequencySchema = z.enum([
  "immediate",
  "daily_digest",
  "weekly_digest",
  "never",
]);

export const listNotificationsSchema = z
  .object({
    unreadOnly: z.boolean().optional(),
    limit: z.number().int().min(1).max(100).optional(),
  })
  .nullish()
  .transform((value) => value ?? { unreadOnly: false, limit: 25 });
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

export const markNotificationReadSchema = z.object({
  notificationId: z.uuid(),
});
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

export const dismissNotificationSchema = z.object({
  notificationId: z.uuid(),
});
export type DismissNotificationInput = z.infer<typeof dismissNotificationSchema>;

export const updateNotificationPreferencesSchema = z.object({
  category: notificationCategorySchema,
  channelEmail: z.boolean().optional(),
  channelInApp: z.boolean().optional(),
  emailFrequency: notificationFrequencySchema.optional(),
});
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.uuid().optional().nullable(),
  type: z.string().min(1),
  category: notificationCategorySchema,
  title: z.string().min(1),
  body: z.string().min(1),
  link: z.string().optional().nullable(),
  metadata: jsonRecordSchema.optional(),
});
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const createNotificationTemplateSchema = z.object({
  key: z.string().min(1),
  category: notificationCategorySchema,
  subject: z.string().min(1),
  bodyTemplate: z.string().min(1),
  isSystem: z.boolean().optional(),
});
export type CreateNotificationTemplateInput = z.infer<
  typeof createNotificationTemplateSchema
>;

export const updateNotificationTemplateSchema = z.object({
  templateId: z.uuid(),
  data: createNotificationTemplateSchema.partial(),
});
export type UpdateNotificationTemplateInput = z.infer<
  typeof updateNotificationTemplateSchema
>;

export const deleteNotificationTemplateSchema = z.object({
  templateId: z.uuid(),
});
export type DeleteNotificationTemplateInput = z.infer<
  typeof deleteNotificationTemplateSchema
>;

export const scheduleNotificationSchema = z.object({
  templateKey: z.string().min(1),
  userId: z.string().optional().nullable(),
  organizationId: z.uuid().optional().nullable(),
  roleFilter: z.string().optional().nullable(),
  scheduledFor: z.iso.datetime(),
  variables: jsonRecordSchema.optional(),
});
export type ScheduleNotificationInput = z.infer<typeof scheduleNotificationSchema>;
