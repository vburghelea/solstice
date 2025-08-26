import { serverOnly } from "@tanstack/react-start";
import {
  generateTextFromHtml,
  renderEmailVerificationOTP,
  renderPasswordResetOTP,
  renderSignInOTP,
} from "~/shared/email-templates";
import { EmailRecipient, getEmailService } from "./resend";

// Convenience function for sending email verification OTP
export const sendEmailVerificationOTP = serverOnly(
  async (params: { to: EmailRecipient; otp: string }) => {
    const service = await getEmailService();
    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    const htmlContent = await renderEmailVerificationOTP({
      recipientName: params.to.name || "there",
      otp: params.otp,
    });

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Verify Your Email - Roundup Games",
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Convenience function for sending password reset OTP
export const sendPasswordResetOTP = serverOnly(
  async (params: { to: EmailRecipient; otp: string }) => {
    const service = await getEmailService();
    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    const htmlContent = await renderPasswordResetOTP({
      recipientName: params.to.name || "there",
      otp: params.otp,
    });

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Password Reset OTP - Roundup Games",
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);

// Convenience function for sending sign-in OTP
export const sendSignInOTP = serverOnly(
  async (params: { to: EmailRecipient; otp: string }) => {
    const service = await getEmailService();
    const fromEmail = process.env["RESEND_FROM_EMAIL"] || "noreply@roundup.games";
    const fromName = process.env["RESEND_FROM_NAME"] || "Roundup Games";

    const htmlContent = await renderSignInOTP({
      recipientName: params.to.name || "there",
      otp: params.otp,
    });

    return service.send({
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: "Sign-in OTP - Roundup Games",
      html: htmlContent,
      text: generateTextFromHtml(htmlContent),
    });
  },
);
