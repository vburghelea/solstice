# Production Readiness Tickets

---

## TICKET-001 - Lock down Square debug endpoints ✅ COMPLETE

**Priority: P0**
**Status: DONE** - Created debug-guard.ts, updated all debug endpoints to return 404 in production

### Problem

Debug routes expose Square configuration details and can create live checkout links:

- `GET /api/test-square` leaks configuration state
- `GET /api/debug-square` actively calls `createCheckoutSession`, creating real Square payment links

### Solution

**Option A (preferred):** Delete these routes entirely before production.

**Option B:** Hard gate them with multiple checks:

1. Create `src/lib/server/debug-guard.ts`:

```ts
import { getRequest } from "@tanstack/react-start/server";
import { getAuth } from "~/lib/auth/server-helpers";
import { isAdmin } from "~/lib/auth/utils/admin-check";

export async function requireDebugAccess(): Promise<Response | null> {
  const enabled = process.env["ENABLE_DEBUG_ROUTES"] === "true";
  const isProd = process.env["NODE_ENV"] === "production";

  if (!enabled || isProd) {
    return new Response("Not Found", { status: 404 });
  }

  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });

  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdmin(userId))) return new Response("Forbidden", { status: 403 });

  return null;
}
```

2. Update debug routes to use guard and **remove checkout creation logic**
3. Only return coarse status info, not secret-adjacent details

### Relevant files

- src/routes/api/debug-square.ts
- src/routes/api/test-square.ts
- src/lib/payments/square.ts
- src/lib/payments/square-real.ts
- src/lib/auth/middleware/auth-guard.ts
- src/lib/server/auth.ts

---

## TICKET-002 - Prevent cached authenticated HTML via PWA ✅ COMPLETE

**Priority: P0**
**Status: DONE** - Changed to NetworkOnly for documents, added no-cache headers in netlify.toml

### Problem

Workbox caches all document requests including authenticated HTML, which can:

- Cache User A's SSR HTML and show it after logout
- Let User B on same device see User A's cached HTML
- Surface stale/personalized markup in offline mode

### Solution

1. **Update `vite.config.ts`** - Replace document caching with NetworkOnly:

```ts
workbox: {
  runtimeCaching: [
    // Never cache SSR HTML navigations
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkOnly",
    },
    // Keep image caching
    {
      urlPattern: ({ request }) => request.destination === "image",
      handler: "CacheFirst",
      options: {
        cacheName: "qc-images",
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
  ],
  cleanupOutdatedCaches: true,
},
```

2. **Defense in depth** - Add `Cache-Control: no-store` headers in `netlify.toml`:

```toml
[[headers]]
  for = "/dashboard/*"
  [headers.values]
    Cache-Control = "no-store"

[[headers]]
  for = "/onboarding/*"
  [headers.values]
    Cache-Control = "no-store"

[[headers]]
  for = "/auth/*"
  [headers.values]
    Cache-Control = "no-store"
```

### Relevant files

- vite.config.ts
- netlify.toml
- netlify/edge-functions/security-headers.ts

---

## TICKET-003 - Add server-side rate limiting ⏸️ DEFERRED

**Priority: P0**
**Status: DEFERRED** - Requires Upstash Redis setup (user action needed)

### Problem

Rate limiting is only client-side (TanStack Pacer). Client-side limits don't protect against:

- curl/postman abuse
- botnets
- anyone bypassing the browser

### Solution

Implement Upstash Redis rate limiting:

1. **Create `src/lib/security/rate-limit.ts`**:

```ts
import { setResponseStatus } from "@tanstack/react-start/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TypedServerError } from "~/lib/server/errors";

const redis = process.env["UPSTASH_REDIS_REST_URL"] ? Redis.fromEnv() : null;

const limiters = redis
  ? {
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "rl:auth",
      }),
      mutation: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(20, "1 m"),
        prefix: "rl:mutation",
      }),
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        prefix: "rl:api",
      }),
    }
  : null;

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "unknown";
}

export async function rateLimit(type: keyof typeof limiters, key: string) {
  if (!limiters) {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error("Rate limiter not configured in production");
    }
    return;
  }

  const result = await limiters[type].limit(key);
  if (!result.success) {
    setResponseStatus(429);
    throw new TypedServerError({
      code: "VALIDATION",
      message: "Too many requests. Please try again later.",
    });
  }
}
```

