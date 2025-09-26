import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Email template utilities for loading and rendering HTML email templates
 */

export interface CampaignInvitationData {
  inviterName: string;
  campaignName: string;
  campaignDescription: string;
  gameSystem: string;
  inviteUrl: string;
  expiresAt: string;
  recipientName: string;
}

export interface GameInvitationData {
  inviterName: string;
  gameName: string;
  gameDescription: string;
  gameSystem: string;
  inviteUrl: string;
  expiresAt: string;
  recipientName: string;
}

export interface TeamInvitationData {
  inviterName: string;
  teamName: string;
  role: string;
  inviteUrl: string;
  recipientName: string;
}

export interface TeamRequestDecisionData {
  recipientName: string;
  teamName: string;
  decision: "approved" | "declined";
  decidedByName: string;
  detailsUrl: string;
}

export interface EmailVerificationData {
  recipientName: string;
  verificationUrl: string;
  expiresAt: string;
}

export interface PasswordResetData {
  recipientName: string;
  resetUrl: string;
  expiresAt: string;
}

export interface MembershipReceiptData {
  recipientName: string;
  membershipType: string;
  amount: string;
  paymentId: string;
  expiresAt: string;
}

export interface WelcomeEmailData {
  recipientName: string;
  profileUrl: string;
}

export interface EmailVerificationOTPData {
  recipientName: string;
  otp: string;
}

export interface PasswordResetOTPData {
  recipientName: string;
  otp: string;
}

export interface SignInOTPData {
  recipientName: string;
  otp: string;
}

// New templates — Games
export interface GameInviteResponseData {
  inviterName: string;
  inviteeName: string;
  gameName: string;
  response: "accepted" | "declined";
  time: string;
  rosterUrl: string;
}

export interface GameStatusUpdateData {
  recipientName: string;
  gameName: string;
  dateTime: string;
  location: string;
  changeSummary: string;
  detailsUrl: string;
}

export interface GameReminderData {
  recipientName: string;
  gameName: string;
  dateTime: string;
  location: string;
}

// New templates — Campaigns
export interface CampaignInviteResponseData {
  ownerName: string;
  inviterName: string;
  inviteeName: string;
  campaignName: string;
  response: "accepted" | "declined";
  time: string;
  detailsUrl: string;
}

export interface CampaignSessionUpdateData {
  recipientName: string;
  sessionTitle: string;
  dateTime: string;
  location: string;
  changeSummary: string;
  detailsUrl: string;
}

export interface CampaignDigestItem {
  title: string;
  dateTime: string;
  location: string;
  detailsUrl: string;
}

export interface CampaignDigestData {
  recipientName: string;
  itemsHtml: string; // pre-rendered list items HTML
  manageUrl: string;
}

// New templates — Reviews
export interface ReviewReminderData {
  recipientName: string;
  gmName: string;
  gameName: string;
  dateTime: string;
  reviewUrl: string;
}

/**
 * Load and render a campaign invitation email template
 */
export async function renderCampaignInvitationEmail(
  data: CampaignInvitationData,
): Promise<string> {
  return renderTemplate("campaign-invitation.html", {
    inviterName: data.inviterName,
    campaignName: data.campaignName,
    campaignDescription: data.campaignDescription,
    gameSystem: data.gameSystem,
    inviteUrl: data.inviteUrl,
    expiresAt: data.expiresAt,
    recipientName: data.recipientName,
  });
}

/**
 * Load and render a game invitation email template
 */
export async function renderGameInvitationEmail(
  data: GameInvitationData,
): Promise<string> {
  return renderTemplate("game-invitation.html", {
    inviterName: data.inviterName,
    gameName: data.gameName,
    gameDescription: data.gameDescription,
    gameSystem: data.gameSystem,
    inviteUrl: data.inviteUrl,
    expiresAt: data.expiresAt,
    recipientName: data.recipientName,
  });
}

export async function renderTeamInvitationEmail(
  data: TeamInvitationData,
): Promise<string> {
  return renderTemplate("team-invitation.html", {
    inviterName: data.inviterName,
    teamName: data.teamName,
    role: data.role,
    inviteUrl: data.inviteUrl,
    recipientName: data.recipientName,
  });
}

export async function renderTeamRequestDecisionEmail(
  data: TeamRequestDecisionData,
): Promise<string> {
  return renderTemplate("team-request-decision.html", {
    recipientName: data.recipientName,
    teamName: data.teamName,
    decision: data.decision,
    decidedByName: data.decidedByName,
    detailsUrl: data.detailsUrl,
  });
}

/**
 * Load and render an email verification email template
 */
export async function renderEmailVerificationEmail(
  data: EmailVerificationData,
): Promise<string> {
  return renderTemplate("email-verification.html", {
    recipientName: data.recipientName,
    verificationUrl: data.verificationUrl,
    expiresAt: data.expiresAt,
  });
}

/**
 * Load and render a password reset email template
 */
export async function renderPasswordResetEmail(data: PasswordResetData): Promise<string> {
  return renderTemplate("password-reset.html", {
    recipientName: data.recipientName,
    resetUrl: data.resetUrl,
    expiresAt: data.expiresAt,
  });
}

/**
 * Load and render a membership receipt email template
 */
export async function renderMembershipReceiptEmail(
  data: MembershipReceiptData,
): Promise<string> {
  return renderTemplate("membership-receipt.html", {
    recipientName: data.recipientName,
    membershipType: data.membershipType,
    amount: data.amount,
    paymentId: data.paymentId,
    expiresAt: data.expiresAt,
  });
}

