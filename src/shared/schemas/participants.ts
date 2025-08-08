// src/shared/schemas/participants.ts
import { z } from "zod";
import { participantRoleEnum, participantStatusEnum } from "~/db/schema/shared.schema";

export const baseParticipantSchema = z.object({
  id: z.string(), // Can be UUID or CUID2
  userId: z.string().uuid(),
  role: z.enum(participantRoleEnum.enumValues),
  status: z.enum(participantStatusEnum.enumValues),
  createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
  updatedAt: z.preprocess((arg) => new Date(arg as string), z.date()),
});

export const createBaseParticipantSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(participantRoleEnum.enumValues),
  status: z.enum(participantStatusEnum.enumValues).default("pending"),
});

export const updateBaseParticipantSchema = z.object({
  role: z.enum(participantRoleEnum.enumValues).optional(),
  status: z.enum(participantStatusEnum.enumValues).optional(),
});