2. **Apply to `/api/auth/$`** (rate limit by IP):

```ts
const ip = getClientIp(request.headers);
await rateLimit("auth", `ip:${ip}`);
```

3. **Apply to mutations** (rate limit by user ID):

```ts
await rateLimit("mutation", `user:${user.id}`);
```

### Relevant files

- src/lib/security/rate-limit.ts (new)
- src/routes/api/auth/$.ts
- src/features/membership/membership.mutations.ts
- src/features/events/events.mutations.ts

---

## TICKET-004 - Remove default BETTER_AUTH_SECRET fallback ✅ COMPLETE

**Priority: P0**
**Status: DONE** - Removed .prefault(), now requires 32+ char secret

### Problem

`src/lib/env.server.ts` has:

```ts
BETTER_AUTH_SECRET: z.string().min(1).prefault("dev-secret-change-in-production");
```

This allows production to silently use a known default, enabling session token forging.

### Solution

**Remove the fallback entirely:**

```ts
BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be set and should be long/random"),
```

**If previews need a fallback, fail only in production:**

```ts
BETTER_AUTH_SECRET: z.string()
  .optional()
  .transform((val, ctx) => {
    const nodeEnv = process.env["NODE_ENV"] ?? "development";
    if (nodeEnv === "production" && !val) {
      ctx.addIssue({
        code: "custom",
        message: "BETTER_AUTH_SECRET is required in production",
      });
      return z.NEVER;
    }
    return val ?? "dev-only-secret";
  });
```

**Recommendation:** No fallback anywhere. Force correct configuration in all deployed contexts.

### Relevant files

- src/lib/env.server.ts
- scripts/generate-auth-secret.js
- .env.example

---

## TICKET-005 - Fix client process shim behavior ✅ COMPLETE

**Priority: P1**
**Status: DONE** - Changed to use import.meta.env.PROD for correct NODE_ENV in production

### Problem

In `src/routes/__root.tsx`, the process shim forces `NODE_ENV: 'development'` in production, which can enable dev-only code paths.

### Solution

Set NODE_ENV correctly based on build mode:

```tsx
// In RootDocument
const nodeEnv = import.meta.env.PROD ? "production" : "development";

<ScriptOnce>
  {`
    if (typeof globalThis.process === 'undefined') {
      globalThis.process = {
        env: { NODE_ENV: '${nodeEnv}' },
        versions: {}
      };
    }
  `}
</ScriptOnce>;
```

### Relevant files

- src/routes/\_\_root.tsx
- netlify/edge-functions/security-headers.ts (update CSP hash if needed)

---

## TICKET-006 - Gate React Query and Router devtools in production ✅ COMPLETE

**Priority: P1**
**Status: DONE** - Conditional lazy loading excludes devtools from production bundles

### Problem

Devtools are always rendered (behind Suspense, but still mounted) and ship in production bundles.

### Solution

Don't define lazy imports unless in dev:

```tsx
import { lazy, Suspense } from "react";

let ReactQueryDevtools: React.LazyExoticComponent<React.ComponentType<any>> | null = null;
let TanStackRouterDevtools: React.LazyExoticComponent<React.ComponentType<any>> | null =
  null;

if (import.meta.env.DEV) {
  ReactQueryDevtools = lazy(() =>
    import("@tanstack/react-query-devtools").then((mod) => ({
      default: mod.ReactQueryDevtools,
    })),
  );
  TanStackRouterDevtools = lazy(() =>
    import("@tanstack/react-router-devtools").then((mod) => ({
      default: mod.TanStackRouterDevtools,
    })),
  );
}

// In render:
{
  import.meta.env.DEV && ReactQueryDevtools && TanStackRouterDevtools && (
    <Suspense fallback={null}>
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </Suspense>
  );
}
```

