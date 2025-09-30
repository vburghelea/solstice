export type PersonaId = "player" | "ops" | "gm" | "admin";

export type SharedInboxFilter = {
  id: string;
  label: string;
  description?: string;
};

export type SharedInboxParticipant = {
  id: string;
  name: string;
  persona: PersonaId;
  roleLabel: string;
  avatarInitials: string;
};

export type SharedInboxMessage = {
  id: string;
  authorId: string;
  persona: PersonaId;
  timestamp: string;
  body: string;
  attachments?: Array<{ id: string; name: string; href?: string }>;
  reactions?: Array<{ emoji: string; count: number }>;
};

export type SharedInboxActionItem = {
  id: string;
  label: string;
  ownerPersona: PersonaId;
  dueAt?: string;
  status: "open" | "in-progress" | "done";
  relatedMessageId?: string;
};

export type SharedInboxThread = {
  id: string;
  subject: string;
  personas: PersonaId[];
  categories: string[];
  tags: string[];
  priority: "low" | "medium" | "high";
  status: "open" | "waiting" | "resolved";
  updatedAt: string;
  unreadFor: PersonaId[];
  preview: string;
  participants: SharedInboxParticipant[];
  messages: SharedInboxMessage[];
  actionItems?: SharedInboxActionItem[];
};

export type PersonaInboxConfig = {
  persona: PersonaId;
  heading: string;
  description: string;
  supportingCopy: string;
  filters: SharedInboxFilter[];
  highlight: {
    label: string;
    value: string;
    description: string;
  };
  quickMetrics: Array<{
    id: string;
    label: string;
    value: string;
    delta?: string;
  }>;
  collaborationTips: string[];
};

export type SharedInboxSnapshot = {
  config: PersonaInboxConfig;
  threads: SharedInboxThread[];
};
