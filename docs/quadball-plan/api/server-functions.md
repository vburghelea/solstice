# TanStack Start Server Functions

Server functions in TanStack Start provide type-safe RPC-style communication between client and server. They run exclusively on the server and can access databases, APIs, and other server-only resources.

## Core Concepts

### Server Function Definition

```typescript
// src/lib/server/user.queries.ts
import { serverOnly } from "@tanstack/start";
import { db } from "~/db";

export const getUserProfile = serverOnly(async (userId: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      roles: true,
      tags: true,
      memberships: {
        with: {
          membershipType: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
});
```

### Client Usage

```typescript
// src/routes/profile.tsx
import { getUserProfile } from "~/lib/server/user.queries";
import { createServerFn } from "@tanstack/start";

export const route = createFileRoute("/profile")({
  loader: async ({ context }) => {
    const profile = await getUserProfile(context.user.id);
    return { profile };
  },
});
```

## Authentication Server Functions

### `checkSession`

Verify and refresh user session

```typescript
export const checkSession = serverOnly(async () => {
  const session = await auth.getSession();

  if (!session) {
    return null;
  }

  // Extend session if needed
  if (shouldRefreshSession(session)) {
    await auth.refreshSession(session.id);
  }

  return session;
});
```

### `getUserWithRoles`

Get user with all roles and permissions

```typescript
export const getUserWithRoles = serverOnly(async (userId: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      roles: {
        where: or(isNull(userRoles.expiresAt), gte(userRoles.expiresAt, new Date())),
      },
    },
  });

  return {
    ...user,
    permissions: calculatePermissions(user.roles),
  };
});
```

### `assignUserRole`

Grant role to user

```typescript
export const assignUserRole = serverOnly(
  async ({ userId, role, scope = "global", expiresAt, grantedBy }: AssignRoleParams) => {
    await requireRole("global_admin");

    const roleId = await db
      .insert(userRoles)
      .values({
        userId,
        role,
        scope,
        expiresAt,
        grantedBy,
      })
      .returning();

    await createAuditLog({
      action: "ROLE_ASSIGNED",
      entityType: "user_role",
      entityId: roleId[0].id,
      userId: grantedBy,
    });

    return roleId[0];
  },
);
```

## Membership Server Functions

### `getPricingForUser`

Calculate membership price with applicable discounts

```typescript
export const getPricingForUser = serverOnly(
  async (userId: string, membershipTypeId: string) => {
    const [user, membershipType, pricingRules] = await Promise.all([
      getUserWithTags(userId),
      getMembershipType(membershipTypeId),
      getActivePricingRules(),
    ]);

    let price = membershipType.priceCents;
    const appliedRules: PricingRule[] = [];

    // Apply pricing rules in priority order
    for (const rule of pricingRules) {
      if (evaluateRule(rule, { user, membershipType })) {
        price = applyPricingAction(price, rule);
        appliedRules.push(rule);
      }
    }

    return {
      originalPrice: membershipType.priceCents,
      finalPrice: price,
      appliedRules,
      savings: membershipType.priceCents - price,
    };
  },
);
```

### `createMembershipCheckout`

Initialize Square checkout for membership

```typescript
export const createMembershipCheckout = serverOnly(
  async ({ userId, membershipTypeId, returnUrl }: CheckoutParams) => {
    const pricing = await getPricingForUser(userId, membershipTypeId);

    // Create payment record
    const payment = await db
      .insert(payments)
      .values({
        userId,
        amountCents: pricing.finalPrice,
        status: "pending",
        providerId: "square",
      })
      .returning();

    // Create payment items
    await db.insert(paymentItems).values({
      paymentId: payment[0].id,
      itemType: "membership",
      itemId: membershipTypeId,
      description: `Membership: ${membershipType.name}`,
      quantity: 1,
      unitPriceCents: pricing.finalPrice,
      totalPriceCents: pricing.finalPrice,
    });

    // Create Square checkout
    const checkoutUrl = await squareClient.createCheckout({
      orderId: payment[0].id,
      amount: pricing.finalPrice,
      returnUrl,
      metadata: {
        paymentId: payment[0].id,
        userId,
        membershipTypeId,
      },
    });

    // Update payment with checkout URL
    await db.update(payments).set({ checkoutUrl }).where(eq(payments.id, payment[0].id));

    return {
      paymentId: payment[0].id,
      checkoutUrl,
    };
  },
);
```