### Relevant files

- src/routes/\_\_root.tsx

---

## TICKET-007 - Align TanStack package versions ✅ COMPLETE

**Priority: P1**
**Status: DONE** - All TanStack packages aligned to ^1.139.12

### Problem

TanStack packages have mixed minor versions causing potential runtime incompatibilities:

- `@tanstack/react-router` at `^1.139.12`
- `@tanstack/react-router-devtools` at `^1.132.2`
- `@tanstack/react-router-ssr-query` at `^1.132.2`
- `@tanstack/start-storage-context` at `^1.132.48`

### Solution

Align all to `1.139.12`:

```json
"@tanstack/react-router-devtools": "^1.139.12",
"@tanstack/react-router-ssr-query": "^1.139.12",
"@tanstack/start-storage-context": "^1.139.12",
```

Then run:

```bash
pnpm up
pnpm install
```

Consider using `~1.139.12` instead of `^1.139.12` to prevent minor drift.

### Relevant files

- package.json
- pnpm-lock.yaml

---

## TICKET-008 - Pin Node version for Netlify builds ✅ COMPLETE

**Priority: P1**
**Status: DONE** - Added NODE_VERSION=22.12.0 and PNPM_VERSION=10.12.4 to all contexts

### Problem

Netlify build environment is not pinned to the Node version in `package.json` engines.

### Solution

Add to `netlify.toml`:

```toml
[build.environment]
  NODE_ENV = "production"
  NODE_VERSION = "22.12.0"
  PNPM_VERSION = "10.12.4"

[context.deploy-preview.environment]
  NODE_ENV = "test"
  NODE_VERSION = "22.12.0"
  PNPM_VERSION = "10.12.4"

[context.branch-deploy.environment]
  NODE_ENV = "test"
  NODE_VERSION = "22.12.0"
  PNPM_VERSION = "10.12.4"
```

### Relevant files

- netlify.toml
- package.json
- .nvmrc
- .node-version

---

## TICKET-009 - Add tests for core query/mutation modules

**Priority: P1**

### Problem

Core query and mutation modules lack test coverage for real implementations.

### Solution

**Option A (fast): Drizzle mocks with chainable helpers**

1. Update `createServerFn` mock to accept `context`:

```ts
const serverFn = async (args?: { data?: unknown; context?: unknown }) => {
  let validatedData = args?.data;
  if (this._validator && args?.data !== undefined) {
    validatedData = this._validator(args.data);
  }
  return handlerFn({ data: validatedData, context: args?.context ?? {} });
};
```

2. Create `src/tests/mocks/drizzle.ts`:

```ts
export function mockDrizzleQuery<T>(result: T) {
  const q: any = {};
  const chain = [
    "from",
    "where",
    "leftJoin",
    "innerJoin",
    "groupBy",
    "orderBy",
    "limit",
    "values",
    "set",
    "returning",
  ];
  for (const method of chain) {
    q[method] = vi.fn().mockReturnValue(q);
  }
  q.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return q;
}
```

**Option B (thorough): Real Postgres test DB**

Use separate vitest config with real migrations in `beforeAll`.

**Minimum test set (high ROI):**

- `registerForEvent`: event not found, closed, team requires membership, amountDue=0, Square checkout
- `cancelEvent`: forbidden, refundMode handling
- `getEventRegistrations`: require auth + organizer/admin
- `createTeam`: creates team + captain, constraint errors
- `confirmMembershipPurchase`: session missing, verify fail, verify success

### Relevant files

- src/tests/setup.ts
- src/tests/mocks/drizzle.ts (new)
- src/features/events/events.queries.ts
- src/features/events/events.mutations.ts
- src/features/teams/teams.mutations.ts
- src/features/membership/membership.mutations.ts

---

## TICKET-010 - Replace deprecated lucide brand icons ✅ COMPLETE

**Priority: P3**
**Status: DONE** - Created custom SVG icons for Twitter, Facebook, Instagram

### Problem

Lucide brand icons (Twitter/Facebook/Instagram) are deprecated and will be removed.

