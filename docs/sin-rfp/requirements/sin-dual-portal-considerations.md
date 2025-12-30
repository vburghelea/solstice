# SIN + QC Dual-Portal Considerations (Draft)

## Terminology + Tenant Separation

- "Operations" in this doc refers to the feature set currently enabled only in the QC
  tenant: qc_portal + membership + events + teams + members_directory + reports +
  payments_square.
- QC remains a separate tenant deployed in a separate AWS account. Enabling operations
  for SIN personas means turning on these features in the viaSport tenant for selected
  roles, not merging tenants or data.

## Current Split (Tenant Feature Flags)

### viaSport tenant (SIN-focused)

File: src/tenant/tenants/viasport.ts

- Enabled: sin_portal, sin_admin (and its sub-features), sin_reporting, sin_forms,
  sin_imports, sin_analytics, sin_templates, sin_help_center, sin_support,
  sin_data_catalog, sin_data_quality, sin_walkthroughs, org_join_requests,
  org_invite_links, security_core, notifications_core
- Disabled: qc_portal, membership, events, teams, members_directory, reports,
  payments_square

### QC tenant (operations-focused, separate account)

File: src/tenant/tenants/qc.ts

- Enabled: qc_portal, membership, events, teams, members_directory, reports,
  payments_square, sin_templates, sin_help_center, sin_support, sin_data_catalog,
  sin_data_quality, sin_walkthroughs, security_core, notifications_core
- Disabled: sin_portal and all sin_admin/sin_reporting features

### Gate enforcement

- UI navigation is feature-gated (src/features/layouts/app-nav.ts).
- Routes use requireFeatureInRoute (src/tenant/feature-gates.ts).
- Server functions use assertFeatureEnabled for data access and mutations.

## Codebase Reality Check (Current Implementation)

### What is actually enforced today

- Feature gating is tenant-level only (src/tenant/feature-gates.ts). No org-type or
  delegated-scope checks are applied in nav or route guards.
- Navigation merges operations + SIN items into a single sidebar. If both portals are
  enabled, all items render (src/features/layouts/app-nav.ts,
  src/components/ui/app-sidebar.tsx).
- /dashboard redirects to SIN only when sin_portal is enabled and qc_portal is disabled.
  With both enabled, users land on the operations dashboard by default
  (src/routes/dashboard/index.tsx).
- Organization context only exposes organizationRole and activeOrganizationId. Org
  type and delegated scopes exist in data but are not surfaced in context
  (src/features/organizations/org-context.tsx, src/features/organizations/organizations.access.ts).
- Operations data is not org-scoped. Teams/events/memberships have no organizationId;
  the member directory is global to the tenant
  (src/features/teams/_, src/features/events/_, src/features/members/members.queries.ts).
- SIN admin features require global admin in both UI and server handlers. Data catalog,
  data quality, privacy, security, notifications admin, and support admin are global-admin
  only (src/routes/dashboard/admin/route.tsx, src/features/_/_.queries.ts).
- Org admin capabilities exist server-side (membership role updates, delegated access),
  but the only UI to manage those is the SIN Admin console
  (src/features/organizations/components/organization-admin-panel.tsx).
  Portal org admins can only use join requests/invite links.
- Role assignment is global-admin-only today; there is no grant matrix for non-global
  admins (src/features/roles/roles.mutations.ts).
- Role-based route guard (requireRole) exists but is unused in routes today
  (src/lib/auth/middleware/role-guard.ts).

## SIN-Provided Docs (High-Level User Expectations)

Source docs:

- docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md
- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md

User types implied (high level):

- System administrators
- Organizational leaders
- Authorized/reporting users
- Auditors
- General users who submit data and use help/support resources

These docs do not specify membership/team/event workflows.

## Why Consider a Dual-Portal Model

### Potential selling points to viaSport

- Single source of truth: SIN reporting + competition operations in one system.
- Reduced duplicate entry for PSOs that already manage teams/events.
- Better analytics: participation and competition data linked to reporting data.
- Faster compliance: reporting validated against real event participation.
- Lower support burden: one login, shared onboarding, consistent UX.

### Specific value: PSO admins + tournament data

- PSO admins can verify submissions with event participation data.
- viaSport gains near-real-time insights into activity and impact.

## Considerations and Risks

### Procurement scope and positioning

- viaSport requirements focus on reporting, analytics, security, privacy, and support.
  Membership/teams/events are not in the core requirements set.
- Risk: co-enabling operations features can look like scope creep (cost, timeline,
  complexity).
- Safer framing: optional Phase 2 module, disabled by default, pilot-only enablement.

### Adoption, support, and privacy risk

- Enabling operational modules expands the user base (players, parents, club admins),
  which increases support volume and UX edge cases.
- More operational data can trigger privacy reviews (consent, retention, DSAR scope).
- Be explicit that data governance coverage (audit, retention, DSAR) extends to any
  optional operational data if those modules are enabled.

