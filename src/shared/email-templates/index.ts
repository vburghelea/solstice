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
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/campaign-invitation.html",
  );
  let template = await readFile(templatePath, "utf-8");

  // Replace template variables
  template = template.replace(/{{inviterName}}/g, data.inviterName);
  template = template.replace(/{{campaignName}}/g, data.campaignName);
  template = template.replace(/{{campaignDescription}}/g, data.campaignDescription);
  template = template.replace(/{{gameSystem}}/g, data.gameSystem);
  template = template.replace(/{{inviteUrl}}/g, data.inviteUrl);
  template = template.replace(/{{expiresAt}}/g, data.expiresAt);
  template = template.replace(/{{recipientName}}/g, data.recipientName);

  return template;
}

/**
 * Load and render a game invitation email template
 */
export async function renderGameInvitationEmail(
  data: GameInvitationData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/game-invitation.html",
  );
  let template = await readFile(templatePath, "utf-8");

  // Replace template variables
  template = template.replace(/{{inviterName}}/g, data.inviterName);
  template = template.replace(/{{gameName}}/g, data.gameName);
  template = template.replace(/{{gameDescription}}/g, data.gameDescription);
  template = template.replace(/{{gameSystem}}/g, data.gameSystem);
  template = template.replace(/{{inviteUrl}}/g, data.inviteUrl);
  template = template.replace(/{{expiresAt}}/g, data.expiresAt);
  template = template.replace(/{{recipientName}}/g, data.recipientName);

  return template;
}

/**
 * Load and render an email verification email template
 */
export async function renderEmailVerificationEmail(
  data: EmailVerificationData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/email-verification.html",
  );
  let template = await readFile(templatePath, "utf-8");

  // Replace template variables
  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{verificationUrl}}/g, data.verificationUrl);
  template = template.replace(/{{expiresAt}}/g, data.expiresAt);

  return template;
}

/**
 * Load and render a password reset email template
 */
export async function renderPasswordResetEmail(data: PasswordResetData): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/password-reset.html",
  );
  let template = await readFile(templatePath, "utf-8");

  // Replace template variables
  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{resetUrl}}/g, data.resetUrl);
  template = template.replace(/{{expiresAt}}/g, data.expiresAt);

  return template;
}

/**
 * Load and render a membership receipt email template
 */
export async function renderMembershipReceiptEmail(
  data: MembershipReceiptData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/membership-receipt.html",
  );
  let template = await readFile(templatePath, "utf-8");

  // Replace template variables
  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{membershipType}}/g, data.membershipType);
  template = template.replace(/{{amount}}/g, data.amount);
  template = template.replace(/{{paymentId}}/g, data.paymentId);
  template = template.replace(/{{expiresAt}}/g, data.expiresAt);

  return template;
}

/**
 * Load and render a welcome email template
 */
export async function renderWelcomeEmail(data: WelcomeEmailData): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/welcome-email.html",
  );
  let template = await readFile(templatePath, "utf-8");

  // Replace template variables
  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{profileUrl}}/g, data.profileUrl);

  return template;
}

/**
 * Load and render an email verification OTP template
 */
export async function renderEmailVerificationOTP(
  data: EmailVerificationOTPData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/email-verification-otp.html",
  );
  let template = await readFile(templatePath, "utf-8");

  // Replace template variables
  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{otp}}/g, data.otp);

  return template;
}

/**
 * Load and render a password reset OTP template
 */
export async function renderPasswordResetOTP(
  data: PasswordResetOTPData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/password-reset-otp.html",
  );
  let template = await readFile(templatePath, "utf-8");

  // Replace template variables
  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{otp}}/g, data.otp);

  return template;
}

/**
 * Load and render a sign-in OTP template
 */
