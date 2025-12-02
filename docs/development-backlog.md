# Development Backlog

**Last Updated**: December 1, 2025

This backlog lists the active roadmap items for Solstice. Tickets are grouped by priority (P0 is highest). Each ticket contains the problem statement, desired outcome, implementation guidance, and links to relevant files.

> **Maintainer Checklist:** When closing a ticket, move it to [backlog-archive.md](./backlog-archive.md), refresh any impacted security docs or release notes, and confirm `pnpm lint`, `pnpm check-types`, and relevant tests pass.

---

## 🔺 P1 – High Priority

### API-1: Data Integration for Marketing Site (quadball-canada)

| Field                | Details                                        |
| -------------------- | ---------------------------------------------- |
| **Status**           | 📋 Not Started                                 |
| **Priority**         | 🟠 High (enables public-facing site)           |
| **Companion Ticket** | `quadball-canada/docs/SOLSTICE-INTEGRATION.md` |

#### Problem Statement

The public marketing site (quadball-canada, Astro + Sanity) needs to display live data from Solstice—upcoming events, team listings, and member counts. Currently, content editors manually duplicate event information between Sanity CMS and the member portal, leading to stale or inconsistent public-facing content.

**Data needed by quadball-canada:**

- Upcoming events (name, date, location, registration status, spots remaining)
- Active teams (name, city, province, member count, level of play)
- Aggregate stats (total members, total teams, upcoming events count)

#### Architecture Decision

After evaluating multiple approaches, **Direct Database Access** is recommended for this integration:

| Approach               | Complexity | Maintenance | Real-time | Verdict            |
| ---------------------- | ---------- | ----------- | --------- | ------------------ |
| **Direct DB Access**   | Low        | Medium      | Yes       | ✅ Recommended     |
| REST API               | Medium     | Medium      | Yes       | Viable alternative |
| Build-time Script      | Low        | Low         | No        | Too manual         |
| Webhook Sync to Sanity | High       | High        | Eventual  | Over-engineered    |

**Why Direct Database Access:**

1. **Simplicity** – No new API layer to build/maintain; Astro queries the same Neon DB
2. **Same team** – Both projects are managed together; tight coupling is acceptable
3. **Static builds** – quadball-canada uses `output: "static"`, so queries run at build time only
4. **Type safety** – Can share or derive TypeScript types from Drizzle schema
5. **No latency** – Direct DB queries are faster than HTTP round-trips
6. **Neon supports this** – Serverless Postgres handles multiple clients with connection pooling

**Trade-offs to accept:**

- Schema changes in Solstice could break Astro builds (mitigated by typed queries)
- Database URL must be added to quadball-canada's environment
- No API versioning (but not needed for internal use)

#### Implementation Plan

##### Phase 1: Create Read-Only Query Module

Create a new module with public-safe queries that can be shared or duplicated:

```
src/lib/public-data/
├── index.ts              # Main exports
├── events.queries.ts     # Public event queries
├── teams.queries.ts      # Public team queries
├── stats.queries.ts      # Aggregate statistics
└── types.ts              # Response types (Zod schemas)
```

**Key queries to expose:**

```typescript
// events.queries.ts
export async function getPublicUpcomingEvents(limit?: number): Promise<PublicEvent[]>;
export async function getPublicEventBySlug(slug: string): Promise<PublicEvent | null>;

// teams.queries.ts
export async function getPublicActiveTeams(): Promise<PublicTeam[]>;
export async function getPublicTeamBySlug(slug: string): Promise<PublicTeam | null>;

// stats.queries.ts
export async function getPublicStats(): Promise<PublicStats>;
```

**Response types (minimal, public-safe):**

```typescript
// types.ts
export interface PublicEvent {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  type: "tournament" | "league" | "camp" | "clinic" | "social" | "other";
  startDate: string;
  endDate: string;
  city: string | null;
  province: string | null;
  venueName: string | null;
  isRegistrationOpen: boolean;
  spotsRemaining: number | null; // null = unlimited
  registrationType: "team" | "individual" | "both";
  teamFee: number | null; // cents
  individualFee: number | null; // cents
}

export interface PublicTeam {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  province: string | null;
  memberCount: number;
  levelOfPlay: "recreational" | "competitive" | "youth" | null;
  logoUrl: string | null;
  isActive: boolean;
}

export interface PublicStats {
  totalMembers: number;
  totalActiveTeams: number;
  upcomingEventsCount: number;
  // Optional: breakdown by province, etc.
}
```

