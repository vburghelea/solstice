import { createFileRoute, notFound } from "@tanstack/react-router";
import { serverOnly } from "@tanstack/react-start";
import { templateNames, type TemplateName } from "~/routes/dev/email/templates";
import { buildCampaignDigestItemsHtml } from "~/shared/lib/campaign-digest";

const getRenderers = serverOnly(async () => {
  return await import("~/shared/email-templates");
});

export const Route = createFileRoute("/dev/email/$template")({
  loader: async ({ params }) => {
    if (import.meta.env.PROD) {
      throw notFound();
    }
    const name = params.template as TemplateName;
    if (!templateNames.includes(name)) {
      throw notFound();
    }
    const r = await getRenderers();
    switch (name) {
      case "welcome-email":
        return {
          html: await r.renderWelcomeEmail({
            recipientName: "Ash",
            profileUrl: "https://example.com/dashboard/profile",
          }),
        };
      case "membership-receipt":
        return {
          html: await r.renderMembershipReceiptEmail({
            recipientName: "Ash",
            membershipType: "Annual",
            amount: "$50.00",
            paymentId: "pay_123",
            expiresAt: "Dec 31, 2025",
          }),
        };
      case "game-invitation":
        return {
          html: await r.renderGameInvitationEmail({
            inviterName: "Misty",
            gameName: "Pokémon TTRPG",
            gameDescription: "Catch 'em all in tabletop form",
            gameSystem: "Custom",
            inviteUrl: "https://example.com/invite",
            expiresAt: "Jun 1, 2025",
            recipientName: "Ash",
          }),
        };
      case "campaign-invitation":
        return {
          html: await r.renderCampaignInvitationEmail({
            inviterName: "Professor Oak",
            campaignName: "Kanto Journeys",
            campaignDescription: "A grand adventure",
            gameSystem: "Pokémon RPG",
            inviteUrl: "https://example.com/campaign/invite",
            expiresAt: "Jun 1, 2025",
            recipientName: "Ash",
          }),
        };
      case "game-invite-response":
        return {
          html: await r.renderGameInviteResponseEmail({
            inviterName: "Misty",
            inviteeName: "Ash",
            gameName: "Pokémon TTRPG",
            response: "accepted",
            time: "May 1, 2025 10:00 AM",
            rosterUrl: "https://example.com/roster",
          }),
        };
      case "game-status-update":
        return {
          html: await r.renderGameStatusUpdateEmail({
            recipientName: "Ash",
            gameName: "Pokémon TTRPG",
            dateTime: "May 1, 2025 10:00 AM",
            location: "Pallet Town",
            changeSummary: "time changed to 10:00 AM",
            detailsUrl: "https://example.com/game/1",
          }),
        };
      case "game-reminder":
        return {
          html: await r.renderGameReminderEmail({
            recipientName: "Ash",
            gameName: "Pokémon TTRPG",
            dateTime: "May 1, 2025 10:00 AM",
            location: "Pallet Town",
          }),
        };
      case "campaign-invite-response":
        return {
          html: await r.renderCampaignInviteResponseEmail({
            ownerName: "Professor Oak",
            inviterName: "Brock",
            inviteeName: "Ash",
            campaignName: "Kanto Journeys",
            response: "accepted",
            time: "May 1, 2025 10:00 AM",
            detailsUrl: "https://example.com/campaign/1",
          }),
        };
      case "campaign-session-update":
        return {
          html: await r.renderCampaignSessionUpdateEmail({
            recipientName: "Ash",
            sessionTitle: "Session 1",
            dateTime: "May 1, 2025 10:00 AM",
            location: "Pallet Town",
            changeSummary: "location changed to Pallet Town",
            detailsUrl: "https://example.com/game/1",
          }),
        };
      case "campaign-digest":
        return {
          html: await r.renderCampaignDigestEmail({
            recipientName: "Ash",
            itemsHtml: buildCampaignDigestItemsHtml([
              {
                name: "Session 1",
                dateTime: "May 1, 2025 10:00 AM",
                location: "Pallet Town",
                url: "https://example.com/game/1",
              },
            ]),
            manageUrl: "https://example.com/campaign/1",
          }),
        };
      case "review-reminder":
        return {
          html: await r.renderReviewReminderEmail({
            recipientName: "Ash",
            gmName: "Brock",
            gameName: "Pokémon TTRPG",
            dateTime: "May 1, 2025 10:00 AM",
            reviewUrl: "https://example.com/review/1",
          }),
        };
      case "email-verification":
        return {
          html: await r.renderEmailVerificationEmail({
            recipientName: "Ash",
            verificationUrl: "https://example.com/verify",
            expiresAt: "May 10, 2025",
          }),
        };
      case "email-verification-otp":
        return {
          html: await r.renderEmailVerificationOTP({
            recipientName: "Ash",
            otp: "123456",
          }),
        };
      case "password-reset":
        return {
          html: await r.renderPasswordResetEmail({
            recipientName: "Ash",
            resetUrl: "https://example.com/reset",
            expiresAt: "May 10, 2025",
          }),
        };
      case "password-reset-otp":
        return {
          html: await r.renderPasswordResetOTP({
            recipientName: "Ash",
            otp: "123456",
          }),
        };
      case "sign-in-otp":
        return {
          html: await r.renderSignInOTP({
            recipientName: "Ash",
            otp: "123456",
          }),
        };
      default:
        throw notFound();
    }
  },
  component: EmailPreview,
});

function EmailPreview() {
  const { html } = Route.useLoaderData();
  /* eslint-disable @eslint-react/dom/no-dangerously-set-innerhtml */
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
