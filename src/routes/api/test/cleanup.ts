import { createFileRoute } from "@tanstack/react-router";
import { and, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { debugGuard } from "~/lib/server/debug-guard";

const cleanupSchema = z.object({
  action: z.enum([
    "reset-user",
    "delete-team",
    "clear-user-teams",
    "clear-user-memberships",
    "ensure-org-member",
    "remove-org-member",
    "delete-import-jobs",
    "expire-session",
    "set-mfa",
  ]),
  userId: z.string().optional(),
  teamId: z.string().optional(),
  userEmail: z.email().optional(),
  organizationId: z.string().optional(),
  organizationSlug: z.string().optional(),
  fileName: z.string().optional(),
  ageMinutes: z.number().int().positive().optional(),
  mfaRequired: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export const Route = createFileRoute("/api/test/cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Block access in production builds - returns 404
        // Uses import.meta.env.PROD which is a compile-time constant
        // and cannot be bypassed via environment variables
        const guardResponse = debugGuard();
        if (guardResponse) return guardResponse;

        try {
          const body = await request.json();
          const {
            action,
            userId,
            teamId,
            userEmail,
            organizationId,
            organizationSlug,
            fileName,
            ageMinutes,
            mfaRequired,
            twoFactorEnabled,
          } = cleanupSchema.parse(body);

          // Import server-only modules inside the handler
          const { getDb } = await import("~/db/server-helpers");
          const {
            forms,
            importJobs,
            organizationMembers,
            organizations,
            teams,
            teamMembers,
            user,
            memberships,
            session,
          } = await import("~/db/schema");

          const db = await getDb();

          switch (action) {
            case "clear-user-teams": {
              // Remove all team memberships for a user
              if (userId) {
                await db.delete(teamMembers).where(eq(teamMembers.userId, userId));
              } else if (userEmail) {
                const [targetUser] = await db
                  .select({ id: user.id })
                  .from(user)
                  .where(eq(user.email, userEmail));

                if (targetUser) {
                  await db
                    .delete(teamMembers)
                    .where(eq(teamMembers.userId, targetUser.id));
                }
              }
              return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            case "delete-team": {
              // Delete a team and all its memberships
              if (teamId) {
                await db.transaction(async (tx) => {
                  await tx.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
                  await tx.delete(teams).where(eq(teams.id, teamId));
                });
              }
              return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            case "reset-user": {
              // Reset user to clean state (remove teams, memberships, etc.)
              if (userId || userEmail) {
                const targetUserId =
                  userId ||
                  (await db
                    .select({ id: user.id })
                    .from(user)
                    .where(eq(user.email, userEmail!))
                    .then((rows) => rows[0]?.id));

                if (targetUserId) {
                  // Remove team memberships
                  await db
                    .delete(teamMembers)
                    .where(eq(teamMembers.userId, targetUserId));

                  // Remove memberships
                  await db
                    .delete(memberships)
                    .where(eq(memberships.userId, targetUserId));

                  // Reset profile to incomplete state
                  await db
                    .update(user)
                    .set({
                      profileComplete: false,
                      dateOfBirth: null,
                      phone: null,
                      gender: null,
                      pronouns: null,
                      emergencyContact: null,
                      privacySettings: null,
                      profileUpdatedAt: null,
                      mfaRequired: false,
                      mfaEnrolledAt: null,
                      twoFactorEnabled: false,
                    })
                    .where(eq(user.id, targetUserId));
                }
              }
              return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            case "clear-user-memberships": {
              // Remove all memberships for a user
              if (userId || userEmail) {
                const targetUserId =
                  userId ||
                  (await db
                    .select({ id: user.id })
                    .from(user)
                    .where(eq(user.email, userEmail!))
                    .then((rows) => rows[0]?.id));

                if (targetUserId) {
                  await db
                    .delete(memberships)
                    .where(eq(memberships.userId, targetUserId));
                }
              }
              return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            case "ensure-org-member": {
              if (!userId && !userEmail) {
                return new Response(
                  JSON.stringify({ success: false, error: "User required." }),
                  {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              const targetUserId =
                userId ||
                (await db
                  .select({ id: user.id })
                  .from(user)
                  .where(eq(user.email, userEmail!))
                  .then((rows) => rows[0]?.id));

              if (!targetUserId) {
                return new Response(
                  JSON.stringify({ success: false, error: "User not found." }),
                  {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              let organization =
                organizationId || organizationSlug
                  ? await db
                      .select({
                        id: organizations.id,
                        name: organizations.name,
                        slug: organizations.slug,
                      })
                      .from(organizations)
                      .where(
                        organizationId
                          ? eq(organizations.id, organizationId)
                          : eq(organizations.slug, organizationSlug!),
                      )
                      .then((rows) => rows[0])
                  : undefined;

              if (!organization) {
                const [withForms] = await db
                  .select({
                    id: organizations.id,
                    name: organizations.name,
                    slug: organizations.slug,
                  })
                  .from(organizations)
                  .innerJoin(forms, eq(forms.organizationId, organizations.id))
                  .where(eq(organizations.status, "active"))
                  .limit(1);
                organization = withForms;
              }

              if (!organization) {
                const [fallback] = await db
                  .select({
                    id: organizations.id,
                    name: organizations.name,
                    slug: organizations.slug,
                  })
                  .from(organizations)
                  .where(eq(organizations.status, "active"))
                  .limit(1);
                organization = fallback;
              }

              if (!organization) {
                return new Response(
                  JSON.stringify({
                    success: false,
                    error: "No organization available.",
                  }),
                  {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              const now = new Date();
              await db
                .insert(organizationMembers)
                .values({
                  userId: targetUserId,
                  organizationId: organization.id,
                  role: "admin",
                  status: "active",
                  approvedBy: targetUserId,
                  approvedAt: now,
                })
                .onConflictDoUpdate({
                  target: [
                    organizationMembers.userId,
                    organizationMembers.organizationId,
                  ],
                  set: {
                    role: "admin",
                    status: "active",
                    approvedBy: targetUserId,
                    approvedAt: now,
                  },
                });

              return new Response(JSON.stringify({ success: true, organization }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            case "remove-org-member": {
              if (!userId && !userEmail) {
                return new Response(
                  JSON.stringify({ success: false, error: "User required." }),
                  {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              const targetUserId =
                userId ||
                (await db
                  .select({ id: user.id })
                  .from(user)
                  .where(eq(user.email, userEmail!))
                  .then((rows) => rows[0]?.id));

              if (!targetUserId) {
                return new Response(
                  JSON.stringify({ success: false, error: "User not found." }),
                  {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              let targetOrganizationId = organizationId;
              if (!targetOrganizationId && organizationSlug) {
                const [org] = await db
                  .select({ id: organizations.id })
                  .from(organizations)
                  .where(eq(organizations.slug, organizationSlug))
                  .limit(1);
                targetOrganizationId = org?.id;
              }

              if (!targetOrganizationId) {
                return new Response(
                  JSON.stringify({
                    success: false,
                    error: "Organization required.",
                  }),
                  {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              await db
                .delete(organizationMembers)
                .where(
                  and(
                    eq(organizationMembers.userId, targetUserId),
                    eq(organizationMembers.organizationId, targetOrganizationId),
                  ),
                );

              return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            case "delete-import-jobs": {
              if (!userId && !userEmail) {
                return new Response(
                  JSON.stringify({ success: false, error: "User required." }),
                  {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              const targetUserId =
                userId ||
                (await db
                  .select({ id: user.id })
                  .from(user)
                  .where(eq(user.email, userEmail!))
                  .then((rows) => rows[0]?.id));

              if (!targetUserId) {
                return new Response(
                  JSON.stringify({ success: false, error: "User not found." }),
                  {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }

              const conditions = [eq(importJobs.createdBy, targetUserId)];
              if (organizationId) {
                conditions.push(eq(importJobs.organizationId, organizationId));
              }
              if (fileName) {
                conditions.push(ilike(importJobs.sourceFileKey, `%${fileName}%`));
              }

              await db
                .delete(importJobs)
                .where(conditions.length === 1 ? conditions[0] : and(...conditions));

              return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            case "expire-session": {
              if (userId || userEmail) {
                const targetUserId =
                  userId ||
                  (await db
                    .select({ id: user.id })
                    .from(user)
                    .where(eq(user.email, userEmail!))
                    .then((rows) => rows[0]?.id));

                if (targetUserId) {
                  const offsetMinutes = Math.max(1, ageMinutes ?? 20);
                  const targetTime = new Date(Date.now() - offsetMinutes * 60 * 1000);
                  await db
                    .update(session)
                    .set({
                      createdAt: targetTime,
                      updatedAt: targetTime,
                      lastActivityAt: targetTime,
                    })
                    .where(eq(session.userId, targetUserId));
                }
              }
              return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            case "set-mfa": {
              if (userId || userEmail) {
                const targetUserId =
                  userId ||
                  (await db
                    .select({ id: user.id })
                    .from(user)
                    .where(eq(user.email, userEmail!))
                    .then((rows) => rows[0]?.id));

                if (targetUserId) {
                  const nextMfaRequired = mfaRequired ?? false;
                  const nextTwoFactorEnabled = twoFactorEnabled ?? false;
                  await db
                    .update(user)
                    .set({
                      mfaRequired: nextMfaRequired,
                      twoFactorEnabled: nextTwoFactorEnabled,
                      mfaEnrolledAt: nextTwoFactorEnabled ? new Date() : null,
                    })
                    .where(eq(user.id, targetUserId));
                }
              }
              return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            default:
              return new Response(JSON.stringify({ error: "Invalid action" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
              });
          }
        } catch (error) {
          console.error("Cleanup error:", error);
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Cleanup failed",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