## Team Server Functions

### `createTeam`

Create new team with validation

```typescript
export const createTeam = serverOnly(async (data: CreateTeamInput) => {
  await requireRole(["team_lead", "global_admin"]);

  // Validate slug uniqueness
  const existing = await db.query.teams.findFirst({
    where: eq(teams.slug, data.slug),
  });

  if (existing) {
    throw new ValidationError("Team slug already exists");
  }

  const team = await db.transaction(async (tx) => {
    // Create team
    const [newTeam] = await tx
      .insert(teams)
      .values({
        ...data,
        createdBy: getCurrentUserId(),
      })
      .returning();

    // Add creator as team lead
    await tx.insert(teamMembers).values({
      teamId: newTeam.id,
      userId: getCurrentUserId(),
      role: "coach",
      status: "active",
    });

    return newTeam;
  });

  return team;
});
```

### `bulkInviteTeamMembers`

Bulk invite via CSV upload

```typescript
export const bulkInviteTeamMembers = serverOnly(
  async ({ teamId, csvData }: BulkInviteParams) => {
    await requireTeamRole(teamId, ["coach", "manager"]);

    const parsed = parseCSV(csvData);
    const results = [];

    for (const row of parsed) {
      try {
        // Check if user exists
        let user = await db.query.users.findFirst({
          where: eq(users.email, row.email),
        });

        if (!user) {
          // Send invite email
          await sendTeamInvite({
            email: row.email,
            teamId,
            invitedBy: getCurrentUserId(),
          });

          results.push({
            email: row.email,
            status: "invited",
          });
        } else {
          // Add to team
          await addTeamMember({
            teamId,
            userId: user.id,
            role: row.role || "player",
            jerseyNumber: row.jerseyNumber,
          });

          results.push({
            email: row.email,
            status: "added",
          });
        }
      } catch (error) {
        results.push({
          email: row.email,
          status: "error",
          error: error.message,
        });
      }
    }

    return results;
  },
);
```

## Event Server Functions

### `createEventFromTemplate`

Create event using template

```typescript
export const createEventFromTemplate = serverOnly(
  async ({ templateId, overrides }: CreateFromTemplateParams) => {
    await requireRole(["event_coordinator", "global_admin"]);

    const template = await db.query.eventTemplates.findFirst({
      where: eq(eventTemplates.id, templateId),
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(overrides.name || template.name);

    const event = await db
      .insert(events)
      .values({
        ...template,
        ...overrides,
        id: undefined, // Don't copy ID
        slug,
        status: "draft",
        createdBy: getCurrentUserId(),
      })
      .returning();

    return event[0];
  },
);
```

### `generateEventBracket`

Generate tournament bracket

```typescript
export const generateEventBracket = serverOnly(async (eventId: string) => {
  await requireEventRole(eventId, ["coordinator"]);

  const registrations = await db.query.eventRegistrations.findMany({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.status, "confirmed"),
    ),
    with: {
      team: true,
    },
  });

  // Generate bracket based on team count
  const bracket = generateDoubleElimination({
    teams: registrations.map((r) => r.team),
    seedingMethod: "random",
  });

  // Insert games
  const games = [];
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      const [game] = await db
        .insert(eventGames)
        .values({
          eventId,
          name: match.name,
          gameType: match.type,
          scheduledAt: match.scheduledAt,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          metadata: {
            round: round.number,
            matchNumber: match.number,
          },
        })
        .returning();

      games.push(game);
    }
  }

  return {
    bracket,
    games,
  };
});
```

## Analytics Server Functions

### `getEventAnalytics`

Get comprehensive event statistics

