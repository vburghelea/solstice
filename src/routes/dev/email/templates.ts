export const templateNames = [
  "welcome-email",
  "membership-receipt",
  "game-invitation",
  "campaign-invitation",
  "game-invite-response",
  "game-status-update",
  "game-reminder",
  "campaign-invite-response",
  "campaign-session-update",
  "campaign-digest",
  "review-reminder",
  "email-verification",
  "email-verification-otp",
  "password-reset",
  "password-reset-otp",
  "sign-in-otp",
] as const;

export type TemplateName = (typeof templateNames)[number];
