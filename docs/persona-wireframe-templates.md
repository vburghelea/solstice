# Persona Wireframe Templates

These responsive templates inform the shared scaffolding for phase 0. Each template maps directly to the persona namespace layout and token system currently in code.

## Shared Layout Rules

- 16px base grid with responsive multipliers (`8px` half-step, `24px` dense step)
- Mobile-first stacking with max width 480px for primary column
- Tablet breakpoint at 768px introduces secondary column or rail
- Desktop breakpoint at 1200px enables tertiary rail where applicable
- Header region reserves 64px for persona switcher + breadcrumbs

## Visitor (`/visit`)

| Breakpoint | Structure                                                                                      | Notes                                           |
| ---------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Mobile     | Hero (full width) → Story cards (stacked) → RSVP card (full width) → Feedback card             | Primary CTAs inline, feedback uses modal on tap |
| Tablet     | Hero (2 columns) with CTA + imagery → Story cards (2-column masonry) → RSVP card (sticky rail) | Switcher remains top-left                       |
| Desktop    | Hero spans columns 1-2, newsletter card column 3 → Stories grid (3 columns)                    | Feedback card anchors bottom-right              |

## Player (`/player`)

| Breakpoint | Structure                                                                        | Notes                                   |
| ---------- | -------------------------------------------------------------------------------- | --------------------------------------- |
| Mobile     | Agenda summary → Quick actions carousel → Activity feed                          | Quick actions use horizontal scroll     |
| Tablet     | Agenda (column 1) → Activity feed (column 2) → Quick actions docked below header | Notifications bubble top-right          |
| Desktop    | Agenda + stats (columns 1-2) → Community activity (column 3)                     | Privacy notice banner spans columns 1-3 |

## Event Operations (`/ops`)

| Breakpoint | Structure                                                                  | Notes                       |
| ---------- | -------------------------------------------------------------------------- | --------------------------- |
| Mobile     | KPI cards (horizontal scroll) → Task list → Staffing queue                 | Alert strip pinned top      |
| Tablet     | KPI cards (grid 2x2) → Task list (column 1) → Staffing queue (column 2)    | Export bar sits above grid  |
| Desktop    | KPI wall (columns 1-2) → Task board (column 3) → Staffing queue (column 4) | Alert center overlays board |

## Game Master (`/gm`)

| Breakpoint | Structure                                                                                      | Notes                                |
| ---------- | ---------------------------------------------------------------------------------------------- | ------------------------------------ |
| Mobile     | Campaign switcher → Session prep checklist → Feedback summary                                  | Asset links collapse under accordion |
| Tablet     | Campaign switcher (column 1) → Prep checklist (column 2) → Feedback summary (full width below) | Safety tools badge top-right         |
| Desktop    | Campaign switcher (column 1) → Prep canvas (columns 2-3) → Feedback backlog (column 4)         | Asset drawer slide-in                |

## Platform Admin (`/admin`)

| Breakpoint | Structure                                                                             | Notes                                |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------ |
| Mobile     | Health snapshot → Incident log → User approvals                                       | Feature flag list accessible via CTA |
| Tablet     | Health snapshot (column 1) → Incident log (column 2) → Approvals (column 2)           | Alert center overlays header         |
| Desktop    | KPI wall (columns 1-2) → Incident timeline (column 3) → Feature flag queue (column 4) | Compliance export panel sticky       |