/**
 * Load and render a welcome email template
 */
export async function renderWelcomeEmail(data: WelcomeEmailData): Promise<string> {
  return renderTemplate("welcome-email.html", {
    recipientName: data.recipientName,
    profileUrl: data.profileUrl,
  });
}

/**
 * Load and render an email verification OTP template
 */
export async function renderEmailVerificationOTP(
  data: EmailVerificationOTPData,
): Promise<string> {
  return renderTemplate("email-verification-otp.html", {
    recipientName: data.recipientName,
    otp: data.otp,
  });
}

/**
 * Load and render a password reset OTP template
 */
export async function renderPasswordResetOTP(
  data: PasswordResetOTPData,
): Promise<string> {
  return renderTemplate("password-reset-otp.html", {
    recipientName: data.recipientName,
    otp: data.otp,
  });
}

/**
 * Load and render a sign-in OTP template
 */
export async function renderSignInOTP(data: SignInOTPData): Promise<string> {
  return renderTemplate("sign-in-otp.html", {
    recipientName: data.recipientName,
    otp: data.otp,
  });
}

/**
 * Generate text version from HTML template (basic conversion)
 */
export function generateTextFromHtml(html: string): string {
  // Basic HTML to text conversion - remove tags and clean up
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&/g, "&") // Replace ampersands
    .replace(/</g, "<") // Replace less than
    .replace(/>/g, ">") // Replace greater than
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Load and render: Game invitation response (notify inviter)
 */
export async function renderGameInviteResponseEmail(
  data: GameInviteResponseData,
): Promise<string> {
  return renderTemplate("game-invite-response.html", {
    inviterName: data.inviterName,
    inviteeName: data.inviteeName,
    gameName: data.gameName,
    response: data.response,
    time: data.time,
    rosterUrl: data.rosterUrl,
  });
}

/**
 * Load and render: Game status update (scheduled/updated/canceled)
 */
export async function renderGameStatusUpdateEmail(
  data: GameStatusUpdateData,
): Promise<string> {
  return renderTemplate("game-status-update.html", {
    recipientName: data.recipientName,
    gameName: data.gameName,
    dateTime: data.dateTime,
    location: data.location,
    changeSummary: data.changeSummary,
    detailsUrl: data.detailsUrl,
  });
}

/**
 * Load and render: Game reminder
 */
export async function renderGameReminderEmail(data: GameReminderData): Promise<string> {
  return renderTemplate("game-reminder.html", {
    recipientName: data.recipientName,
    gameName: data.gameName,
    dateTime: data.dateTime,
    location: data.location,
  });
}

/**
 * Load and render: Campaign invitation response (notify owner)
 */
export async function renderCampaignInviteResponseEmail(
  data: CampaignInviteResponseData,
): Promise<string> {
  return renderTemplate("campaign-invite-response.html", {
    ownerName: data.ownerName,
    inviterName: data.inviterName,
    inviteeName: data.inviteeName,
    campaignName: data.campaignName,
    response: data.response,
    time: data.time,
    detailsUrl: data.detailsUrl,
  });
}

/**
 * Load and render: Campaign session update (scheduled/updated/canceled)
 */
export async function renderCampaignSessionUpdateEmail(
  data: CampaignSessionUpdateData,
): Promise<string> {
  return renderTemplate("campaign-session-update.html", {
    recipientName: data.recipientName,
    sessionTitle: data.sessionTitle,
    dateTime: data.dateTime,
    location: data.location,
    changeSummary: data.changeSummary,
    detailsUrl: data.detailsUrl,
  });
}

/**
 * Load and render: Campaign weekly digest
 */
export async function renderCampaignDigestEmail(
  data: CampaignDigestData,
): Promise<string> {
  return renderTemplate("campaign-digest.html", {
    recipientName: data.recipientName,
    itemsHtml: data.itemsHtml,
    manageUrl: data.manageUrl,
  });
}

/**
 * Load and render: Review reminder (review your GM)
 */
export async function renderReviewReminderEmail(
  data: ReviewReminderData,
): Promise<string> {
  return renderTemplate("review-reminder.html", {
    recipientName: data.recipientName,
    gmName: data.gmName,
    gameName: data.gameName,
    dateTime: data.dateTime,
    reviewUrl: data.reviewUrl,
  });
}
const TEMPLATE_ROOT = resolve(process.cwd(), "src/shared/email-templates");
const HEADER_PATH = resolve(TEMPLATE_ROOT, "partials/header.html");
const FOOTER_PATH = resolve(TEMPLATE_ROOT, "partials/footer.html");

async function loadTemplate(path: string): Promise<string> {
  return readFile(path, "utf-8");
}

function applyReplacements(
  template: string,
  replacements: Record<string, string>,
): string {
  return Object.entries(replacements).reduce((acc, [key, value]) => {
    const safeValue = value ?? "";
    return acc.replace(new RegExp(`{{${key}}}`, "g"), safeValue);
  }, template);
}

async function renderTemplate(
  bodyFileName: string,
  replacements: Record<string, string>,
): Promise<string> {
  const map = {
    currentYear: new Date().getFullYear().toString(),
    ...replacements,
  };

  const [header, body, footer] = await Promise.all([
    loadTemplate(HEADER_PATH),
    loadTemplate(resolve(TEMPLATE_ROOT, bodyFileName)),
    loadTemplate(FOOTER_PATH),
  ]);

  return (
    applyReplacements(header, map) +
    applyReplacements(body, map) +
    applyReplacements(footer, map)
  );
}
