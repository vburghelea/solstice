import type { z } from "zod";
import type { EventRegistration, RegistrationGroup } from "~/db/schema";
import type {
  registrationGroupMemberRoleSchema,
  registrationGroupMemberStatusSchema,
  registrationGroupStatusSchema,
  registrationGroupTypeSchema,
} from "./registration-groups.schemas";

export type RegistrationGroupType = z.infer<typeof registrationGroupTypeSchema>;
export type RegistrationGroupStatus = z.infer<typeof registrationGroupStatusSchema>;
export type RegistrationGroupMemberStatus = z.infer<
  typeof registrationGroupMemberStatusSchema
>;
export type RegistrationGroupMemberRole = z.infer<
  typeof registrationGroupMemberRoleSchema
>;

export type RegistrationGroupMemberSummary = {
  id: string;
  userId: string | null;
  email: string | null;
  status: RegistrationGroupMemberStatus;
  role: RegistrationGroupMemberRole;
  invitedAt: Date | null;
  joinedAt: Date | null;
  userName: string | null;
};

type RegistrationGroupRecord = Omit<RegistrationGroup, "metadata"> & {
  metadata: Record<string, object> | null;
};

export type RegistrationGroupRoster = {
  group: RegistrationGroupRecord;
  registration: {
    id: string;
    status: EventRegistration["status"];
    paymentStatus: EventRegistration["paymentStatus"];
  } | null;
  members: RegistrationGroupMemberSummary[];
};

export type RegistrationGroupInvitePayload = {
  inviteId: string;
  memberId: string;
  token: string;
  expiresAt: Date | null;
};

export type RegistrationInviteRedemptionResult = {
  status: "joined" | "already_member" | "declined";
  groupId: string;
  memberId: string;
};

export type RegistrationInvitePreview = {
  valid: boolean;
  expired: boolean;
  eventId: string | null;
  eventName: string | null;
  eventStartDate: Date | null;
  groupType: RegistrationGroupType | null;
  invitedByName: string | null;
  invitedByEmail: string | null;
  inviteEmail: string | null;
};