### Solution

Create local SVG icon components:

1. **Create `src/components/ui/social-icons.tsx`**:

```tsx
import type { SVGProps } from "react";

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-8h2.6l.4-3h-3V8.1c0-.9.2-1.5 1.5-1.5h1.6V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3V10H7.5v3H10v8h3.5z" />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 4l16 16" />
      <path d="M20 4L4 20" />
    </svg>
  );
}
```

2. **Update `public-footer.tsx`**:

```tsx
import { FacebookIcon, InstagramIcon, XIcon } from "~/components/ui/social-icons";
```

### Relevant files

- src/components/ui/social-icons.tsx (new)
- src/components/ui/public-footer.tsx

---

## TICKET-011 - Fix membership daysRemaining conditional logic ✅ COMPLETE

**Priority: P3**
**Status: DONE** - Changed to typeof check and added "Expires today" message

### Problem

`daysRemaining === 0` is falsy, so these checks fail:

```ts
membershipStatus.daysRemaining && membershipStatus.daysRemaining < 30;
```

### Solution

Use numeric type check:

```tsx
// Extract with type check
const daysRemaining = typeof membershipStatus?.daysRemaining === "number"
  ? membershipStatus.daysRemaining
  : null;

// Action cards
if (membershipStatus?.hasMembership && daysRemaining !== null && daysRemaining < 30) {
  actions.push({
    title: "Renew membership",
    description: daysRemaining <= 0 ? "Expires today" : `Expires in ${daysRemaining} days`,
    ...
  });
}

// Warning display
{typeof status.daysRemaining === "number" && status.daysRemaining < 60 && (
  <p className="text-sm text-yellow-700">
    {status.daysRemaining <= 0 ? "Expires today" : `${status.daysRemaining} days remaining`}
  </p>
)}

// CTA label
{typeof status.daysRemaining === "number" && status.daysRemaining < 30
  ? "Renew Now"
  : "View Details"}
```

Also apply same fix to `src/routes/dashboard/index.tsx`.

### Relevant files

- src/features/dashboard/MemberDashboard.tsx
- src/routes/dashboard/index.tsx

---

## TICKET-012 - Pin react-compiler plugin version ✅ COMPLETE

**Priority: P3**
**Status: DONE** - Pinned to 19.1.0-rc.3

### Problem

```json
"babel-plugin-react-compiler": "latest"
```

This can introduce unplanned breakage.

### Solution

```bash
pnpm list babel-plugin-react-compiler
```

Then pin to that version:

```json
"babel-plugin-react-compiler": "0.x.y"
```

### Relevant files

- package.json

---

## TICKET-013 - Remove unused npm lockfile ✅ COMPLETE

**Priority: P3**
**Status: DONE** - Updated .gitignore to prevent npm lockfiles (package-lock.json already absent)

### Problem

Both `pnpm-lock.yaml` and `package-lock.json` exist.

### Solution

1. Delete `package-lock.json`
2. Update `.gitignore`:

```diff
-# package-lock.json
+package-lock.json
```

### Relevant files

- package-lock.json (delete)
- .gitignore

---

# New Tickets (Discovered in Review)

---

## TICKET-014 - Lock down /api/test/cleanup endpoint ✅ COMPLETE

**Priority: P0**
**Status: DONE** - Applied debug-guard.ts, removed bypassable env var checks

### Problem

`/api/test/cleanup` has dangerous gating logic:

```ts
const isProduction =
  process.env["NODE_ENV"] === "production" &&
  !process.env["E2E_TEST_EMAIL"] &&
  !process.env["SKIP_ENV_VALIDATION"];
```

If `SKIP_ENV_VALIDATION` is set in production, the cleanup endpoint becomes available.

### Solution

Apply the same `requireDebugAccess()` guard from TICKET-001, or only compile in test builds.

### Relevant files

- src/routes/api/test/cleanup.ts
- src/lib/server/debug-guard.ts

---

## TICKET-015 - Add auth to getEventRegistrations query ✅ COMPLETE