### UX and portal separation

- Current dashboard redirect assumes SIN-only when sin_portal is enabled and
  qc_portal is disabled (src/routes/dashboard/index.tsx).
- If both portals are enabled, users land on the operations dashboard by default.
- Must avoid confusing users with mixed nav unless roles determine portal access.
- Consider a workspace model: one login, multiple workspaces (Operations, Reporting/SIN,
  Admin). Keep nav stable within each workspace and provide a workspace switcher.

### Payments and membership dependencies

- Membership flow assumes Square payment integration.
- Enabling membership without payments_square configured will break checkout.
- Event registration can implicitly depend on payments and membership eligibility.
  If optional ops modules are enabled, keep payments isolated or explicitly optional.

### Data readiness

- Teams/events/membership require seeded data and configuration.
- Without membership types, teams, or events, users may see empty/error states.

### Role-based access design

- Must ensure club/league admins and players do not see SIN admin tools.
- Must ensure viaSport and PSO admins can access reporting + analytics.

## Persona Enablement Gaps (Based on Current Code)

- Public/Guest: Only the generic public portal landing page exists; no public events
  or public reporting previews (src/features/dashboard/PublicPortalPage.tsx).
- Player/Athlete: Membership, teams, and events exist, but require membership types,
  Square configuration, and seeded operations data to be usable in a SIN tenant.
- Team Captain/Coach: Team role checks exist (captain/coach), but no portal-level
  entitlement gating (team pages are feature-flag only).
- Club/League Admin: No operations data is tied to organizations; there is no
  org-scoped teams/events model, and no club/league admin role in the ops portal.
- PSO Reporter / PSO Admin: Organization roles exist (owner/admin/reporter/viewer),
  but portal UI for managing org members/delegated access is missing.
- viaSport Data Steward / Support / Privacy / Security / Auditor: These roles are not
  distinct in code. Access to admin tooling requires global admin today.
- Integration/Data Warehouse Admin: Imports/exports are admin-only and require global
  admin permissions plus sin*admin*\* feature flags.

## Options for Enabling Both Feature Sets

Note: QC remains a separate tenant. These options cover enabling the operations
feature set inside viaSport for select personas.

### Option A: Tenant-level toggle for both portals

- Enable qc_portal and sin_portal (and the ops features) in the viaSport tenant.
- Pros: Simple config change.
- Cons: Requires strong role-based nav/route gating to avoid UX confusion; operations
  data is not org-scoped, so this exposes operational data broadly unless re-modeled.

### Option B: Role-based feature gating (recommended)

- Add role-aware feature gating in nav + routes.
- Example: SIN admin features only for viaSport + PSO roles.
- Ops portal items only for club/league admin and player roles.
- Requires a role-to-feature matrix and enforcement layer.

### Option C: Keep viaSport SIN-only, stay separate

- Keep operations in the QC tenant only and use sync/ETL to feed SIN reporting.
- Pros: clean separation.
- Cons: cannot tie operations directly to SIN organizations without cross-tenant sync.

## Suggested Role-to-Feature Matrix (Draft)

- viaSport admin: sin_admin + analytics + reporting + data catalog + security
- PSO admin: sin_reporting + analytics + org access + tournament data
- Club/league admin: operations portal (qc_portal) + teams + events + membership + reports
- Player: operations portal (qc_portal) + membership + events (registration/participation)

## Role Governance + Role Granting (Draft)

### Default admin personas

- viaSport Data Steward (reporting + data quality + data catalog)
- Support & Training Coordinator (support + templates + notifications)
- Privacy & Compliance Officer (privacy + DSAR + retention)
- Security Admin (security + audit)
- Auditor (read-only audit access)
- Integration/Data Warehouse Admin (imports/exports)

### Granting rules (illustrative)

- Solstice Admin: can grant all roles.
- viaSport Admin: can grant SIN admin personas and reporting/analytics roles.
- Data Steward: can grant reporting/analytics roles (no security/privacy).
- Support Coordinator: can grant support roles only.
- Privacy Officer: can grant privacy roles only.
- Security Admin: can grant security/audit roles only.
- Org Owner/Admin: can grant org roles (owner/admin/reporter/viewer/member) and
  delegated scopes within their organization.
- Team/Event Admin: can grant scoped team/event roles within their team/event.

## Implementation Considerations

- Build a workspace switcher and landing decision when both portals are on.
  Update /dashboard redirect logic and sidebar branding
  (src/routes/dashboard/index.tsx, src/components/ui/app-sidebar.tsx).
- Add a portal entitlement layer. Extend filterNavItems and route guards to check
  organization type and delegated scopes. Expose org type/scopes in OrgContext
  (src/tenant/feature-gates.ts, src/features/organizations/org-context.tsx).
- Apply route guards for ops features (membership/teams/events/members) using team roles
  and/or org membership. Today ops routes only check feature flags.
