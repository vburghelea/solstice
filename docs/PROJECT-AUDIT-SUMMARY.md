# Solstice Project Audit Summary

**Generated**: December 1, 2025
**Purpose**: High-level overview for resuming development after a break

---

## Project Overview

**Solstice** is a sports league management platform built for **Quadball Canada** with TanStack Start (full-stack React). It handles member registration, team management, event creation/registration, payments, and administrative operations.

### Tech Stack

| Category   | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Framework  | TanStack Start v1.132.2 (React meta-framework with SSR) |
| Routing    | TanStack Router (file-based, type-safe)                 |
| Auth       | Better Auth v1.3.16 (email/password + OAuth)            |
| Database   | PostgreSQL + Drizzle ORM v0.44.5                        |
| Validation | Zod v4.1.11                                             |
| UI         | Tailwind CSS v4 + shadcn/ui                             |
| State      | TanStack React Query v5.90.2                            |
| Payments   | Square API v43.0.2                                      |
| Testing    | Vitest + Playwright                                     |
| Deployment | Netlify with edge functions                             |

---

## Completed Features (Production Ready)

### 1. Authentication System

- Email/password registration and login
- OAuth via GitHub and Google
- Email verification
- Session management with IP/user-agent tracking
- Profile completion tracking and guard middleware

### 2. Team Management

- Team creation with name, description, location, colors, website
- Team member roles: captain, coach, player, substitute
- Member status transitions: pending → active → inactive → removed
- Team invitations with reminder tracking
- Jersey numbers and positions
- Active membership constraint (one team per user)

### 3. Event Management

- Full event lifecycle: draft → published → registration_open → completed/cancelled
- Event types: tournament, league, camp, clinic, social
- Registration types: team, individual, or both
- Pricing: base fees + early-bird discounts
- Location, dates, organizer details
- JSONB fields for rules, schedule, divisions, amenities
- Event cancellation with cascade to registrations

### 4. Payment System (Square Integration)

- Checkout session creation and payment links
- Payment verification and callback handling
- Refund support for event cancellations
- E-transfer alternative with manual tracking
- Idempotent session creation
- Membership purchase flows

### 5. Membership System

- Membership types with pricing and duration
- Active/expired/cancelled status tracking
- Square payment integration
- Membership validation for event registration

### 6. Role-Based Access Control

- Global admin role
- Event coordinator (event-scoped)
- Team-scoped role assignments
- Role expiration support
- JSONB-based permission management

### 7. Members Directory

- Search by name/email
- Privacy-aware listing
- Team membership aggregation
- Pagination support

### 8. Testing Infrastructure

- 19 E2E test files (Playwright)
- Unit tests with Vitest
- Coverage reporting
- Test data seeding scripts
- Pre-commit hooks

---

## Database Schema (17 Tables)

### Authentication (4 tables)

- `user` - Core account info
- `session` - Session management
- `account` - OAuth providers
- `verification` - Email tokens

### Events (4 tables)

- `events` - Event master records
- `eventRegistrations` - Team/individual registrations
- `eventPaymentSessions` - Square payment tracking
- `eventAnnouncements` - Event communications

### Teams (2 tables)

- `teams` - Team records
- `teamMembers` - Membership with roles

### Membership (3 tables)

- `membershipTypes` - Products
- `memberships` - User subscriptions
- `membershipPaymentSessions` - Payment sessions

### Roles (4 tables)

- `roles` - Role definitions
- `userRoles` - User assignments
- `tags` - User categorization
- `userTags` - Tag assignments

---

## Backlog Status

### P0 - Critical (All Complete)

- **EVT-1**: Event Cancellation & Refund Flow

### P1 - High (All Complete)

- **EVT-2**: Event Registration Pricing Tests
- **EVT-3**: Event Mutation Time & Metadata Utilities

### P2 - Medium (All Complete)

- **APP-1**: Router Event Type Coverage & Diagnostics
- **DOC-1**: Backlog & Release Notes Alignment

### Future Features (Not Started)

| Feature                      | Description                               |
| ---------------------------- | ----------------------------------------- |
| Duplicate Event Templates    | Copy existing events with pre-filled data |
| Event Roster Export          | CSV/Excel export of registrations         |
| Membership Renewal Reminders | Automated email campaigns                 |
| Volunteer Registration       | Event-specific volunteer roles            |
| Post-Event Surveys           | Automated survey distribution             |
| Analytics Dashboard          | Registration trends, demographics         |
| Tournament Brackets          | Automatic schedule generation             |
| Team Transfer Requests       | Workflow with approvals                   |
| Live Score Updates           | During events                             |
| Multi-Organization Support   | Beyond Quadball Canada                    |

