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
