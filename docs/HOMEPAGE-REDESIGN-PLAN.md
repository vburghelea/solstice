# Homepage Redesign Plan: Member-Only Portal

**Status**: ✅ Implemented (Phase 4 optional)
**Priority**: P1
**Completed**: December 2025

---

## Context

The public-facing Quadball Canada marketing site is now live at `quadball-canada` (Astro + Sanity). Solstice can now be redesigned as a **member-only portal** focused on operational tasks rather than marketing.

---

## Current State

### `/` (Homepage)

- Full marketing page with hero, stats, pillars, Team Canada spotlight
- Uses `PublicLayout`
- Only fetches `getUpcomingEvents`
- **Action**: Replace entirely

### `/dashboard/` (Member Dashboard)

- Already has membership status + teams cards
- Missing: pending invites, upcoming events, profile completion, admin tools
- Uses route context for user
- **Action**: Enhance and potentially merge with homepage

---

## Implementation Plan

### Phase 1: Auth-Aware Homepage Route ✅ COMPLETED

**File**: `src/routes/index.tsx`

Replaced the marketing page with auth-aware loader:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { defer, Await } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { Suspense } from "react";

// Define query options for TanStack Query integration
const membershipQueryOptions = queryOptions({
  queryKey: ["membership-status"],
  queryFn: () => getUserMembershipStatus(),
});

const teamsQueryOptions = queryOptions({
  queryKey: ["user-teams"],
  queryFn: () => getUserTeams({ data: {} }),
});

const invitesQueryOptions = queryOptions({
  queryKey: ["pending-invites"],
  queryFn: () => getPendingTeamInvites(),
});

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const user = await getCurrentUser();
    if (!user) {
      return { view: "public" as const };
    }

    // Critical data - blocks render (fast queries)
    const [membershipStatus, profileStatus] = await Promise.all([
      context.queryClient.ensureQueryData(membershipQueryOptions),
      getProfileCompletionStatus(),
    ]);

    // Deferred data - streams in background (slower queries)
    return {
      view: "dashboard" as const,
      user,
      membershipStatus,
      profileStatus,
      // Use defer() for non-critical data that can stream
      userTeams: defer(context.queryClient.ensureQueryData(teamsQueryOptions)),
      pendingInvites: defer(context.queryClient.ensureQueryData(invitesQueryOptions)),
      upcomingEvents: defer(getUpcomingEvents({ data: { limit: 5 } })),
    };
  },
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();

  if (data.view === "public") {
    return <PublicPortalPage />;
  }

  return <MemberDashboard {...data} />;
}

// In MemberDashboard, use Await for deferred data:
function TeamsSection({ teamsPromise }) {
  return (
    <Suspense fallback={<TeamsSkeleton />}>
      <Await promise={teamsPromise}>{(teams) => <TeamsList teams={teams} />}</Await>
    </Suspense>
  );
}
```

**Key patterns from TanStack Start 2025:**

- Use `queryOptions` for TanStack Query integration
- Use `context.queryClient.ensureQueryData` for SSR prefetching
- Use `defer()` for non-blocking data that can stream
- Use `<Await>` + `<Suspense>` to render deferred data

### Phase 2: Public Portal Page (Unauthenticated) ✅ COMPLETED

**Component**: `src/features/dashboard/PublicPortalPage.tsx`

Minimal page for unauthenticated visitors:

- "Quadball Canada Members Portal" heading
- Brief explanation: "This is the member management system for registered players, teams, and officials."
- **Login** button → `/auth/login`
- **Sign up** button → `/auth/signup`
- Link: "Looking for general info? Visit quadballcanada.ca" → external marketing site

---

### Phase 3: Enhanced Member Dashboard ✅ COMPLETED

**Component**: `src/features/dashboard/MemberDashboard.tsx`

#### Section 1: Header

- Welcome message with user name
- Status chips: Active Member / Membership Required / Admin / Captain

#### Section 2: Action Row ("Your Next Steps")

Show 2-4 contextual tasks based on state:

| Condition                             | Task Card                                       |
| ------------------------------------- | ----------------------------------------------- |
| `!profileStatus.isComplete`           | "Complete your profile" → `/dashboard/profile`  |
| `!membershipStatus.hasMembership`     | "Activate membership" → `/dashboard/membership` |
| `membershipStatus.daysRemaining < 30` | "Renew membership" → `/dashboard/membership`    |
| `pendingInvites.length > 0`           | "Respond to team invites" → `/dashboard/teams`  |
| `upcomingEvents.length > 0`           | "Register for events" → `/events`               |

#### Section 3: Your Teams + Pending Invites

- List of user's teams with role badges
- Pending invitations with Accept/Decline buttons
- "No teams yet" state with link to browse teams

#### Section 4: Membership Status Card

- Active/Inactive badge
- Expiration date + days remaining
- Renewal CTA if near expiry
- "View options" if no membership

#### Section 5: Upcoming Events

- Use existing `getUpcomingEvents` data
- Later: Add "My Registrations" section (requires new query)

#### Section 6: Admin Tools (Conditional)

Show only if `isAnyAdmin(user)`:

- "Admin Dashboard" → `/dashboard/admin`
- Links to: Members, Roles, Events Review

---

### Phase 4: New Server Function - My Event Registrations ⏳ OPTIONAL

**File**: `src/features/events/events.queries.ts`

Optional enhancement to fetch user's event registrations. Can be added when needed:

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Schema for optional filters
const myRegistrationsSchema = z
  .object({
    includeTeamRegistrations: z.boolean().optional().default(false),
    limit: z.number().optional().default(10),
  })
  .optional();

export const getMyEventRegistrations = createServerFn({ method: "GET" })
  .validator(myRegistrationsSchema.parse)
  .handler(async ({ data }) => {
    // Use dynamic import for server-only database code
    const { getDb } = await import("~/db");
    const { auth } = await import("~/lib/auth");
    const { getHeaders } = await import("@tanstack/react-start/server");

    const session = await auth.api.getSession({ headers: await getHeaders() });
    if (!session?.user) {
      return { success: false as const, registrations: [] };
    }

    const db = getDb();
    const registrations = await db
      .select({
        registration: eventRegistrations,
        event: events,
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(
        and(
          eq(eventRegistrations.userId, session.user.id),
          ne(eventRegistrations.status, "cancelled"),
          gte(events.endDate, new Date()),
        ),
      )
      .orderBy(asc(events.startDate))
      .limit(data?.limit ?? 10);

    return { success: true as const, registrations };
  });
```