```typescript
export const getEventAnalytics = serverOnly(async (eventId: string) => {
  await requireRole(["event_coordinator", "global_admin"]);

  const [event, registrations, revenue, demographics] = await Promise.all([
    getEvent(eventId),
    getEventRegistrationStats(eventId),
    getEventRevenue(eventId),
    getEventDemographics(eventId),
  ]);

  return {
    event: {
      name: event.name,
      startDate: event.startDate,
      status: event.status,
    },
    registrations: {
      total: registrations.total,
      confirmed: registrations.confirmed,
      pending: registrations.pending,
      byTeam: registrations.byTeam,
    },
    revenue: {
      total: revenue.total,
      collected: revenue.collected,
      pending: revenue.pending,
      refunded: revenue.refunded,
    },
    demographics: {
      ageGroups: demographics.ageGroups,
      genderBreakdown: demographics.genderBreakdown,
      locationHeatmap: demographics.locationHeatmap,
    },
  };
});
```

### `exportEventData`

Export event data to CSV/Excel

```typescript
export const exportEventData = serverOnly(
  async ({ eventId, format = "csv", includeFields }: ExportParams) => {
    await requireEventRole(eventId, ["coordinator"]);

    const registrations = await db.query.eventRegistrations.findMany({
      where: eq(eventRegistrations.eventId, eventId),
      with: {
        user: true,
        team: true,
        payment: true,
      },
    });

    // Filter fields based on privacy settings
    const exportData = registrations.map((reg) => filterExportFields(reg, includeFields));

    // Generate file
    const file = format === "csv" ? generateCSV(exportData) : generateExcel(exportData);

    // Upload to temporary storage
    const url = await uploadTempFile(file, {
      expiresIn: "1h",
    });

    return { url, expiresAt: new Date(Date.now() + 3600000) };
  },
);
```

## Utility Server Functions

### `sendBulkEmail`

Send targeted emails

```typescript
export const sendBulkEmail = serverOnly(
  async ({ query, template, subject, data }: BulkEmailParams) => {
    await requireRole("global_admin");

    // Build recipient list
    const recipients = await buildRecipientList(query);

    // Chunk for rate limiting
    const chunks = chunk(recipients, 100);

    for (const batch of chunks) {
      await sendgrid.send({
        to: batch.map((r) => ({
          email: r.email,
          name: r.name,
        })),
        templateId: template,
        dynamicTemplateData: {
          subject,
          ...data,
        },
      });

      // Rate limit delay
      await sleep(1000);
    }

    return {
      sent: recipients.length,
      template,
      timestamp: new Date(),
    };
  },
);
```

### `validateWebhookSignature`

Validate external webhook signatures

```typescript
export const validateWebhookSignature = serverOnly(
  async ({ provider, headers, body }: WebhookValidationParams) => {
    switch (provider) {
      case "square":
        return validateSquareWebhook(headers, body);
      case "sendgrid":
        return validateSendGridWebhook(headers, body);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  },
);
```

## Error Handling

All server functions should handle errors consistently:

```typescript
export const serverFunction = serverOnly(async (params) => {
  try {
    // Validate input
    const validated = schema.parse(params);

    // Check permissions
    await requirePermission("action");

    // Business logic
    const result = await performAction(validated);

    // Audit logging
    await logAction("ACTION_PERFORMED", result);

    return result;
  } catch (error) {
    // Log error
    console.error("Server function error:", error);

    // Transform error for client
    if (error instanceof ValidationError) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error.message,
      });
    }

    if (error instanceof UnauthorizedError) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    // Generic error
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "An error occurred",
    });
  }
});
```

## Performance Optimization

### Caching

```typescript
export const getCachedData = serverOnly(async (key: string) => {
  // Check cache first
  const cached = await cache.get(key);
  if (cached) return cached;

  // Fetch fresh data
  const data = await fetchData();

  // Cache for future
  await cache.set(key, data, { ttl: 300 });

  return data;
});
```

### Batching

```typescript
export const batchedLoader = createBatchedLoader(async (ids: string[]) => {
  const results = await db.query.users.findMany({
    where: inArray(users.id, ids),
  });

  // Return in same order as input
  return ids.map((id) => results.find((r) => r.id === id));
});
```

### Database Query Optimization

```typescript
export const getOptimizedTeamData = serverOnly(async (teamId: string) => {
  // Single query with all needed relations
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      members: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      games: {
        limit: 10,
        orderBy: desc(eventGames.scheduledAt),
      },
    },
  });

  return team;
});
```
