# Admin Systems UI Plan

## Overview

The admin "Systems" area provides content managers with visibility into crawler outcomes, media readiness, and CMS approval status for each tabletop system. Phase 9 focuses on surfacing actionable signals in a dashboard list and preparing the information architecture for deep editing workflows.

## Route Structure

- `/admin/systems` (layout wrapper for admin systems tooling)
- `/admin/systems/` (dashboard list implemented in this phase)
- `/admin/systems/$systemId` (editor shell with tabs: Overview, Content, Media, Taxonomy, Crawl – planned for later sub-phases)

Each route lives under `src/routes/admin/systems/` to keep the dashboard tree thin. Feature-specific UI and data hooks live in `src/features/game-systems/admin/`.

## Feature Modules

```
src/features/game-systems/admin/
├── components/
│   ├── systems-dashboard-table.tsx
│   ├── system-status-pill.tsx
│   └── system-editor.tsx
├── game-systems-admin.schemas.ts
├── game-systems-admin.types.ts
└── game-systems-admin.queries.ts
```

- `game-systems-admin.schemas.ts` declares Zod contracts for admin queries/mutations.
- `game-systems-admin.types.ts` captures derived status flags and list response types.
- `game-systems-admin.queries.ts` hosts server functions with TanStack Start `createServerFn` + dynamic DB imports.
- `components/` contains reusable widgets (status pills, data table columns) used by dashboard and, later, the editor tabs.

## Data Flow

1. Client route builds search parameters (query string) for keyword, status filter, and sort option.
2. `listAdminGameSystems` server function accepts `{ q?, status?, sort? }` and loads systems plus aggregated metadata:
   - publication / approval flags (`isPublished`, `cmsApproved`)
   - crawl fields (`crawlStatus`, `lastCrawledAt`, `errorMessage`)
   - content completeness inputs (hero moderation, gallery counts, category counts, summary source)
3. Handler maps each row to `AdminGameSystemListItem`, deriving:
   - `statusFlags`: `missing-summary`, `missing-hero`, `hero-unmoderated`, `taxonomy-empty`, `cms-unapproved`, `unpublished`, `unmoderated-media`, `crawl-partial`
   - `needsCuration`: true when any curation flag present or crawl error/partial detected
   - `hasErrors`: true when `crawlStatus === "error"` or `errorMessage` populated
4. Response returns filtered `items`, overall `total`, and aggregate counts `{ total, needsCuration, errors, published }` for summary chips.
5. Client renders data table with inline badges, filter controls, and quick actions (Edit stub).
6. Editor route `/player/systems/$systemId` calls `getAdminGameSystem` to hydrate tabbed layout with hero, gallery, taxonomy, and crawl history placeholders.

## Status Definitions

| Flag                | Trigger                                      | Impact                               |
| ------------------- | -------------------------------------------- | ------------------------------------ |
| `missing-summary`   | No CMS or scraped description                | Content manager must author synopsis |
| `missing-hero`      | `heroImageId` null                           | Hero slot empty                      |
| `hero-unmoderated`  | Hero selected but asset not marked moderated | Requires review before publish       |
| `taxonomy-empty`    | Category count is 0                          | System lacks browse taxonomy         |
| `cms-unapproved`    | `cmsApproved = false`                        | Needs editorial approval             |
| `unpublished`       | `isPublished = false`                        | Will not appear publicly             |
| `unmoderated-media` | Gallery has unmoderated assets               | Requires moderation                  |
| `crawl-partial`     | `crawlStatus = "partial"`                    | Crawl completed with gaps            |

`needsCuration` aggregates the above plus crawl errors; `hasErrors` focuses on hard crawl failures.

## Filters & Sorting

- Status filter options: `all`, `needs_curation`, `errors`, `published`, `unpublished`.
- Sort options: `updated-desc` (default), `name-asc`, `crawl-status`.
- Search box filters by system name using `ILIKE`.
- The server currently loads all matching systems (bounded by admin dataset size). Pagination can be added when counts grow; schema already exposes `perPage` placeholder for future use.

## UI Composition

- Filter bar with keyword input, status select, sort select, and clear button.
- Summary chips showing counts (total systems, needs curation, errors, published).
- Data table columns: Name & slug (with publish/approval badges), Completeness (status pills), Crawl status (status badge + timestamps + error tooltip), Media (hero + moderation summary), Updated (timestamp + relative label), Actions (Edit stub).
- Empty & loading states align with admin dashboard patterns (bordered cards with muted copy).

## Implementation Phases

1. **Phase 9.A (complete)** – Dashboard list delivered in this session.
2. **Phase 9.B (ongoing)** – Editor scaffold (`/admin/systems/$systemId`) now supports tab navigation plus media moderation toggles and hero assignment.
3. **Phase 9.C (up next)** – Ship recrawl controls and richer audit timeline integrations (ties into Phase 11).

## Editor Shell Overview

- **Route**: `/admin/systems/$systemId`
- **Server data**: `getAdminGameSystem` returns base status flags plus hero, gallery, taxonomy, external refs, and recent crawl events (limit 10).
- **Tabs**:
  - _Overview_: Publication flags, publish/draft + CMS approval actions, crawl summary, external reference grid.
  - _Content_: CMS vs crawler copy with source-of-truth callout.
  - _Media_: Hero preview, gallery listing, moderation toggles, and hero assignment controls.
  - _Taxonomy_: Category/mechanic cards with inline external tag mapping forms and filtering.
  - _Crawl_: Table of recent crawl events with human-friendly timestamps.
- **Navigation**: Search param `?tab=` keeps deep links shareable; default tab is Overview.

### External Tag Mapping UX

- The Taxonomy tab lists categories and mechanics associated with the system, each rendered as a card showing existing external mappings and an inline form.
- Editors can filter categories/mechanics by name, pick a source (StartPlaying, BGG, Wikipedia), provide an external tag string, and adjust confidence (0-100%).
- Submitting the form persists the mapping via `mapExternalTag` (conflicts update existing rows) and refreshes the detail panel automatically.
- Mapping controls are disabled while a mutation is pending to avoid duplicate submissions; toasts surface success and error states.

### Publication workflow

- The Overview tab now includes `Publish system`/`Revert to draft` and `Approve CMS copy`/`Revoke approval` buttons that reflect the current status badges.
- Actions call `updatePublishStatus` and `updateCmsApproval`, which update `isPublished`, `cmsApproved`, and audit timestamps before refreshing the editor state.
- Buttons remain disabled while a status mutation is pending so editors get clear feedback and avoid double submissions; success and error toasts mirror other tabs.

## Testing & Follow-up

- Add Vitest coverage for admin status flag derivation once mutations land (Phase 12 alignment).
- Record server contract in `GAME_SYSTEM_REBUILD_PLAN.md` data contracts section (done in this session).
- Consider seed data fixture for Playwright once editor flow is interactive.
