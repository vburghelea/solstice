import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { templateNames } from "~/routes/dev/email/templates";
import { Button } from "~/shared/ui/button";
import { Input } from "~/shared/ui/input";
import { Label } from "~/shared/ui/label";

export const resendMembershipReceipt = createServerFn({ method: "POST" })
  .validator(z.object({ membershipId: z.string().min(1) }).parse)
  .handler(async ({ data }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { memberships, membershipTypes } = await import(
      "~/db/schema/membership.schema"
    );
    const { user } = await import("~/db/schema/auth.schema");
    const { eq } = await import("drizzle-orm");
    const { sendMembershipPurchaseReceipt } = await import("~/lib/email/resend");

    const db = await getDb();
    const rows = await db
      .select({ membership: memberships, membershipType: membershipTypes, user })
      .from(memberships)
      .innerJoin(membershipTypes, eq(memberships.membershipTypeId, membershipTypes.id))
      .innerJoin(user, eq(memberships.userId, user.id))
      .where(eq(memberships.id, data.membershipId))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return { success: false, error: "Membership not found" };
    }

    return sendMembershipPurchaseReceipt({
      membershipId: row.membership.id,
      to: { email: row.user.email, name: row.user.name ?? undefined },
      membershipType: row.membershipType.name,
      amount: row.membershipType.priceCents,
      paymentId: row.membership.paymentId ?? "unknown",
      expiresAt: new Date(row.membership.endDate),
    });
  });

export const resendGameInvitation = createServerFn({ method: "POST" })
  .validator(z.object({ participantId: z.string().min(1) }).parse)
  .handler(async ({ data }) => {
    const { findGameParticipantById, findGameById } = await import(
      "~/features/games/games.repository"
    );
    const { sendGameInvitation } = await import("~/lib/email/resend");

    const participant = await findGameParticipantById(data.participantId);
    if (!participant) {
      return { success: false, error: "Participant not found" };
    }
    const game = await findGameById(participant.gameId);
    if (!game) {
      return { success: false, error: "Game not found" };
    }

    const inviteUrl = `${
      process.env["SITE_URL"] || "https://roundup.games"
    }/games/${participant.gameId}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return sendGameInvitation({
      invitationId: participant.id,
      to: {
        email: participant.user.email,
        name: participant.user.name ?? undefined,
      },
      inviterName: game.owner?.name || "A game organizer",
      gameName: game.name,
      gameDescription: game.description,
      gameSystem: game.gameSystem?.name || "",
      inviteUrl,
      expiresAt,
    });
  });

export const Route = createFileRoute("/dev/email/")({
  beforeLoad: () => {
    if (import.meta.env.PROD) {
      throw notFound();
    }
  },
  component: EmailTemplatesIndex,
});

function EmailTemplatesIndex() {
  const resendReceipt = useServerFn(resendMembershipReceipt);
  const resendInvite = useServerFn(resendGameInvitation);
  const [membershipId, setMembershipId] = useState("");
  const [participantId, setParticipantId] = useState("");

  const receiptMutation = useMutation({
    mutationFn: async () => resendReceipt({ data: { membershipId } }),
  });
  const inviteMutation = useMutation({
    mutationFn: async () => resendInvite({ data: { participantId } }),
  });

  return (
    <div className="space-y-8 p-4">
      <div>
        <h1 className="mb-4 text-xl font-bold">Email Template Previews</h1>
        <ul className="list-disc pl-4">
          {templateNames.map((name) => (
            <li key={name}>
              <Link to="/dev/email/$template" params={{ template: name }}>
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="max-w-sm space-y-4">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Resend Membership Receipt</h2>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              receiptMutation.mutate();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="membership-id">Membership ID</Label>
              <Input
                id="membership-id"
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={receiptMutation.isPending}>
              Resend Receipt
            </Button>
            {receiptMutation.data && (
              <p className="text-sm">
                {receiptMutation.data.success
                  ? "Email sent"
                  : `Error: ${receiptMutation.data.error}`}
              </p>
            )}
          </form>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Resend Game Invitation</h2>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              inviteMutation.mutate();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="participant-id">Participant ID</Label>
              <Input
                id="participant-id"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={inviteMutation.isPending}>
              Resend Invitation
            </Button>
            {inviteMutation.data && (
              <p className="text-sm">
                {inviteMutation.data.success
                  ? "Email sent"
                  : `Error: ${inviteMutation.data.error}`}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