- Add portal UI for org admins to manage members + delegated access. Server functions
  already exist but only the SIN Admin console exposes them.
- Operations data in viaSport should be tied to SIN organizations:
  - Add organizationId to teams/events/memberships, or
  - Create mapping tables (organization_teams, organization_events).
- Membership requires Square configuration and membership types. If enabling ops portal
  in viaSport, enable payments_square and seed membership/event/team data.
- Ensure privacy/compliance coverage (DSAR, retention, audit) includes operational
  ops data if that data is enabled in SIN.
- Define and enforce a role-granting policy:
  - Update role assignment mutations to enforce which admins can grant which roles.
  - Update role management UI to only show grantable roles for the current admin.
  - Add audit logging for role grants/changes.

## Draft Role-Aware Gating (if operations features are enabled in viaSport)

### Available signals today

- Global admin (PermissionService.isGlobalAdmin / requiresGlobalAdmin).
- Organization role (owner/admin/reporter/viewer/member).
- Organization type (governing_body/pso/league/club/affiliate).
- Delegated scopes (reporting/analytics/admin).
- Team roles (captain/coach) for ops team management.
- Event organizer access (event.organizerId) for ops event management.

### Portal access rules (draft)

- viaSport global admin: SIN portal + SIN admin; ops portal hidden.
- PSO admin/reporter (org type: pso): SIN portal (reporting/forms/imports/analytics).
- Club/league admin (org type: club/league): ops portal (membership/teams/events/reports).
- Player/member (no org role or member role): ops portal (membership/events/teams), no SIN.
- Optional: allow club/league admins SIN reporting only if delegated reporting scope is granted.

### Suggested gating model changes

- Extend NavItem gating with organization type and delegated scope checks.
- Expose active organization type + delegated scopes in org context for nav filtering.
- Add portal-level access helper to control default dashboard redirect + portal switch.
- Add ops portal guards using team membership and/or org membership if teams/events are
  tied to organizations.

### Ops + SIN nav mapping (draft)

- Operations Portal
  - Membership/Events/Teams: require qc_portal + portal access (no org role required).
  - Members Directory/Reports: require qc_portal + org role (owner/admin/reporter).
- SIN Portal
  - Reporting/Forms/Imports: require sin_portal + delegated scope (reporting) or org role.
  - Analytics: require sin_portal + delegated scope (analytics) or org role.
  - Help/Support/Templates: require sin_portal + portal access.

## Persona Workspace Matrix (Draft)

| Persona                          | Operations (qc_portal) | Reporting (SIN)               | Admin Console  | Typical access / notes                                                 |
| -------------------------------- | ---------------------- | ----------------------------- | -------------- | ---------------------------------------------------------------------- |
| Public / Guest                   | ✅ (public)            | ❌                            | ❌             | Public pages only (no portal access).                                  |
| Player / Athlete                 | ✅                     | ❌                            | ❌             | Membership purchase/status, join teams, event registration.            |
| Team Captain / Coach             | ✅                     | ❌                            | ❌             | Team roster + invites, team registrations, group registration invites. |
| Club Admin                       | ✅                     | ⚠️ (delegated reporting only) | ❌             | Manage club teams/events; optional delegated reporting access.         |
| League Admin                     | ✅                     | ⚠️ (delegated reporting only) | ❌             | Similar to club admin; broader event ops.                              |
| PSO Reporter                     | ⚠️ (optional)          | ✅                            | ❌             | Submit forms, manage submissions, view limited analytics.              |
| PSO Admin / Org Leader           | ⚠️ (optional)          | ✅                            | ❌             | Org access (join/invite), delegated access, reporting oversight.       |
| viaSport Data Steward            | (hidden by UX)         | ✅                            | ✅ (limited)   | Forms, imports, data catalog, data quality, analytics.                 |
| Support & Training Coordinator   | (hidden by UX)         | ✅                            | ✅ (limited)   | Templates, help center, support admin, notification templates.         |
| Privacy & Compliance Officer     | (hidden by UX)         | ❌ (or limited)               | ✅             | DSAR exports, corrections/erasures, retention policies, legal holds.   |
| Security Admin                   | (hidden by UX)         | ❌ (or limited)               | ✅             | Security dashboard, locks, suspicious activity review.                 |
| Auditor (internal/external)      | ❌                     | ❌ (or read-only analytics)   | ✅ (read-only) | Audit log filtering/export, tamper-evident verification.               |
| Integration/Data Warehouse Admin | ❌                     | ✅ (imports/exports)          | ✅ (limited)   | Imports tooling, export pipelines, data catalog.                       |

## Next Steps

- Define the role taxonomy for viaSport SIN (specific roles + permissions).
- Decide whether to enable both portals in the viaSport tenant or keep the separate
  QC tenant. If co-enabled, plan the data model changes first.
- Validate data model readiness for events and membership in SIN context.
- Align this change with the SIN requirements coverage matrix.
