# SIN Persona Registry

**Purpose:** Single source of truth for viaSport + PSO personas used in SIN scope.
This file defines persona IDs and baseline access so specs and user stories can
reference personas without redefining them.

## Scope

In scope:

- viaSport staff personas.
- PSO staff personas.
- Generic role terms named in the RFP system requirements.

Out of scope for the current planning pass:

- Solstice platform staff (global admin).
- Club/league admins, team/event admins, tournament organizers.
- Players/participants and public/guest users.

## How to use this registry

- Reference persona IDs in specs, UX, and user-stories docs.
- Update this file when a persona changes; avoid redefining personas elsewhere.
- "Analyst" is a permission set (for example `analytics.author`, `analytics.sql`),
  not a standalone persona.

## Personas (in scope)

### VS_ADMIN - viaSport Admin

- Context: viaSport governing body staff.
- Goals: manage the PSO ecosystem, reporting cycles, and compliance.
- Primary tasks: org hierarchy, reporting cycles, forms, imports, analytics.
- Baseline access: platform role `viaSport Admin`; org role `owner` or `admin`.
- Analytics access: author + export (step-up), org-wide sharing.
- Sources: `docs/sin-rfp/requirements/user-stories-and-flows.md`,
  `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.

### PSO_ADMIN - PSO Admin

- Context: PSO staff (owner/admin for their organization).
- Goals: manage org profile and reporting obligations.
- Primary tasks: org metadata, delegated access, submissions, analytics.
- Baseline access: org role `owner` or `admin`.
- Analytics access: author + export (step-up), org-wide sharing.
- Sources: `docs/sin-rfp/requirements/user-stories-and-flows.md`,
  `src/features/bi/docs/SPEC-bi-platform.md`.

### PSO_REPORTER - PSO Reporter / Power User

- Context: PSO staff responsible for reporting.
- Goals: complete reporting tasks and produce analytics for their org.
- Primary tasks: fill forms, submit reports, build pivots, export data.
- Baseline access: org role `reporter`.
- Analytics access: author + export (step-up).
- Sources: `src/features/bi/docs/SPEC-bi-platform.md`,
  `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.

### ORG_MEMBER - Org Member (viewer)

- Context: PSO staff with view-only access.
- Goals: view shared dashboards and reports.
- Primary tasks: view dashboards, download shared outputs.
- Baseline access: org role `viewer` or `member`.
- Analytics access: view shared reports only.
- Sources: `src/features/bi/docs/SPEC-bi-platform.md`.

### VS_DATA_STEWARD - Data Steward (viaSport Analytics)

- Context: viaSport analytics and data governance staff.
- Goals: maintain data quality, definitions, and the catalog.
- Primary tasks: data catalog, metric definitions, analytics governance.
- Baseline access: viaSport admin persona with delegated analytics scope.
- Analytics access: author + dataset admin; exports (step-up).
- Sources: `docs/sin-rfp/requirements/user-stories-and-flows.md`,
  `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.

### VS_SUPPORT_COORD - Support and Training Coordinator

- Context: viaSport support staff.
- Goals: improve onboarding and reduce support load.
- Primary tasks: templates, guides, FAQs, support tickets.
- Baseline access: viaSport admin persona with support scope.
- Analytics access: view shared reports as needed.
- Sources: `docs/sin-rfp/requirements/user-stories-and-flows.md`,
  `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.

### VS_PRIVACY_OFFICER - Privacy and Compliance Officer

- Context: viaSport privacy staff.
- Goals: fulfill DSARs, legal holds, and retention obligations.
- Primary tasks: DSAR workflows, legal holds, retention policies.
- Baseline access: viaSport admin persona with privacy scope.
- Analytics access: audit-only; no analytics authoring by default.
- Sources: `docs/sin-rfp/requirements/user-stories-and-flows.md`,
  `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.

### VS_SECURITY_ADMIN - Security Admin

- Context: viaSport security staff.
- Goals: monitor threats and enforce access controls.
- Primary tasks: security events, MFA enforcement, audit review.
- Baseline access: viaSport admin persona with security scope.
- Analytics access: audit-only; no analytics authoring by default.
- Sources: `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.

### VS_AUDITOR - Auditor

- Context: viaSport internal or external audit staff.
- Goals: review audit logs and verify compliance evidence.
- Primary tasks: audit log review, evidence export.
- Baseline access: read-only audit scope.
- Analytics access: audit-only; no analytics authoring by default.
- Sources: `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.

### VS_INTEGRATION_ADMIN - Integration and Data Warehouse Admin

- Context: viaSport systems/integration staff.
- Goals: manage imports, integrations, and data warehousing.
- Primary tasks: imports, API credentials, ETL monitoring.
- Baseline access: viaSport admin persona with integration scope.
- Analytics access: authoring as needed for validation.
- Sources: `docs/sin-rfp/requirements/user-stories-and-flows.md`,
  `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`.

## RFP terminology mapping (system requirements addendum)

Note: `docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md` is role-agnostic.
Role terms for this mapping come from
`docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md`.

| RFP term                      | Persona IDs                                                                                              | Notes                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Users                         | ORG_MEMBER, PSO_REPORTER, PSO_ADMIN                                                                      | RFP uses a generic "users" term.               |
| System Admin / administrators | VS_ADMIN, VS_DATA_STEWARD, VS_SUPPORT_COORD, VS_PRIVACY_OFFICER, VS_SECURITY_ADMIN, VS_INTEGRATION_ADMIN | Specialized viaSport roles.                    |
| Organizational leaders        | PSO_ADMIN                                                                                                | Leaders who manage admission and org controls. |
| Auditors                      | VS_AUDITOR                                                                                               | Audit log access and evidence review.          |

## Implementation notes

- Distinct viaSport admin personas are listed in
  `docs/sin-rfp/requirements/sin-dual-portal-considerations.md`, but are not
  separate roles in code yet.
- Analytics access is primarily governed by org roles (`owner`, `admin`,
  `reporter`) plus optional permission sets (`analytics.author`,
  `analytics.sql`).
