# Development Backlog Archive

This document contains completed tickets from the development backlog, preserved for historical reference.

---

## ✅ Completed – September 2025

### EVT-1: Event Cancellation Communication & Refund Flow

|                     |                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | ✅ Completed                                                                                                                                                                                                                                                                                      |
| **Priority**        | 🔴 Critical (member experience & revenue protection)                                                                                                                                                                                                                                              |
| **Problem**         | Cancelling an event only flips the event row to `cancelled`; attendee registrations remain untouched and no one is notified. Teams still appear confirmed, e-transfer instructions stay active, and Square sessions are never refunded, creating support escalations and revenue accounting gaps. |
| **Desired Outcome** | Cancelling an event must cascade: mark all related registrations as `cancelled`, persist cancellation timestamps/actors, automatically trigger refunds or follow-up tasks per payment method, and notify both registrants and administrators with clear messaging.                                |

---

### EVT-2: Event Registration Pricing & Payment Tests

|                     |                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | ✅ Completed                                                                                                                                                                                                                          |
| **Priority**        | 🟠 High (regression protection for revenue flows)                                                                                                                                                                                     |
| **Problem**         | `calculateRegistrationAmountCents` and the surrounding `registerForEvent` payment logic lack dedicated tests. Early-bird discounts, zero-cost events, and e-transfer paths are currently unverified and at risk of silent regression. |
| **Desired Outcome** | Deterministic coverage exercising pricing calculations and payment state transitions so future changes cannot break discount windows, amount rounding, or payment status tagging without failing CI.                                  |

---

### EVT-3: Event Mutation Time & Metadata Utilities

|                     |                                                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | ✅ Completed                                                                                                                                                                                                              |
| **Priority**        | 🟠 High (consistency & maintainability)                                                                                                                                                                                   |
| **Problem**         | Event mutations repeatedly instantiate `const now = new Date()` and rebuild payment metadata in-line, which risks divergent timestamps and inconsistent audit data across cancellation, reminder, and registration flows. |
| **Desired Outcome** | Centralized helpers that produce consistent timestamps and payment metadata snapshots, reducing duplication and making future audit logging trivial.                                                                      |

---

### APP-1: Router Event Type Coverage & Diagnostics

|                     |                                                                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | ✅ Completed                                                                                                                                                                                                                       |
| **Priority**        | 🟡 Medium (DX & observability)                                                                                                                                                                                                     |
| **Problem**         | We disabled client-side navigation logging because TypeScript lacks declarations for `router.subscribe("onNavigateStart" / "onNavigateEnd")`. Without types, engineers lose out on low-friction diagnostics during routing issues. |
| **Desired Outcome** | Strongly-typed router event subscriptions re-enabled in `src/client.tsx`, with optional logging that can be toggled without TS errors or lint suppressions.                                                                        |

---

### DOC-1: Backlog & Release Notes Alignment

|                     |                                                                                                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | ✅ Completed                                                                                                                                                                                                                                       |
| **Priority**        | 🟢 Medium (documentation accuracy)                                                                                                                                                                                                                 |
| **Problem**         | Historical backlog entries drifted from reality (e.g., the OAuth allowlist row mentioned an outstanding TODO despite being shipped). We need a lightweight process and doc updates so release notes, security docs, and this backlog stay in sync. |
| **Desired Outcome** | Clear documentation standards that prevent stale TODO callouts once work ships, plus a changelog snippet summarizing the event-cancellation initiative when complete.                                                                              |

---

> **Note**: Full implementation details for these tickets were preserved in git history. See commits from September 2025.