**Priority: P0**
**Status: DONE** - Added auth middleware, organizer/admin check before returning data

### Problem

`getEventRegistrations` returns user emails and payment metadata but has **no auth middleware** and **no organizer/admin check**. This is a data leak.

### Solution

Add auth and authorization:

```ts
export const getEventRegistrations = createServerFn({ method: "GET" })
  .middleware([getAuthMiddleware()])
  .inputValidator(z.object({ eventId: z.uuid() }).parse)
  .handler(async ({ data, context }): Promise<EventRegistrationSummary[]> => {
    const user = requireUser(context);

    // Fetch event and verify access
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1);
    if (!event[0]) throw notFound();

    const isOrganizer = event[0].organizerId === user.id;
    const userIsAdmin = await isAdmin(user.id);

    if (!isOrganizer && !userIsAdmin) {
      throw forbidden("Only organizers and admins can view registrations");
    }

    // ... rest of query
  });
```

### Relevant files

- src/features/events/events.queries.ts

---

## TICKET-016 - Add unique constraint on memberships.paymentId ✅ COMPLETE

**Priority: P0**
**Status: DONE** - Added partial unique index on (payment_provider, payment_id) WHERE payment_id IS NOT NULL

### Problem

`memberships.paymentId` is used as an idempotency key but has no unique constraint. Concurrent requests can create duplicate memberships.

### Solution

Add unique index in schema:

```ts
uniqueIndex("memberships_payment_provider_id_uidx").on(
  table.paymentProvider,
  table.paymentId
),
```

Postgres allows multiple NULLs, so "manual/offline" memberships (null paymentId) won't conflict.

Also consider making `membershipPaymentSessions.squarePaymentId` unique.

### Relevant files

- src/db/schema/membership.schema.ts

---

## TICKET-017 - Fix JSONB roster stored as string ✅ COMPLETE

**Priority: P1**
**Status: DONE** - Removed JSON.stringify(), Drizzle handles JSONB serialization

### Problem

In `registerForEvent`:

```ts
roster: data.roster ? JSON.stringify(data.roster) : null,
```

This stores a JSON **string** in a JSONB column, but casters expect objects. Creates runtime shape bugs when accessing `roster.players`.

### Solution

Store structured JSON, not strings:

```ts
// Normalize roster before storing
const normalizedRoster = data.roster
  ? Array.isArray(data.roster)
    ? { players: data.roster }
    : data.roster
  : null;

// Store directly (Drizzle handles JSONB serialization)
roster: normalizedRoster,
```

### Relevant files

- src/features/events/events.mutations.ts
- src/features/events/utils/jsonb.ts

---

## TICKET-018 - Fix event registration type default for team-only events ✅ COMPLETE

**Priority: P1**
**Status: DONE** - Added effectiveRegistrationType computed from event settings

### Problem

In `$slug.register.tsx`:

```ts
const [registrationType, setRegistrationType] = useState<"team" | "individual">(
  "individual",
);
```

For team-only events, state stays "individual" but UI only shows team option. Causes wrong fee calculation and validation issues.

### Solution

Use effective registration type based on event:

```ts
const effectiveRegistrationType =
  event.registrationType === "both" ? registrationType : event.registrationType;
```

Use `effectiveRegistrationType` everywhere (fee, UI, validation, queries).

### Relevant files

- src/routes/events/$slug.register.tsx

---

## TICKET-019 - Consolidate webhook processing logic ✅ COMPLETE

**Priority: P1**
**Status: DONE** - Implemented Option A (thin service)

### Problem

Two separate webhook-processing layers:

1. `SquarePaymentService.processWebhook()` verifies signature and updates DB
2. `/api/webhooks/square` route calls processWebhook(), then does its own event handling

This creates duplicate DB work and harder-to-reason-about behavior.

### Solution Implemented

**Option A: Thin Service** - Service only verifies signature + returns normalized event

- Renamed `processWebhook()` to `verifyAndParseWebhook()`
- Service now returns `WebhookVerificationResult` with normalized `NormalizedWebhookEvent`
- Removed all DB update logic from service (was duplicated in route)
- Route handler retains all business logic (finalize membership, registration, emails)
- Clear separation: service = Square SDK concerns, route = business logic

