export interface NotificationRow {
  id: string;
  userId: string;
  organizationId: string | null;
  type: string;
  category: string;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
}

export interface NotificationPreferenceRow {
  id: string;
  userId: string;
  category: string;
  channelEmail: boolean;
  channelInApp: boolean;
  emailFrequency: string;
  createdAt: Date;
  updatedAt: Date;
}