**Key patterns:**

- Use `.validator()` with Zod schema for type safety
- Use dynamic imports inside handler for server-only code (prevents client bundle pollution)
- Return discriminated union (`success: true as const`) for type-safe error handling

---

### Phase 5: Cleanup ✅ COMPLETED

1. **Remove marketing content** from Solstice:
   - Delete hero section components if unused elsewhere
   - Remove `PublicLayout` if no longer needed
   - Clean up unused imports

2. **Update navigation**:
   - Unauthenticated: Show only Login/Signup
   - Authenticated: Show dashboard nav

3. **Redirect `/dashboard`**:
   - Consider making `/dashboard` redirect to `/` for simplicity
   - Or keep both with `/` as the smart entry point

---

## Validation Checklist

### Server Functions (All Exist ✅)

- [x] `getCurrentUser` - `src/features/auth/auth.queries.ts`
- [x] `getUserMembershipStatus` - `src/features/membership/membership.queries.ts`
- [x] `getUserTeams` - `src/features/teams/teams.queries.ts`
- [x] `getPendingTeamInvites` - `src/features/teams/teams.queries.ts`
- [x] `getUpcomingEvents` - `src/features/events/events.queries.ts`
- [x] `getProfileCompletionStatus` - `src/features/profile/profile.queries.ts`
- [x] `isAnyAdmin` - `src/features/roles/permission.service.ts`

### New Functions Needed

- [ ] `getMyEventRegistrations` - User's upcoming event registrations
- [ ] (Optional) `getMyManagedEvents` - Events user has admin role for

---

## File Changes Summary

| File                                          | Status                                                                |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `src/routes/index.tsx`                        | ✅ **Replaced** - Auth-aware homepage                                 |
| `src/features/dashboard/MemberDashboard.tsx`  | ✅ **Created** - Main dashboard component (includes all sub-sections) |
| `src/features/dashboard/PublicPortalPage.tsx` | ✅ **Created** - Unauthenticated portal page                          |
| `src/features/dashboard/index.ts`             | ✅ **Created** - Barrel exports                                       |
| `src/features/events/events.queries.ts`       | ⏳ **Optional** - Add `getMyEventRegistrations` when needed           |

**Note**: Sub-components (ActionCards, TeamsSection, MembershipCard, AdminTools) were implemented directly within `MemberDashboard.tsx` to reduce file sprawl while keeping the component well-organized.

---

## Nice-to-Have Improvements (Later)

1. **Profile completion semantics**: Align `isProfileComplete`, `getProfileCompletionStatus`, and `requireCompleteProfile`

2. **Unify permission services**: Consolidate `permission.server.ts` and `permission.service.ts`

3. **Membership history**: Add "View membership history" page

4. **Event registrations detail**: Show registration status, payment status, roster completeness

---

## Testing

1. **E2E Tests to Add**:
   - Unauthenticated user sees portal page
   - Authenticated user sees dashboard
   - Action cards appear based on state
   - Admin tools visible only for admins

2. **Manual Testing**:
   - Use Playwright MCP to verify both states
   - Check responsive layout
   - Verify all data loads correctly

---

## Implementation Order

1. Create `PublicPortalPage.tsx` (simple, quick win)
2. Create basic `MemberDashboard.tsx` with existing data
3. Update `src/routes/index.tsx` with auth-aware logic
4. Add `getMyEventRegistrations` query
5. Enhance dashboard with all sections
6. Add E2E tests
7. Clean up old marketing components