### Changes

- `square-real.ts`: New `verifyAndParseWebhook()` method, removed DB updates
- `square.ts`: Updated mock service and type exports
- `webhooks/square.ts`: Simplified to use normalized events, removed duplicate parsing

### Relevant files

- src/lib/payments/square-real.ts
- src/lib/payments/square.ts
- src/routes/api/webhooks/square.ts

---

## TICKET-020 - Fix membership renewal blocked for expired memberships ✅ COMPLETE

**Priority: P1**
**Status: DONE** - Added date check: gte(endDate, CURRENT_DATE) for active membership check

### Problem

`createCheckoutSession` checks:

```ts
.where(and(eq(memberships.userId, user.id), eq(memberships.status, "active")))
```

But `getUserMembershipStatus` considers active only if `endDate >= CURRENT_DATE`.

A membership can be `status = "active"` but `endDate` in the past, causing:

- `getUserMembershipStatus` returns "no membership"
- Purchase flow blocks "already active"

### Solution

Either:

- Enforce status transitions via cron/job (mark expired memberships as expired)
- Change "already active" check to include date validity:

```ts
.where(and(
  eq(memberships.userId, user.id),
  eq(memberships.status, "active"),
  gte(memberships.endDate, sql`CURRENT_DATE`)
))
```

### Relevant files

- src/features/membership/membership.mutations.ts
- src/features/membership/membership.queries.ts

---

## TICKET-021 - Prevent empty paymentId in webhook finalization ✅ COMPLETE

**Priority: P1**
**Status: DONE** - Added early return when paymentId is missing, prevents empty string in DB

### Problem

In `finalizeMembershipFromWebhook`:

```ts
paymentId: paymentId ?? session.squarePaymentId ?? "",
```

If both are null/undefined, creates membership with empty paymentId.

### Solution

```ts
const resolvedPaymentId = paymentId ?? session.squarePaymentId;
if (!resolvedPaymentId) {
  console.warn("Skipping finalize; missing paymentId", {
    orderId,
    sessionId: session.id,
  });
  return;
}
```

### Relevant files

- src/features/membership/membership.finalize.ts

---

## TICKET-022 - Fix duplicate pending registrations allowed ✅ COMPLETE

**Priority: P1**
**Status: DONE** - Changed status check to include pending, confirmed, waitlisted

### Problem

Duplicate registration check only blocks `confirmed` status:

```ts
eq(eventRegistrations.status, "confirmed"),
```

Allows same user/team to create multiple pending registrations and Square checkout sessions.

### Solution

Block pending + confirmed + waitlisted:

```ts
inArray(eventRegistrations.status, ["pending", "confirmed", "waitlisted"]),
```

Or add explicit cleanup + "Resume checkout" UX.

### Relevant files

- src/features/events/events.mutations.ts

---

## TICKET-023 - Admin event rejection doesn't change state

**Priority: P2**

### Problem

In `events-review.tsx`, reject sets:

```ts
status: "draft",
isPublic: false
```

...which is already the pending state. Event stays in pending list after rejection.

### Solution

Options:

- Add `reviewStatus: pending | approved | rejected` field
- Add `submittedForApproval: boolean` and filter on it
- Implement `needs_changes` status

### Relevant files

- src/routes/dashboard/admin/events-review.tsx
- src/db/schema/events.schema.ts

---

## TICKET-024 - Profile completion logic inconsistent ✅ COMPLETE

**Priority: P2**
**Status: DONE** - Emergency contact now consistently treated as optional

### Problem

- `CompleteProfileForm` treats emergency contact as optional ("optional but recommended")
- `getProfileCompletionStatus` treats emergency contact as required (adds to missingFields)
- `completeUserProfile` sets `profileComplete: true` unconditionally

Can result in `profileComplete=true` but `missingFields` still populated.

### Solution

Pick one definition and align all three places:

- If optional → don't count in completion checks
- If required → enforce in UI and don't mark complete until present