export async function renderSignInOTP(data: SignInOTPData): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/sign-in-otp.html",
  );
  let template = await readFile(templatePath, "utf-8");

  // Replace template variables
  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{otp}}/g, data.otp);

  return template;
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
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/game-invite-response.html",
  );
  let template = await readFile(templatePath, "utf-8");

  template = template.replace(/{{inviterName}}/g, data.inviterName);
  template = template.replace(/{{inviteeName}}/g, data.inviteeName);
  template = template.replace(/{{gameName}}/g, data.gameName);
  template = template.replace(/{{response}}/g, data.response);
  template = template.replace(/{{time}}/g, data.time);
  template = template.replace(/{{rosterUrl}}/g, data.rosterUrl);

  return template;
}

/**
 * Load and render: Game status update (scheduled/updated/cancelled)
 */
export async function renderGameStatusUpdateEmail(
  data: GameStatusUpdateData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/game-status-update.html",
  );
  let template = await readFile(templatePath, "utf-8");

  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{gameName}}/g, data.gameName);
  template = template.replace(/{{dateTime}}/g, data.dateTime);
  template = template.replace(/{{location}}/g, data.location);
  template = template.replace(/{{changeSummary}}/g, data.changeSummary);
  template = template.replace(/{{detailsUrl}}/g, data.detailsUrl);

  return template;
}

/**
 * Load and render: Game reminder
 */
export async function renderGameReminderEmail(data: GameReminderData): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/game-reminder.html",
  );
  let template = await readFile(templatePath, "utf-8");

  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{gameName}}/g, data.gameName);
  template = template.replace(/{{dateTime}}/g, data.dateTime);
  template = template.replace(/{{location}}/g, data.location);

  return template;
}

/**
 * Load and render: Campaign invitation response (notify owner)
 */
export async function renderCampaignInviteResponseEmail(
  data: CampaignInviteResponseData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/campaign-invite-response.html",
  );
  let template = await readFile(templatePath, "utf-8");

  template = template.replace(/{{ownerName}}/g, data.ownerName);
  template = template.replace(/{{inviterName}}/g, data.inviterName);
  template = template.replace(/{{inviteeName}}/g, data.inviteeName);
  template = template.replace(/{{campaignName}}/g, data.campaignName);
  template = template.replace(/{{response}}/g, data.response);
  template = template.replace(/{{time}}/g, data.time);
  template = template.replace(/{{detailsUrl}}/g, data.detailsUrl);

  return template;
}

/**
 * Load and render: Campaign session update (scheduled/updated/cancelled)
 */
export async function renderCampaignSessionUpdateEmail(
  data: CampaignSessionUpdateData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/campaign-session-update.html",
  );
  let template = await readFile(templatePath, "utf-8");

  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{sessionTitle}}/g, data.sessionTitle);
  template = template.replace(/{{dateTime}}/g, data.dateTime);
  template = template.replace(/{{location}}/g, data.location);
  template = template.replace(/{{changeSummary}}/g, data.changeSummary);
  template = template.replace(/{{detailsUrl}}/g, data.detailsUrl);

  return template;
}

/**
 * Load and render: Campaign weekly digest
 */
export async function renderCampaignDigestEmail(
  data: CampaignDigestData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/campaign-digest.html",
  );
  let template = await readFile(templatePath, "utf-8");

  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{itemsHtml}}/g, data.itemsHtml);
  template = template.replace(/{{manageUrl}}/g, data.manageUrl);

  return template;
}

/**
 * Load and render: Review reminder (review your GM)
 */
export async function renderReviewReminderEmail(
  data: ReviewReminderData,
): Promise<string> {
  const templatePath = resolve(
    process.cwd(),
    "src/shared/email-templates/review-reminder.html",
  );
  let template = await readFile(templatePath, "utf-8");

  template = template.replace(/{{recipientName}}/g, data.recipientName);
  template = template.replace(/{{gmName}}/g, data.gmName);
  template = template.replace(/{{gameName}}/g, data.gameName);
  template = template.replace(/{{dateTime}}/g, data.dateTime);
  template = template.replace(/{{reviewUrl}}/g, data.reviewUrl);

  return template;
}