---

## Key File Locations

### Core Business Logic

```
src/features/
├── events/
│   ├── events.mutations.ts    # Create, register, cancel (7.2k tokens)
│   ├── events.queries.ts      # List, fetch, check registration
│   ├── events.schemas.ts      # Zod validation
│   └── utils/                 # pricing, time, metadata helpers
├── teams/
│   ├── teams.mutations.ts     # Create, update, members (5k tokens)
│   └── teams.queries.ts
├── membership/
│   ├── membership.mutations.ts
│   ├── membership.finalize.ts # Payment → membership flow
│   └── hooks/usePaymentReturn.ts
├── profile/
├── roles/
└── auth/
```

### Database Schema

```
src/db/schema/
├── auth.schema.ts       # Better Auth tables
├── events.schema.ts     # Events + registrations (3.1k tokens)
├── teams.schema.ts      # Teams + members
├── membership.schema.ts
└── roles.schema.ts
```

### Payment Integration

```
src/lib/payments/
├── square.ts            # Service interface
└── square-real.ts       # Real implementation (4.5k tokens)

src/routes/api/payments/square/
└── callback.ts          # Payment callback (source of truth)
```

---

## Code Quality Patterns

### Server Functions

All use Zod validation:

```typescript
export const myServerFn = createServerFn({ method: "POST" })
  .validator(mySchema.parse)
  .handler(async ({ data }) => { ... });
```

### Server-Only Imports

Use dynamic imports or `serverOnly()` to avoid client bundle pollution:

```typescript
export const fn = createServerFn().handler(async () => {
  const { service } = await import("~/lib/payments/square");
  return service.createCheckout(...);
});
```

### Database Transactions

Complex operations wrapped for atomicity:

```typescript
await db.transaction(async (tx) => {
  // Multiple operations
});
```

---

## Environment Setup

### Required Variables

- `DATABASE_URL` - PostgreSQL (pooled)
- `BETTER_AUTH_SECRET` - Session secret
- `GITHUB_CLIENT_ID/SECRET` - OAuth
- `GOOGLE_CLIENT_ID/SECRET` - OAuth

### Development

```bash
pnpm dev           # Vite on port 5173
netlify dev        # Full Netlify env on port 8888
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
```

---

## Deployment

- **Production**: Netlify (main branch auto-deploy)
- **Preview**: Automatic PR deployments
- **Database**: Neon PostgreSQL with connection pooling
- **CI/CD**: GitHub Actions (lint, types, tests)

---

## Major Update: Homepage Redesign Opportunity

The public-facing marketing site is now live at **quadball-canada** (Astro + Sanity CMS, deployed to Cloudflare Pages). This means:

- **Solstice homepage can be redesigned** to be purely member-focused
- Remove all advertising/marketing content from Solstice
- Focus the landing page on login/signup for existing members
- Public visitors should be directed to the quadball-canada site

The quadball-canada site handles:

- News articles
- Events (public-facing)
- Teams directory
- General marketing content

**See `docs/HOMEPAGE-REDESIGN-PLAN.md` for the full implementation plan.**

---

## Recommended Next Steps

1. **Review the repomix audit bundle** (`repomix-audit-55k.xml`) for detailed code review
2. **Redesign Solstice homepage** - member-only focus (see note above)
3. **Run the test suite** to verify current state:
   ```bash
   pnpm test
   pnpm test:e2e --project=chromium-authenticated --project=chromium-unauthenticated
   ```
4. **Check production deployment**: Visit the Netlify dashboard
5. **Review future features** in `docs/development-backlog.md` for prioritization
6. **Run the dev server** and explore: `pnpm dev`

---

## Token Budget Reference

The repomix audit file includes:

- Database schemas (7k tokens)
- Events feature (14k tokens)
- Teams feature (8.9k tokens)
- Membership feature (6.6k tokens)
- Profile feature (4.7k tokens)
- Auth feature (1.9k tokens)
- Roles feature (5.9k tokens)
- Payment lib + API (4.5k tokens)

**Total: ~53k tokens** - fits within a 55k context window for comprehensive review.