### Relevant files

- src/features/profile/components/complete-profile-form-simple.tsx
- src/features/profile/profile.queries.ts
- src/features/profile/profile.mutations.ts

---

## TICKET-025 - Date-of-birth type drift (Date vs string)

**Priority: P2**

### Problem

`ValidatedDatePicker` stores `YYYY-MM-DD` strings:

```ts
field.handleChange(date.toISOString().split("T")[0]);
```

But some validators call `.getFullYear()` expecting a Date object. Mixed types cause runtime errors.

### Solution

Pick one:

- Store `Date` in form state, convert to string only when sending to server
- Store `YYYY-MM-DD` strings everywhere and update all validators

### Relevant files

- src/components/form-fields/ValidatedDatePicker.tsx
- src/features/profile/profile.schemas.ts

---

## TICKET-026 - Don't send userId from client for registration checks

**Priority: P2**

### Problem

Event detail/register pages send:

```ts
checkEventRegistration({ eventId, userId: user?.id });
```

Even if server re-checks auth, this is unnecessary and wrong-shaped security-wise.

### Solution

Server function should infer user from session. Client sends only `eventId`.

### Relevant files

- src/routes/events/$slug.index.tsx
- src/routes/events/$slug.register.tsx
- src/features/events/events.queries.ts

---

## TICKET-027 - Fix date comparisons to be date-aware ✅ COMPLETE

**Priority: P2**
**Status: DONE** - Using isSameDay from date-fns for proper comparison

### Problem

```ts
event.endDate !== event.startDate;
```

If these are ISO strings with time components, shows range even for same calendar day.

### Solution

```ts
import { isSameDay } from "date-fns";
const showRange = !isSameDay(new Date(event.startDate), new Date(event.endDate));
```

### Relevant files

- src/routes/events/$slug.index.tsx

---

## TICKET-028 - JSONB metadata lost-update risk

**Priority: P2**

### Problem

Multiple places do:

```ts
metadata: { ...(session.metadata ?? {}), newField: ... }
```

Not using freshest metadata at update time. Concurrent updates clobber each other.

### Solution

Use Postgres JSONB merge:

```ts
metadata: sql`coalesce(metadata, '{}') || ${JSON.stringify(newFields)}::jsonb`;
```

### Relevant files

- src/features/membership/membership.mutations.ts
- src/features/events/events.mutations.ts

---

## TICKET-029 - Deduplicate JSONB casting helpers

**Priority: P2**

### Problem

Multiple versions of `castRegistrationJsonbFields`:

- `src/features/events/utils/jsonb.ts`
- `src/features/events/events.queries.ts`

Will drift over time.

### Solution

Use one canonical function in `utils/jsonb.ts` and import everywhere.

### Relevant files

- src/features/events/utils/jsonb.ts
- src/features/events/events.queries.ts

---

## TICKET-030 - QueryClient created in multiple places ✅ NOT AN ISSUE

**Priority: P2**
**Status: CLOSED** - Already correctly designed

### Problem

QueryClient created in both:

- `src/router.tsx` (for SSR integration)
- `src/app/providers.tsx` (potentially different instance)

### Analysis

Upon review, this is already correctly implemented. `Providers` accepts `queryClient` as an optional prop and only creates a new instance if none is provided. The router creates it once and passes it through context. No fix needed.

### Relevant files

- src/router.tsx
- src/app/providers.tsx

---

## TICKET-031 - Clipboard copy should handle failure ✅ COMPLETE

**Priority: P3**
**Status: DONE** - Added try/catch with toast success/error notifications

### Problem

"Copy Link" silently writes to clipboard without try/catch or user feedback.

### Solution

Add try/catch and toast success/error.

### Relevant files

- src/routes/events/$slug.index.tsx

---

## TICKET-032 - ARIA aria-describedby references non-existent IDs ✅ COMPLETE

**Priority: P3**
**Status: DONE** - Only include IDs for elements that actually render

### Problem

In `ValidatedCheckbox`:

```tsx
aria-describedby={`${inputId}-description ${inputId}-errors`}
```