##### Phase 2: Document Database Access Pattern

Create `docs/public-data-access.md` documenting:

- Available queries and their return types
- Environment variable required (`DATABASE_URL` or dedicated read-only URL)
- Example usage in Astro
- Schema dependencies (which tables/columns are used)

##### Phase 3: Optional REST Wrapper (Future)

If direct DB becomes problematic, wrap queries in REST endpoints:

```
GET /api/public/events
GET /api/public/events/:slug
GET /api/public/teams
GET /api/public/teams/:slug
GET /api/public/stats
```

This can be added later without changing the query logic.

#### Acceptance Criteria

- [ ] `src/lib/public-data/` module created with typed queries
- [ ] Queries filter for public/published content only (no draft events, inactive teams)
- [ ] Response types defined with Zod schemas
- [ ] Documentation created for quadball-canada integration
- [ ] Unit tests verify queries return expected shapes
- [ ] No sensitive data exposed (emails, payment info, internal notes)

#### Security Considerations

- Queries must filter by `isPublic = true` for events and `isActive = true` for teams
- Never expose: user emails, payment details, internal notes, draft content
- Consider creating a read-only database role for extra safety (optional)

#### Linked Files

| File                                                                                | Purpose                             |
| ----------------------------------------------------------------------------------- | ----------------------------------- |
| [`src/features/events/events.queries.ts`](../src/features/events/events.queries.ts) | Existing event query logic to adapt |
| [`src/features/teams/teams.queries.ts`](../src/features/teams/teams.queries.ts)     | Existing team query logic to adapt  |
| [`src/db/schema/events.schema.ts`](../src/db/schema/events.schema.ts)               | Event schema reference              |
| [`src/db/schema/teams.schema.ts`](../src/db/schema/teams.schema.ts)                 | Team schema reference               |
| [`src/db/schema/membership.schema.ts`](../src/db/schema/membership.schema.ts)       | Member count source                 |

---

## 🔷 P2 – Medium Priority

_No active P2 tickets._

---

## 🟢 P3 – Low Priority / Future

### API-1b: REST API Wrapper (Optional)

If direct database access from quadball-canada proves problematic (e.g., schema drift, debugging difficulty), wrap the public-data queries in REST endpoints.

| Field          | Details                         |
| -------------- | ------------------------------- |
| **Status**     | 📋 Backlog                      |
| **Depends On** | API-1                           |
| **Trigger**    | Only if direct DB causes issues |

**Endpoints:**

- `GET /api/public/events` – List upcoming events
- `GET /api/public/events/:slug` – Single event
- `GET /api/public/teams` – List active teams
- `GET /api/public/teams/:slug` – Single team
- `GET /api/public/stats` – Aggregate statistics

**Features to add:**

- Cache-Control headers (`public, max-age=300, stale-while-revalidate=60`)
- Rate limiting via Pacer middleware
- CORS for `quadballcanada.ca` and `localhost:4321`
- Optional `X-API-Key` for higher rate limits

---

### API-1c: Build Webhook for Fresh Data

Trigger quadball-canada rebuilds when Solstice data changes.

| Field          | Details                               |
| -------------- | ------------------------------------- |
| **Status**     | 📋 Backlog                            |
| **Depends On** | API-1                                 |
| **Trigger**    | When data freshness becomes a concern |

**Implementation:**

- Add webhook URL to Solstice environment (Netlify/Cloudflare build hook)
- Call webhook after event CRUD operations
- Debounce to avoid excessive rebuilds

---

> **Process Reminder:** Before closing a ticket, run `pnpm lint`, `pnpm check-types`, and any ticket-specific tests. Move completed tickets to the archive and update associated documentation as part of the same PR.

---

## Archive

Completed tickets are preserved in [backlog-archive.md](./backlog-archive.md).
