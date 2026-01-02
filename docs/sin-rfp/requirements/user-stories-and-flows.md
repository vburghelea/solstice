# User Stories and User Flows by Persona

**Date:** 2025-12-29
**Purpose:** Realistic user stories and navigation flows to uncover gaps in SIN implementation

**Canonical personas:** `docs/sin-rfp/requirements/personas.md` (IDs + scope).
**Current focus:** Sections 2, 3, 8, 9, 10, 11 (viaSport + PSO staff). Sections 1
and 4-7 are deferred for now (platform and operations personas).

---

## Table of Contents

1. [Global Admin (Solstice Platform)](#1-global-admin-solstice-platform)
2. [viaSport Admin (Governing Body)](#2-viasport-admin-governing-body)
3. [BC Soccer Admin (PSO)](#3-bc-soccer-admin-pso)
4. [BC Soccer Club Team Admin](#4-bc-soccer-club-team-admin)
5. [BC Soccer Tournament Organizer](#5-bc-soccer-tournament-organizer)
6. [BC Soccer Player](#6-bc-soccer-player)
7. [Orienteering Participant](#7-orienteering-participant)
8. [Data Steward (viaSport Analytics)](#8-data-steward-viasport-analytics)
9. [Support & Training Coordinator](#9-support--training-coordinator)
10. [Privacy & Compliance Officer](#10-privacy--compliance-officer)
11. [Integration & Data Warehouse Admin](#11-integration--data-warehouse-admin)
12. [Gap Summary](#12-gap-summary)

---

## 1. Global Admin (Solstice Platform)

**Context:** A Solstice employee who manages the entire platform across all tenants (viaSport, Quadball Canada, etc.). Has full system access, manages tenant configurations, and handles escalated issues.

### User Stories

#### Account & Access Management

| ID     | Story                                                                                                                           | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| GA-001 | As a global admin, I want to log in with MFA so that platform access is secure                                                  | P0       |
| GA-002 | As a global admin, I want to view all organizations across all tenants so that I can support any organization                   | P0       |
| GA-003 | As a global admin, I want to create new tenant organizations (governing bodies) so that new sports can onboard                  | P1       |
| GA-004 | As a global admin, I want to impersonate a user (with audit trail) so that I can debug issues they're experiencing              | P2       |
| GA-005 | As a global admin, I want to unlock accounts that were locked due to security events so that legitimate users can regain access | P0       |

#### System Monitoring

| ID     | Story                                                                                                        | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------ | -------- |
| GA-006 | As a global admin, I want to view audit logs across all tenants so that I can investigate security incidents | P0       |
| GA-007 | As a global admin, I want to see security events (failed logins, anomalies) so that I can detect threats     | P0       |
| GA-008 | As a global admin, I want to view system health dashboards so that I can proactively address issues          | P1       |
| GA-009 | As a global admin, I want to configure rate limiting and security thresholds so that I can tune protection   | P2       |

#### Data Management

| ID     | Story                                                                                                                            | Priority |
| ------ | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| GA-010 | As a global admin, I want to execute and verify database backups so that disaster recovery is assured                            | P0       |
| GA-011 | As a global admin, I want to place legal holds on user/org data so that retention policies don't delete litigation-relevant data | P1       |
| GA-012 | As a global admin, I want to process DSAR (data subject access requests) so that privacy compliance is maintained                | P1       |

### User Flow: Investigate Security Incident

```
Current State:
Homepage → Login (MFA) → Dashboard → Admin Panel (/dashboard/admin/sin)
  → Security (/dashboard/admin/sin/security)
    → View security events list [EXISTS - basic]
    → Filter by date/type/user [EXISTS - basic]
    → View account locks [EXISTS]
    → Unlock account [EXISTS]
  → Audit (/dashboard/admin/sin/audit)
    → Search audit logs [EXISTS - basic]
    → Filter by user/action/date [EXISTS]
    → Export audit log [PARTIAL - needs real export]

Ideal State Additions:
  → Cross-tenant security dashboard [GAP]
  → Anomaly detection alerts [GAP - flagging exists but no dashboard]
  → User impersonation with audit [GAP]
  → Real-time security event stream [GAP]
```

### User Flow: Create New Sport Organization

```
Current State:
Admin Panel → Organizations (/dashboard/admin/sin/organizations)
  → List all organizations [EXISTS]
  → Create organization form [EXISTS]
    → Name, slug, type, parent [EXISTS]
    → Status, discoverable, join requests [EXISTS]
  → Save → Organization created [EXISTS]

Gaps:
  - No tenant/governing body creation wizard [GAP]
  - No bulk org import from CSV [GAP]
  - No org hierarchy visualization [GAP]
```

---

## 2. viaSport Admin (Governing Body)

**Context:** A viaSport staff member who administers the entire BC amateur sport ecosystem. Manages PSOs (Provincial Sport Organizations like BC Soccer, BC Hockey), collects annual reports, allocates funding, and ensures compliance.

**Persona ID:** VS_ADMIN

### User Stories

#### Organization Management

| ID     | Story                                                                                                                                           | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| VA-001 | As a viaSport admin, I want to see all PSOs and their child organizations in a hierarchy so that I understand the sport ecosystem               | P0       |
| VA-002 | As a viaSport admin, I want to approve new PSO registrations so that only legitimate organizations join                                         | P1       |
| VA-003 | As a viaSport admin, I want to delegate reporting access to PSO contacts so that they can submit their own reports                              | P0       |
| VA-004 | As a viaSport admin, I want to view organization profiles with contact info, fiscal year, and agreement details so that I have complete records | P0       |

#### Reporting & Compliance

| ID     | Story                                                                                                                                                 | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| VA-005 | As a viaSport admin, I want to create reporting cycles (Q1, Annual, etc.) so that PSOs know when reports are due                                      | P0       |
| VA-006 | As a viaSport admin, I want to assign reporting tasks to specific org types (all PSOs, specific clubs) so that the right orgs receive the right forms | P0       |
| VA-007 | As a viaSport admin, I want to track which PSOs have submitted/not submitted their reports so that I can follow up on delinquents                     | P0       |
| VA-008 | As a viaSport admin, I want to review and approve/reject submitted reports so that data quality is ensured                                            | P0       |
| VA-009 | As a viaSport admin, I want to send automated reminders before due dates so that submission rates improve                                             | P1       |
| VA-010 | As a viaSport admin, I want to request changes on a submission so that PSOs can correct errors without starting over                                  | P0       |

#### Forms & Data Collection

| ID     | Story                                                                                                                                    | Priority |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| VA-011 | As a viaSport admin, I want to create custom forms with various field types so that I can collect any data needed                        | P0       |
| VA-012 | As a viaSport admin, I want to version forms so that changes don't break historical submissions                                          | P0       |
| VA-013 | As a viaSport admin, I want to require certain fields and validate data formats so that submissions are complete and accurate            | P0       |
| VA-014 | As a viaSport admin, I want to allow file uploads in forms (budgets, rosters, insurance docs) so that supporting documents are collected | P1       |

#### Analytics & Exports

| ID     | Story                                                                                                                                      | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| VA-015 | As a viaSport admin, I want to build ad-hoc reports from submitted data so that I can answer stakeholder questions                         | P0       |
| VA-016 | As a viaSport admin, I want to export aggregated data to Excel/CSV so that I can share with government funders                             | P0       |
| VA-017 | As a viaSport admin, I want to create dashboards showing participation trends, funding allocation, etc. so that I can present to the board | P1       |
| VA-018 | As a viaSport admin, I want to save and share report configurations so that common reports don't need rebuilding                           | P1       |

#### Data Migration

| ID     | Story                                                                                                          | Priority |
| ------ | -------------------------------------------------------------------------------------------------------------- | -------- |
| VA-019 | As a viaSport admin, I want to import historical data from BCAR/BCSI legacy systems so that we have continuity | P0       |
| VA-020 | As a viaSport admin, I want to map legacy fields to new form fields so that data aligns correctly              | P0       |
| VA-021 | As a viaSport admin, I want to preview imports before committing so that I can catch mapping errors            | P0       |
| VA-022 | As a viaSport admin, I want to rollback failed imports so that bad data doesn't pollute the system             | P1       |

### User Flow: Create and Manage a Reporting Cycle

```
Current State:
Login → Dashboard redirects to SIN Portal (/dashboard/sin)
  → Admin Panel (/dashboard/admin/sin)
    → Reporting (/dashboard/admin/sin/reporting)
      → View reporting cycles [EXISTS]
      → Create cycle (name, dates, status) [EXISTS]
      → Create reporting task [EXISTS]
        → Select form [EXISTS]
        → Set due date [EXISTS]
        → Assign to org type or specific org [EXISTS]
      → View submission status grid [EXISTS - basic]
      → Review submission [EXISTS - basic]
        → Approve/reject/request changes [EXISTS]

Gaps:
  - No bulk reminder send UI [GAP - backend exists]
  - No submission status dashboard/visualization [GAP]
  - Reminders don't trigger automatically yet [GAP - needs verification]
  - No overdue notification escalation [GAP]
```

### User Flow: Import Legacy BCAR Data

```
Current State:
Admin Panel → Imports (/dashboard/admin/sin/imports)
  → View import jobs [EXISTS]
  → Create mapping template [EXISTS]
    → Define source→target field mappings [EXISTS]
  → Start import wizard [EXISTS - shell]
    → Upload CSV [EXISTS]
    → Select mapping template [EXISTS]
    → Preview mapped data [PARTIAL - needs enhancement per gap-closure-plan]
    → Execute import [EXISTS]
    → View results/errors [EXISTS]
  → Rollback import [EXISTS - basic]

User Portal → Imports (/dashboard/sin/imports)
  → View my import jobs [EXISTS]
  → Track status [EXISTS]

Gaps:
  - Preview step not fully implemented [GAP - P1 in closure plan]
  - File field imports blocked [CONFIRMED - intentional]
  - Batch import for large files needs ECS [GAP - L1 in backlog]
  - No legacy data migration wizard specifically [GAP]
```

---

## 3. BC Soccer Admin (PSO)

**Context:** An administrator at BC Soccer, a Provincial Sport Organization under viaSport. Manages hundreds of clubs, thousands of teams, and tens of thousands of players. Responsible for submitting reports to viaSport and collecting data from clubs.

**Persona ID:** PSO_ADMIN

### User Stories

#### Reporting to viaSport

| ID      | Story                                                                                                                                            | Priority |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| BSA-001 | As a BC Soccer admin, I want to see my assigned reporting tasks so that I know what's due                                                        | P0       |
| BSA-002 | As a BC Soccer admin, I want to fill out required forms with our organization's data so that we meet compliance                                  | P0       |
| BSA-003 | As a BC Soccer admin, I want to upload supporting documents (financial statements, insurance certificates) so that our submission is complete    | P0       |
| BSA-004 | As a BC Soccer admin, I want to save draft submissions so that I can work on them over multiple sessions                                         | P0       |
| BSA-005 | As a BC Soccer admin, I want to track my submission status (submitted, under review, approved) so that I know where we stand                     | P0       |
| BSA-006 | As a BC Soccer admin, I want to receive email notifications about upcoming deadlines and status changes so that nothing falls through the cracks | P1       |

#### Managing Member Clubs

| ID      | Story                                                                                                         | Priority |
| ------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| BSA-007 | As a BC Soccer admin, I want to view all clubs registered under BC Soccer so that I have a complete roster    | P0       |
| BSA-008 | As a BC Soccer admin, I want to approve new club registrations so that only legitimate clubs join             | P1       |
| BSA-009 | As a BC Soccer admin, I want to collect annual reports from clubs so that we can aggregate data for viaSport  | P1       |
| BSA-010 | As a BC Soccer admin, I want to see which clubs have/haven't submitted their data so that I can follow up     | P1       |
| BSA-011 | As a BC Soccer admin, I want to delegate admin access to club contacts so that they can manage their own data | P0       |

#### Member Registry

| ID      | Story                                                                                                                | Priority |
| ------- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| BSA-012 | As a BC Soccer admin, I want to maintain a registry of all registered players so that we have membership records     | P1       |
| BSA-013 | As a BC Soccer admin, I want to import player registrations from club exports so that data flows up the hierarchy    | P1       |
| BSA-014 | As a BC Soccer admin, I want to generate membership cards or certificates so that players have proof of registration | P2       |
| BSA-015 | As a BC Soccer admin, I want to track NCCP coaching certifications so that we ensure coach compliance                | P2       |

#### Analytics

| ID      | Story                                                                                                                  | Priority |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| BSA-016 | As a BC Soccer admin, I want to see aggregate participation stats (by age, gender, region) so that I can report trends | P1       |
| BSA-017 | As a BC Soccer admin, I want to export my organization's data so that I can do custom analysis                         | P0       |

### User Flow: Complete Quarterly Report for viaSport

```
Current State:
Login → SIN Portal (/dashboard/sin)
  → Reporting (/dashboard/sin/reporting)
    → View assigned tasks (filtered to my org) [EXISTS]
    → Click task to start/continue submission [EXISTS]
      → Opens form (/dashboard/sin/forms/$formId) [EXISTS]
        → Fill fields [EXISTS]
        → Upload files [EXISTS - single file per field]
        → Save draft [EXISTS]
        → Submit [EXISTS]
    → Track status on task list [EXISTS]
    → View reviewer feedback [EXISTS - basic]
    → Resubmit with changes [EXISTS]

Gaps:
  - No deadline countdown/urgency indicators [GAP]
  - Email reminders not verified working [GAP - P2 in closure plan]
  - No submission receipt email [GAP]
  - Can't see history of past submissions easily [GAP]
```

### User Flow: Onboard a New Club

```
Current State:
Dashboard → Organizations (/dashboard/organizations)
  → View child organizations [PARTIAL - admin only]

Admin Panel → Organizations (/dashboard/admin/sin/organizations)
  → Create organization [EXISTS]
    → Set parent to BC Soccer [EXISTS]
    → Set type to "club" [EXISTS]
  → Invite admin user [GAP - no invitation flow]

Gaps:
  - No self-service club registration request [GAP - D0.9 decided admin-only]
  - No invitation email to club admin [GAP]
  - No club onboarding wizard [GAP]
  - PSO can't create child orgs without global admin [GAP - access control issue]
```

---

## 4. BC Soccer Club Team Admin

**Context:** A volunteer administrator at Vancouver United FC, a club under BC Soccer. Manages the club's teams, coaches, and player registrations. Often a parent volunteer with limited tech experience.

### User Stories

#### Club Management

| ID      | Story                                                                                                                            | Priority |
| ------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| CTA-001 | As a club admin, I want to register my club with BC Soccer so that we're officially recognized                                   | P1       |
| CTA-002 | As a club admin, I want to manage multiple teams within my club (U12 Boys, U14 Girls, etc.) so that our structure is represented | P0       |
| CTA-003 | As a club admin, I want to assign team managers/coaches to each team so that they can manage rosters                             | P0       |
| CTA-004 | As a club admin, I want to see all players registered across all my club's teams so that I have a complete roster                | P0       |

#### Player Registration

| ID      | Story                                                                                                                      | Priority |
| ------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| CTA-005 | As a club admin, I want to register players to my club so that they can join teams                                         | P0       |
| CTA-006 | As a club admin, I want to assign players to specific teams so that rosters are accurate                                   | P0       |
| CTA-007 | As a club admin, I want to collect player information (DOB, emergency contact, medical info) so that we have required data | P0       |
| CTA-008 | As a club admin, I want to track player membership payments so that I know who has paid                                    | P1       |
| CTA-009 | As a club admin, I want to export player lists so that I can share with coaches                                            | P0       |

#### Reporting to PSO

| ID      | Story                                                                                                  | Priority |
| ------- | ------------------------------------------------------------------------------------------------------ | -------- |
| CTA-010 | As a club admin, I want to see reporting tasks assigned to my club so that I know what BC Soccer needs | P1       |
| CTA-011 | As a club admin, I want to submit our club's annual report so that we stay compliant                   | P1       |
| CTA-012 | As a club admin, I want to upload our insurance certificate so that BC Soccer has it on file           | P1       |

#### Event Registration

| ID      | Story                                                                                                      | Priority |
| ------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| CTA-013 | As a club admin, I want to register our teams for tournaments so that they can compete                     | P0       |
| CTA-014 | As a club admin, I want to see all tournaments available for our age groups so that we can plan our season | P0       |
| CTA-015 | As a club admin, I want to pay tournament registration fees online so that registration is confirmed       | P0       |

### User Flow: Register Team for Tournament

```
Current State:
Login → Dashboard (/dashboard)
  → Events (/dashboard/events)
    → Browse upcoming events [EXISTS]
    → Filter by type/date [EXISTS - basic]
    → View event details (/dashboard/events/$slug) [EXISTS]
    → Register for event (/dashboard/events/$slug/register) [EXISTS]
      → Select team (if team registration) [EXISTS]
      → Fill roster [EXISTS - basic]
      → Pay via Square [EXISTS]
      → Receive confirmation [EXISTS - redirect, no email]

Gaps:
  - No filtering by age group/division [GAP]
  - No team eligibility check (membership status) [GAP]
  - Roster validation against registered players [GAP]
  - Registration confirmation email [GAP]
  - No waitlist functionality [GAP]
```

### User Flow: Manage Club Teams

```
Current State:
Dashboard → Teams (/dashboard/teams)
  → View my teams [EXISTS]
  → Create team [EXISTS]
    → Name, description [EXISTS]
    → Logo upload [PARTIAL]
  → Team detail → Members tab [EXISTS]
    → Invite members [EXISTS - by email]
    → Set member roles [EXISTS]
  → Team detail → Manage tab [EXISTS]
    → Edit team info [EXISTS]
    → Delete team [EXISTS]

Gaps:
  - No team hierarchy (club → teams) [GAP - teams are flat]
  - No age group/division assignment [GAP]
  - No bulk player import [GAP]
  - No roster template download [GAP]
  - No integration with org membership registry [GAP]
```

---

## 5. BC Soccer Tournament Organizer

**Context:** An event coordinator running the BC Soccer Provincial Cup. Manages registrations, schedules, payments, and communications for a multi-day tournament with 50+ teams.

### User Stories

#### Event Creation

| ID     | Story                                                                                                                                       | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TO-001 | As a tournament organizer, I want to create a tournament event with all details (dates, venue, divisions) so that teams know what to expect | P0       |
| TO-002 | As a tournament organizer, I want to set registration limits per division so that we don't exceed venue capacity                            | P0       |
| TO-003 | As a tournament organizer, I want to set registration deadlines and early bird pricing so that teams register on time                       | P0       |
| TO-004 | As a tournament organizer, I want to require membership verification so that only eligible teams register                                   | P1       |

#### Registration Management

| ID     | Story                                                                                                                 | Priority |
| ------ | --------------------------------------------------------------------------------------------------------------------- | -------- |
| TO-005 | As a tournament organizer, I want to see all registered teams so that I know who's coming                             | P0       |
| TO-006 | As a tournament organizer, I want to see payment status for each team so that I can follow up on unpaid registrations | P0       |
| TO-007 | As a tournament organizer, I want to manage a waitlist so that spots can be filled if teams drop out                  | P1       |
| TO-008 | As a tournament organizer, I want to send announcements to all registered teams so that I can communicate updates     | P0       |
| TO-009 | As a tournament organizer, I want to export the registration list with rosters so that I can create the schedule      | P0       |

#### Financial Management

| ID     | Story                                                                                                                       | Priority |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| TO-010 | As a tournament organizer, I want to see total revenue collected so that I can track against budget                         | P0       |
| TO-011 | As a tournament organizer, I want to process refunds for cancelled teams so that finances are accurate                      | P1       |
| TO-012 | As a tournament organizer, I want to accept e-transfer as an alternative payment method so that teams without cards can pay | P0       |

#### Communication

| ID     | Story                                                                                                                    | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| TO-013 | As a tournament organizer, I want to email all team contacts so that I can send pre-event info                           | P0       |
| TO-014 | As a tournament organizer, I want to post announcements visible to registered teams so that real-time updates are shared | P0       |

### User Flow: Create and Manage Tournament

```
Current State:
Dashboard → Events (/dashboard/events)
  → Create Event (/dashboard/events/create) [EXISTS]
    → Basic info (name, slug, type, dates) [EXISTS]
    → Venue details [EXISTS]
    → Registration settings [EXISTS]
      → Type (team/individual/both) [EXISTS]
      → Max teams, max participants [EXISTS]
      → Fees (team/individual) [EXISTS]
      → Early bird [EXISTS]
      → E-transfer option [EXISTS]
    → Publish [EXISTS]
  → Manage Event (/dashboard/events/$eventId/manage) [EXISTS]
    → View registrations [EXISTS - basic list]
    → Payment status [EXISTS - basic]
    → Post announcement [EXISTS]
    → Export registrations [GAP]

Gaps:
  - No divisions management (separate limits per age group) [GAP - stored in JSONB but no UI]
  - No waitlist management [GAP]
  - No refund processing [GAP]
  - No financial summary dashboard [GAP]
  - No roster export [GAP]
  - Email to all registrants [GAP - announcements exist but not email blast]
```

### User Flow: Check Registration and Payment Status

```
Current State:
Manage Event → Registrations tab
  → List of teams [EXISTS]
    → Team name, status, payment status [EXISTS]
    → Amount due, amount paid [EXISTS]
  → Click team for details [EXISTS - basic]

Gaps:
  - No payment aging/overdue highlighting [GAP]
  - No payment reminder send [GAP]
  - No bulk actions (approve all paid, etc.) [GAP]
  - No reconciliation with Square dashboard [GAP]
```

---

## 6. BC Soccer Player

**Context:** A recreational soccer player who plays on a local club team. Wants to register for the season, join team activities, and participate in tournaments.

### User Stories

#### Account & Profile

| ID     | Story                                                                                                                 | Priority |
| ------ | --------------------------------------------------------------------------------------------------------------------- | -------- |
| PL-001 | As a player, I want to create an account so that I can access the platform                                            | P0       |
| PL-002 | As a player, I want to complete my profile (name, DOB, contact, emergency contact) so that my club has my information | P0       |
| PL-003 | As a player, I want to reset my password if I forget it so that I can regain access                                   | P0       |
| PL-004 | As a player, I want to update my contact information so that it stays current                                         | P0       |

#### Membership

| ID     | Story                                                                                              | Priority |
| ------ | -------------------------------------------------------------------------------------------------- | -------- |
| PL-005 | As a player, I want to purchase my annual membership so that I'm eligible to play                  | P0       |
| PL-006 | As a player, I want to see my membership status and expiry date so that I know if I'm current      | P0       |
| PL-007 | As a player, I want to receive a reminder before my membership expires so that I can renew on time | P1       |
| PL-008 | As a player, I want to download proof of membership so that I can show it at events                | P2       |

#### Teams

| ID     | Story                                                                                 | Priority |
| ------ | ------------------------------------------------------------------------------------- | -------- |
| PL-009 | As a player, I want to see teams I can join so that I can find a place to play        | P0       |
| PL-010 | As a player, I want to request to join a team so that they can add me to their roster | P0       |
| PL-011 | As a player, I want to see which teams I'm on so that I know my commitments           | P0       |
| PL-012 | As a player, I want to see my teammates so that I know who I'm playing with           | P0       |
| PL-013 | As a player, I want to leave a team so that I can transfer or take a break            | P1       |

#### Events

| ID     | Story                                                                                                                  | Priority |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| PL-014 | As a player, I want to see upcoming events for my teams so that I can plan to attend                                   | P0       |
| PL-015 | As a player, I want to receive notifications about event updates so that I stay informed                               | P1       |
| PL-016 | As a player, I want to register individually for open events (camps, clinics) so that I can participate without a team | P1       |

### User Flow: New Player Registration and Join Team

```
Current State:
Homepage → Sign Up (/auth/signup) [EXISTS]
  → Enter email, password [EXISTS]
  → Google OAuth option [EXISTS]
  → Email verification [EXISTS - Better Auth]
→ Onboarding (/onboarding) [EXISTS]
  → Complete profile [EXISTS]
    → Name, DOB, phone [EXISTS]
    → Emergency contact [EXISTS - in profile]
→ Dashboard (/dashboard)
  → See membership status (inactive) [EXISTS]
  → Buy Membership (/dashboard/membership) [EXISTS]
    → Select membership type [EXISTS]
    → Pay via Square [EXISTS]
    → Membership active [EXISTS]
→ Teams → Browse (/dashboard/teams/browse) [EXISTS]
  → Search/filter teams [EXISTS - basic]
  → Request to join [EXISTS]
  → Wait for approval [EXISTS]
→ My Teams → See joined team [EXISTS]

Gaps:
  - Password recovery flow [GAP - P0 in closure plan]
  - Membership expiry reminder [GAP]
  - Membership card/certificate download [GAP]
  - No team search by location/age group [GAP]
```

### User Flow: View and Manage Profile

```
Current State:
Dashboard → Profile (/dashboard/profile) [EXISTS]
  → View/edit personal info [EXISTS]
  → Change password [PARTIAL - no forgot password]
  → Privacy settings (/dashboard/privacy) [EXISTS]
    → View privacy policy [EXISTS]
    → Request data export [EXISTS]
    → Request deletion [EXISTS]

Gaps:
  - No profile photo [GAP]
  - No emergency contact in profile view (only form fill) [GAP]
  - No medical info section [GAP]
```

---

## 7. Orienteering Participant

**Context:** A recreational orienteering enthusiast who participates in races organized by Orienteering BC. Races vary - some are solo, some allow pairs, some have age categories. Unlike team sports, orienteering is primarily individual but sometimes has pair/relay formats.

### User Stories

#### Solo Registration

| ID     | Story                                                                                                                                | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| OP-001 | As an orienteer, I want to browse upcoming races so that I can plan my season                                                        | P0       |
| OP-002 | As an orienteer, I want to register myself for a race so that I can participate                                                      | P0       |
| OP-003 | As an orienteer, I want to select my course/category (beginner, intermediate, elite, age group) so that I'm in the right competition | P0       |
| OP-004 | As an orienteer, I want to pay the entry fee online so that my registration is confirmed                                             | P0       |
| OP-005 | As an orienteer, I want to receive confirmation with start time and course info so that I know when/where to show up                 | P0       |

#### Pair/Team Registration

| ID     | Story                                                                                                      | Priority |
| ------ | ---------------------------------------------------------------------------------------------------------- | -------- |
| OP-006 | As an orienteer, I want to register as a pair for score-O events so that my partner and I compete together | P1       |
| OP-007 | As an orienteer, I want to invite my partner to join my registration so that we're linked                  | P1       |
| OP-008 | As an orienteer, I want to form a relay team with 2-3 others so that we can compete in relays              | P1       |
| OP-009 | As an orienteer, I want one person to register and pay for the pair/team so that we don't duplicate        | P1       |

#### Membership

| ID     | Story                                                                                                                       | Priority |
| ------ | --------------------------------------------------------------------------------------------------------------------------- | -------- |
| OP-010 | As an orienteer, I want to purchase day membership at registration if I'm not a member so that casual participants can race | P1       |
| OP-011 | As an orienteer, I want the system to check my membership status so that members get member pricing                         | P1       |

#### Results & History

| ID     | Story                                                                                      | Priority |
| ------ | ------------------------------------------------------------------------------------------ | -------- |
| OP-012 | As an orienteer, I want to see my past race results so that I can track my improvement     | P2       |
| OP-013 | As an orienteer, I want to see my registration history so that I can reference past events | P1       |

### User Flow: Solo Race Registration

```
Current State:
Events (/dashboard/events) or Public Events (/events)
  → Browse events [EXISTS]
  → Filter by type [EXISTS - but no "orienteering" type]
  → View event details [EXISTS]
  → Register → Individual registration [EXISTS]
    → Select division/category [PARTIAL - divisions exist but UX not tailored]
    → Enter participant details [EXISTS - minimal]
    → Pay [EXISTS]
    → Confirmation [EXISTS - redirect only]

Gaps:
  - No course/category selection UI [GAP]
  - No course description/map preview [GAP]
  - No start time selection/assignment [GAP]
  - No SI card number capture [GAP - orienteering-specific]
  - No day membership upsell [GAP]
  - No confirmation email with event details [GAP]
```

### User Flow: Pair Registration

```
Ideal State (NOT CURRENTLY POSSIBLE):
Events → View Score-O Event
  → Register as Pair
    → Enter my details
    → Enter partner email → sends invitation
    → Partner accepts invitation
    → Complete registration
    → Pay (once, for both)
    → Both receive confirmation

Current Reality:
  - Registration is either "team" (requires existing team entity) or "individual"
  - No "pair" registration type
  - No mid-registration invitation flow
  - Would need workaround: create 2-person "team" first, then register

Gaps:
  - No pair/duo registration type [GAP]
  - No invite-during-registration flow [GAP]
  - No shared payment for pair [GAP]
  - Relay registration (3-4 person) same issues [GAP]
```

### User Flow: Day Membership Upsell

```
Ideal State (NOT CURRENTLY POSSIBLE):
Register for Event
  → System checks: user has no active membership
  → Shows: "You need membership to register. Options:"
    → Purchase Annual Membership ($60) - saves $5/event
    → Purchase Day Membership ($10) - one event only
  → User selects day membership
  → Added to cart with event registration
  → Single payment for both
  → Day membership auto-expires after event

Current Reality:
  - Membership and event registration are completely separate flows
  - No bundled checkout
  - No day membership concept
  - User must buy membership separately first

Gaps:
  - No membership check during event registration [GAP]
  - No day membership type [GAP]
  - No bundled checkout (membership + event) [GAP]
```

---

## 8. Data Steward (viaSport Analytics)

**Context:** A viaSport analyst or data steward responsible for data governance, analytics, data quality, and reporting to internal and external stakeholders.

**Persona ID:** VS_DATA_STEWARD

### User Stories

#### Data Governance & Catalog

| ID     | Story                                                                                                          | Priority |
| ------ | -------------------------------------------------------------------------------------------------------------- | -------- |
| DS-001 | As a data steward, I want to search and manage the data catalog so that datasets are discoverable and governed | P0       |
| DS-002 | As a data steward, I want to tag fields with sensitivity and ownership so that access controls are enforced    | P1       |
| DS-003 | As a data steward, I want to document data definitions and calculation logic so that reports are consistent    | P1       |

#### Analytics & Reporting

| ID     | Story                                                                                                                  | Priority |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| DS-004 | As a data steward, I want to build ad-hoc reports with pivots and charts so that I can answer policy questions quickly | P0       |
| DS-005 | As a data steward, I want to schedule recurring exports (monthly, quarterly) so that stakeholders get timely data      | P1       |
| DS-006 | As a data steward, I want to save and share report configurations so that common reports are reusable                  | P1       |

#### Data Quality & Lineage

| ID     | Story                                                                                                               | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------- | -------- |
| DS-007 | As a data steward, I want to monitor data quality issues and validation errors so that I can fix them at the source | P1       |
| DS-008 | As a data steward, I want to see data lineage (source -> transformation -> report) so that I can trace issues       | P2       |

### User Flow: Build and Export an Analytics Report

```
Current State:
Login -> SIN Portal (/dashboard/sin)
  -> Analytics (/dashboard/sin/analytics)
    -> Build report with filters, pivots, charts [EXISTS]
    -> Save report [EXISTS]
    -> Export CSV/Excel [EXISTS]

Gaps:
  - No scheduled exports or report subscriptions [GAP]
  - No semantic layer / standardized metric definitions [GAP]
```

### User Flow: Manage the Data Catalog

```
Current State:
Admin Panel (/dashboard/admin/sin)
  -> Data Catalog (/dashboard/admin/sin/data-catalog)
    -> Search/filter datasets [EXISTS]
    -> Sync catalog entries [EXISTS]
    -> View field metadata [EXISTS - basic]

Gaps:
  - No lineage view or transformation history [GAP]
  - No field-level sensitivity tagging UI [GAP]
  - No quality alerts tied to catalog entries [GAP]
```

---

## 9. Support & Training Coordinator

**Context:** A viaSport staff member who manages templates, tutorials, and responds to user support requests to help the sector onboard smoothly.

**Persona ID:** VS_SUPPORT_COORD

### User Stories

#### Templates & Guidance

| ID     | Story                                                                                                           | Priority |
| ------ | --------------------------------------------------------------------------------------------------------------- | -------- |
| ST-001 | As a support coordinator, I want to publish and version templates so that organizations use the correct formats | P0       |
| ST-002 | As a support coordinator, I want to maintain FAQs and guides so that users can self-serve answers               | P1       |
| ST-003 | As a support coordinator, I want to provide contextual walkthroughs so that first-time users succeed            | P1       |

#### Support & Feedback

| ID     | Story                                                                                                   | Priority |
| ------ | ------------------------------------------------------------------------------------------------------- | -------- |
| ST-004 | As a support coordinator, I want to receive support requests with context so that I can respond quickly | P0       |
| ST-005 | As a support coordinator, I want to track support request status and response time so that SLAs are met | P1       |

### User Flow: Publish Templates and Guidance

```
Current State:
Admin Panel (/dashboard/admin/sin)
  -> Templates (/dashboard/admin/sin/templates)
    -> Upload template file [EXISTS]
    -> Set scope/context (reporting/imports/analytics) [EXISTS]
    -> Archive old templates [EXISTS]
User Portal (/dashboard/sin/templates)
  -> Browse and download templates [EXISTS]

Gaps:
  - No version history or change log visible to users [GAP]
  - No template release notifications [GAP]
```

### User Flow: Respond to Support Request

```
Current State:
User Portal (/dashboard/sin/support)
  -> Submit support request [EXISTS]
Admin Panel (/dashboard/admin/sin/support)
  -> View incoming requests [EXISTS]
  -> Respond to user [EXISTS]

Gaps:
  - No assignment/ownership or SLA tracking [GAP]
  - No tagging/categorization for trend analysis [GAP]
```

---

## 10. Privacy & Compliance Officer

**Context:** A viaSport staff member responsible for privacy compliance, DSAR processing, legal holds, and retention governance.

**Persona ID:** VS_PRIVACY_OFFICER

### User Stories

#### DSAR & Privacy Operations

| ID     | Story                                                                                                                 | Priority |
| ------ | --------------------------------------------------------------------------------------------------------------------- | -------- |
| PC-001 | As a privacy officer, I want to review and process DSAR requests so that legal obligations are met                    | P0       |
| PC-002 | As a privacy officer, I want to generate a complete export of a user's data so that requests are fulfilled accurately | P0       |
| PC-003 | As a privacy officer, I want to approve or deny deletion requests with audit trail so that decisions are traceable    | P1       |

#### Legal Holds & Retention

| ID     | Story                                                                                                             | Priority |
| ------ | ----------------------------------------------------------------------------------------------------------------- | -------- |
| PC-004 | As a privacy officer, I want to apply and release legal holds so that retention policies pause when required      | P1       |
| PC-005 | As a privacy officer, I want to configure retention policies by data type so that storage aligns with regulations | P1       |
| PC-006 | As a privacy officer, I want to verify audit log integrity so that regulatory reporting is defensible             | P2       |

### User Flow: Process a DSAR Request

```
Current State:
Admin Panel (/dashboard/admin/sin)
  -> Privacy (/dashboard/admin/sin/privacy)
    -> View DSAR requests [EXISTS]
    -> Export user data [EXISTS]
    -> Record processing notes [EXISTS - basic]

Gaps:
  - No verification checklist/workflow for DSAR approvals [GAP]
  - No retention exception tied to DSAR holds [GAP]
```

### User Flow: Apply a Legal Hold

```
Current State:
Admin Panel -> Privacy -> Legal Holds [EXISTS]
  -> Create hold (scope, reason) [EXISTS]
  -> Release hold [EXISTS]

Gaps:
  - Hold enforcement on automated deletion/retention not verified [GAP]
  - No reporting on which records are protected by a hold [GAP]
```

---

## 11. Integration & Data Warehouse Admin

**Context:** A systems administrator responsible for data integration, warehousing, and external API connectivity with legacy systems or partner platforms.

**Persona ID:** VS_INTEGRATION_ADMIN

### User Stories

#### Integrations & APIs

| ID      | Story                                                                                                           | Priority |
| ------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| IDW-001 | As an integration admin, I want to provision API credentials so that approved partners can access data securely | P1       |
| IDW-002 | As an integration admin, I want to map and sync data from legacy systems so that historical data is consistent  | P0       |
| IDW-003 | As an integration admin, I want to monitor import/export jobs so that failures are detected early               | P0       |

#### Data Warehouse Operations

| ID      | Story                                                                                                 | Priority |
| ------- | ----------------------------------------------------------------------------------------------------- | -------- |
| IDW-004 | As a data warehouse admin, I want to run scheduled ETL jobs so that analytics datasets stay fresh     | P1       |
| IDW-005 | As a data warehouse admin, I want to track data volumes and storage costs so that budgets are managed | P2       |

### User Flow: Configure an External Data Integration

```
Current State:
Admin Panel -> Imports (/dashboard/admin/sin/imports)
  -> Upload files + mapping templates [EXISTS]
  -> Run import + view results [EXISTS]

Gaps:
  - No API key management or partner access portal [GAP]
  - No automated ETL or scheduled syncs [GAP]
  - No dedicated data warehouse layer for analytics [GAP]
```

---

## 12. Gap Summary

### Critical Gaps (P0)

| Gap                                        | Affected Personas              | Notes                                                    |
| ------------------------------------------ | ------------------------------ | -------------------------------------------------------- |
| Password recovery flow                     | All                            | P0 in gap-closure-plan, actively being worked            |
| Membership check during event registration | Tournament Organizers, Players | Eligibility verification                                 |
| Pair/group registration for events         | Orienteering, Relay sports     | Current model is team OR individual, not flexible groups |
| Email confirmations/notifications          | All                            | Backend exists but delivery not verified                 |
| PSO admin can't create child orgs          | PSO Admins                     | Access control gap                                       |
| Division/category management UI            | Organizers, Participants       | Data stored but no UI                                    |
| Legacy data sync + monitoring              | Integration Admins             | Imports exist but no automated sync monitoring           |

### High Priority Gaps (P1)

| Gap                                      | Affected Personas        | Notes                                      |
| ---------------------------------------- | ------------------------ | ------------------------------------------ |
| Legal holds + retention                  | Global Admins            | P1 in gap-closure-plan                     |
| Import preview UI                        | viaSport Admins          | P1 in gap-closure-plan                     |
| Waitlist management                      | Organizers, Participants | Schema support unclear                     |
| Day membership concept                   | Orienteering             | New membership type needed                 |
| Registration invitation flow             | Pair registrants         | Invite partner mid-registration            |
| Club invitation emails                   | PSO Admins, Club Admins  | Onboarding flow                            |
| Membership expiry reminders              | Players                  | Notification trigger                       |
| Financial reporting dashboard            | Organizers               | Event revenue summary                      |
| Refund processing                        | Organizers               | Payment management                         |
| Data warehouse / semantic layer          | Data Stewards            | RFP scope not represented in product flows |
| Scheduled exports & report subscriptions | Data Stewards            | Needed for recurring reporting             |
| API credential management                | Integration Admins       | Required for partner data exchange         |
| Support SLAs + request categorization    | Support                  | Service management gap                     |

### Medium Priority Gaps (P2)

| Gap                                 | Affected Personas | Notes                        |
| ----------------------------------- | ----------------- | ---------------------------- |
| User impersonation (with audit)     | Global Admins     | Support debugging            |
| Membership card/certificate         | Players           | PDF generation               |
| Race results tracking               | Orienteering      | Results integration          |
| Cross-tenant dashboard              | Global Admins     | Multi-tenant visibility      |
| Team hierarchy (club → teams)       | Club Admins       | Structural modeling          |
| Profile photo                       | Players           | UX enhancement               |
| Roster template download            | Club Admins       | Import helper                |
| Start time assignment               | Orienteering      | Race-specific scheduling     |
| Audit log integrity verification UI | Privacy           | Hash verification visibility |
| Data lineage visualization          | Data Stewards     | Traceability for analytics   |

### Architecture Observations

1. **Registration Model Rigidity**: The current `registration_type` enum (`team`, `individual`, `both`) doesn't support flexible group sizes. Orienteering pairs, relay teams (3-4), and family registrations need a more flexible model.

2. **Membership Integration**: Membership is siloed from events. No checkout integration, no eligibility checks, no day-pass concept.

3. **Organization Hierarchy**: While `parent_org_id` exists, the PSO→Club→Team hierarchy isn't fully operational. PSO admins can't manage child orgs without elevated privileges.

4. **Notification Delivery**: Backend exists but end-to-end delivery (especially email) needs verification.

5. **Event Customization**: Division/category data lives in JSONB but lacks management UI. Each sport may need different category structures.

6. **Data Warehouse & Integration Layer**: RFP scope includes warehousing, external integrations, and data processing logs. Current product flows rely on in-app reports and imports but lack a dedicated warehouse/ETL layer, API access, and scheduled data pipelines.

### Target Data Model Proposal (Group Registration + Membership Checkout)

**Goal:** Support flexible group sizes (pairs, relay teams) and bundled checkout for event registration plus membership (annual or day pass).

**Proposed Core Entities**

| Entity                       | Purpose                                                                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `registration_groups`        | Represents a registration unit for an event (individual, pair, team, relay, family). Stores size rules, captain, and status. |
| `registration_group_members` | Links users (or pending invites) to a group with roles, status, and optional roster metadata.                                |
| `registration_invites`       | Tracks invite-by-email for group registration and acceptance workflow.                                                       |
| `event_registrations`        | Event-specific registration record that references a `registration_group`, division/category, and payment status.            |
| `checkout_sessions`          | Unified checkout for one or more purchasable items (event registration, membership).                                         |
| `checkout_items`             | Line items for the checkout (registration fee, membership fee, add-ons).                                                     |
| `membership_purchases`       | Represents a membership purchase with type (annual/day), effective dates, and linkage to checkout.                           |

**Key Relationships**

```
event -> event_registrations -> registration_groups
registration_groups -> registration_group_members (1:N)
registration_groups -> registration_invites (1:N)
checkout_sessions -> checkout_items (1:N)
checkout_items -> event_registrations (optional 1:1)
checkout_items -> membership_purchases (optional 1:1)
```

**Compatibility Notes**

- Existing `team` registrations map to a `registration_group` with `group_type=team` and a `team_id` reference (optional).
- Existing `individual` registrations map to `registration_group` with a single member.
- Day membership becomes a `membership_type` with short duration and event-scoped linkage via `membership_purchases.event_id`.

**Implications**

- Enables invite-during-registration and shared payments for pairs/relays.
- Allows a single checkout session that includes both event registration and membership purchase.
- Requires refactoring registration flows and payment reconciliation but can be introduced with a migration layer to preserve legacy records.

### Recommended Next Steps

1. **Validate P0 gaps** against active implementation
2. **Add flexible registration groups** to support pairs/relays
3. **Build membership eligibility checks** into event registration
4. **Verify email delivery** end-to-end
5. **Add PSO-level org management** permissions
6. **Define warehouse/integration roadmap** (ETL, scheduled exports, partner access)