References `...-errors` even when no errors exist (element won't render).

### Solution

Only include IDs for elements that actually render:

```tsx
aria-describedby={[
  description ? `${inputId}-description` : null,
  meta.errors.length ? `${inputId}-errors` : null,
].filter(Boolean).join(" ") || undefined}
```

### Relevant files

- src/components/form-fields/ValidatedCheckbox.tsx
- (check other form fields)

---

## TICKET-033 - Remove auth client baseURL logging ✅ COMPLETE

**Priority: P3**
**Status: DONE** - Guarded behind import.meta.env.DEV

### Problem

```ts
console.log("Auth client created with baseURL:", baseURL);
```

Ships noisy logs to production.

### Solution

Guard behind `import.meta.env.DEV` or remove.

### Relevant files

- src/lib/auth-client.ts

---

# Summary

## Sprint 1 Status (Security Hardening P0) ✅

- ✅ 001 - Debug endpoints locked
- ✅ 002 - PWA caching fixed
- ⏸️ 003 - Rate limiting deferred (needs Upstash)
- ✅ 004 - Auth secret hardened
- ✅ 014 - Test cleanup locked
- ✅ 015 - Query authorization added
- ✅ 016 - Database constraint added

## Sprint 2 Status (Build/Config P1) ✅

- ✅ 005 - Process shim fixed
- ✅ 006 - Devtools gated
- ✅ 007 - TanStack versions aligned
- ✅ 008 - Node version pinned
- ✅ 012 - React compiler pinned
- ✅ 013 - Lockfile cleanup

## Sprint 3 Status (Data Integrity P1) ✅

- ✅ 017 - JSONB roster fixed
- ✅ 018 - Registration type default fixed
- ✅ 019 - Webhook consolidation (Option A: thin service)
- ✅ 020 - Membership renewal fixed
- ✅ 021 - Payment ID validation added
- ✅ 022 - Duplicate registration prevention added

## Sprint 5 Status (Code Quality P2) - PARTIAL

- ⏸️ 023 - Event rejection state (needs schema change)
- ✅ 024 - Profile completion logic fixed
- ⏸️ 025 - Date-of-birth type (needs broader refactor)
- ⏸️ 026 - Remove userId from client (needs API change)
- ✅ 027 - Date comparisons fixed
- ⏸️ 028 - JSONB metadata (needs atomic updates)
- ⏸️ 029 - JSONB casting (lower priority)
- ⏸️ 030 - QueryClient (already correct design)

## Sprint 6 Status (Polish P3) ✅

- ✅ 010 - Deprecated icons replaced
- ✅ 011 - daysRemaining logic fixed
- ✅ 031 - Clipboard error handling added
- ✅ 032 - ARIA accessibility fixed
- ✅ 033 - Auth logging gated

## By Priority

| Priority | Count | Tickets                                                                                       |
| -------- | ----- | --------------------------------------------------------------------------------------------- |
| P0       | 6     | ~~001~~, ~~002~~, 003, ~~004~~, ~~014~~, ~~015~~, ~~016~~                                     |
| P1       | 11    | ~~005~~, ~~006~~, ~~007~~, ~~008~~, 009, ~~017~~, ~~018~~, ~~019~~, ~~020~~, ~~021~~, ~~022~~ |
| P2       | 8     | 023, ~~024~~, 025, 026, ~~027~~, 028, 029, 030                                                |
| P3       | 8     | ~~010~~, ~~011~~, ~~012~~, ~~013~~, ~~031~~, ~~032~~, ~~033~~                                 |

## By Category

**Security:** 001, 003, 004, 014, 015, 016
**Data Integrity:** 017, 021, 022, 028
**PWA/Caching:** 002
**Build/Config:** 005, 006, 007, 008, 012, 013
**Testing:** 009
**UI/UX:** 010, 011, 018, 023, 027, 031
**Types/Consistency:** 024, 025, 029
**Architecture:** 019, 026, 030
**Accessibility:** 032
**Logging:** 033
**Membership Logic:** 020
