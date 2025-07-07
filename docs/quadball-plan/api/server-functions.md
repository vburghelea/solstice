# Server Functions Guide

Server functions in TanStack Start provide type-safe communication between client and server code. They are the primary way to implement backend logic in this project.

## Overview

Server functions are wrapped with `serverOnly()` to ensure they only run on the server. They have full access to:

- Database operations via Drizzle ORM
- Authentication state via Better Auth
- External APIs and services
- Server-side environment variables

## Creating a Server Function

### Step 1: Create a Server Function File

Server functions should be organized in feature directories with naming conventions:

- `.queries.ts` - For data fetching operations
- `.mutations.ts` - For data modification operations

```typescript
// src/features/teams/teams.queries.ts
import { serverOnly } from "@tanstack/start";
import { db } from "~/db";
import { teams } from "~/db/schema";
import { eq } from "drizzle-orm";

export const getTeam = serverOnly(async (teamId: string) => {
  const team = await db.query.teams.findFirst({
    where: eq(teams.id, teamId),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  });

  if (!team) {
    throw new Error("Team not found");
  }

  return team;
});
```

### Step 2: Handle Authentication & Authorization

Use the auth context to check permissions:

```typescript
// src/features/teams/teams.mutations.ts
import { serverOnly } from "@tanstack/start";
import { getAuthFromHeaders } from "~/lib/auth/utils";
import { requireRole } from "~/lib/auth/rbac";

export const createTeam = serverOnly(async (data: CreateTeamInput) => {
  // Get current user
  const auth = await getAuthFromHeaders();
  if (!auth.user) {
    throw new Error("Unauthorized");
  }

  // Check permissions
  await requireRole(auth.user.id, ["team_lead", "global_admin"]);

  // Create team...
});
```

### Step 3: Implement Error Handling

Always handle errors appropriately:

```typescript
export const updateTeam = serverOnly(async (teamId: string, data: UpdateTeamInput) => {
  try {
    // Validate input
    const validated = updateTeamSchema.parse(data);

    // Check permissions
    const auth = await getAuthFromHeaders();
    await requireTeamRole(auth.user.id, teamId, ["coach", "manager"]);

    // Update team
    const updated = await db
      .update(teams)
      .set(validated)
      .where(eq(teams.id, teamId))
      .returning();

    return updated[0];
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Invalid input: " + error.message);
    }

    if (error instanceof UnauthorizedError) {
      throw new Error("Unauthorized");
    }

    // Log unexpected errors
    console.error("Update team error:", error);
    throw new Error("Failed to update team");
  }
});
```

### Step 4: Call from Client Components

Use TanStack Query to call server functions:

```tsx
// src/routes/teams/$teamId.tsx
import { useMutation, useQuery } from "@tanstack/react-query";
import { getTeam, updateTeam } from "~/features/teams/teams.queries";

export default function TeamPage() {
  const params = useParams({ from: "/teams/$teamId" });

  // Fetch data
  const { data: team, isLoading } = useQuery({
    queryKey: ["team", params.teamId],
    queryFn: () => getTeam(params.teamId),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateTeamInput) => updateTeam(params.teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", params.teamId] });
    },
  });

  // Use in component...
}
```

## Best Practices

### 1. File Organization

```
src/features/
├── auth/
│   ├── auth.queries.ts      # getUserProfile, checkSession
│   └── auth.mutations.ts    # updateProfile, changePassword
├── teams/
│   ├── teams.queries.ts     # getTeam, listTeams
│   └── teams.mutations.ts   # createTeam, updateTeam
└── events/
    ├── events.queries.ts    # getEvent, searchEvents
    └── events.mutations.ts  # createEvent, registerForEvent
```

### 2. Type Safety

Always define input and output types:

```typescript
// src/features/teams/teams.types.ts
export interface CreateTeamInput {
  name: string;
  slug: string;
  description?: string;
}

export interface TeamWithMembers {
  id: string;
  name: string;
  members: Array<{
    userId: string;
    role: TeamRole;
    user: User;
  }>;
}

// Use in server function
export const createTeam = serverOnly(async (input: CreateTeamInput): Promise<Team> => {
  // Implementation...
});
```

### 3. Authentication Patterns

Create reusable auth utilities:

```typescript
// src/lib/auth/utils.ts
export async function getCurrentUser() {
  const auth = await getAuthFromHeaders();
  if (!auth.user) {
    throw new UnauthorizedError();
  }
  return auth.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  return user;
}

// Use in server functions
export const myProtectedFunction = serverOnly(async () => {
  const user = await requireAuth();
  // User is guaranteed to be authenticated
});
```

### 4. Database Transactions

Use transactions for multi-step operations:

```typescript
export const transferTeamOwnership = serverOnly(
  async (teamId: string, newOwnerId: string) => {
    const user = await requireAuth();

    return await db.transaction(async (tx) => {
      // Remove old owner
      await tx
        .update(teamMembers)
        .set({ role: "player" })
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, "owner")));

      // Set new owner
      await tx
        .update(teamMembers)
        .set({ role: "owner" })
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, newOwnerId)));

      // Log the change
      await tx.insert(auditLogs).values({
        action: "TEAM_OWNERSHIP_TRANSFERRED",
        userId: user.id,
        metadata: { teamId, newOwnerId },
      });
    });
  },
);
```

### 5. Caching Strategy

Use React Query's caching effectively:

```typescript
// Define stable query keys
export const teamKeys = {
  all: ["teams"] as const,
  lists: () => [...teamKeys.all, "list"] as const,
  list: (filters: TeamFilters) => [...teamKeys.lists(), filters] as const,
  details: () => [...teamKeys.all, "detail"] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
};

// Use in components
const { data } = useQuery({
  queryKey: teamKeys.detail(teamId),
  queryFn: () => getTeam(teamId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## Common Patterns

### Pagination

```typescript
export const listTeams = serverOnly(
  async (params: { page?: number; limit?: number; search?: string }) => {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const query = db.select().from(teams).limit(limit).offset(offset);

    if (params.search) {
      query.where(like(teams.name, `%${params.search}%`));
    }

    const [items, totalCount] = await Promise.all([
      query,
      db.select({ count: count() }).from(teams),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    };
  },
);
```

### Bulk Operations

```typescript
export const bulkUpdatePlayers = serverOnly(async (updates: PlayerUpdate[]) => {
  const user = await requireAuth();

  const results = await Promise.allSettled(
    updates.map(async (update) => {
      try {
        await updatePlayer(update.id, update.data);
        return { id: update.id, status: "success" };
      } catch (error) {
        return { id: update.id, status: "error", error: error.message };
      }
    }),
  );

  return results.map((r) => (r.status === "fulfilled" ? r.value : r.reason));
});
```

### File Uploads

```typescript
export const uploadTeamLogo = serverOnly(async (teamId: string, file: File) => {
  const user = await requireAuth();
  await requireTeamRole(user.id, teamId, ["coach", "manager"]);

  // Upload to S3/Cloudinary
  const uploadResult = await uploadFile(file, {
    folder: `teams/${teamId}`,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ["image/jpeg", "image/png"],
  });

  // Update team record
  await db.update(teams).set({ logoUrl: uploadResult.url }).where(eq(teams.id, teamId));

  return uploadResult;
});
```

## Testing Server Functions

Create unit tests for server functions:

```typescript
// src/features/teams/teams.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTeam } from "./teams.mutations";
import { mockAuth } from "~/tests/mocks/auth";

describe("createTeam", () => {
  beforeEach(() => {
    mockAuth({ userId: "user-1", roles: ["team_lead"] });
  });

  it("creates a team with valid input", async () => {
    const team = await createTeam({
      name: "Test Team",
      slug: "test-team",
    });

    expect(team).toMatchObject({
      name: "Test Team",
      slug: "test-team",
    });
  });

  it("throws error without authentication", async () => {
    mockAuth(null);

    await expect(
      createTeam({
        name: "Test Team",
        slug: "test-team",
      }),
    ).rejects.toThrow("Unauthorized");
  });
});
```

## Migration from REST

If migrating from REST endpoints, map them to server functions:

| REST Endpoint              | Server Function        |
| -------------------------- | ---------------------- |
| GET /api/teams/:id         | `getTeam(id)`          |
| POST /api/teams            | `createTeam(data)`     |
| PUT /api/teams/:id         | `updateTeam(id, data)` |
| DELETE /api/teams/:id      | `deleteTeam(id)`       |
| GET /api/teams/:id/members | `getTeamMembers(id)`   |

The key difference is that server functions are called directly from React components with full type safety, rather than using fetch() with manual type casting.
