# Context Notes - Service Approach - Training and Onboarding

## RFP Prompts

- Audience-based training approach and delivery modules.
- Training resources and sample materials.
- Help desk and ticketing model.

## Evidence Targets

- Training outlines, guides, or walkthrough samples.
- Support model summary and SLAs.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt
- docs/sin-rfp/requirements/SIN-REQUIREMENTS.md
- docs/sin-rfp/requirements/user-stories-and-flows.md
- docs/sin-rfp/requirements/requirements-coverage-matrix.md
- docs/sin-rfp/review-plans/requirements-verification-report-2025-12-28.md
- docs/sin-rfp/review-plans/ux-review-findings.md
- src/features/tutorials/tutorials.config.ts
- src/features/tutorials/components/tutorial-panel.tsx
- src/features/help/help-content.ts
- src/features/help/components/help-center.tsx
- src/features/templates/components/template-hub.tsx
- src/features/templates/components/template-admin-panel.tsx
- src/features/support/components/support-requests-panel.tsx
- src/features/support/components/support-admin-panel.tsx

## Context Highlights (source-backed)

- Training requirements cover templates, guided walkthroughs, and reference
  materials/support. (docs/sin-rfp/requirements/SIN-REQUIREMENTS.md)
- Guided walkthroughs include onboarding and data upload tours with step-by-step
  instructions and in-context targets. (src/features/tutorials/tutorials.config.ts)
- Tutorial panel supports start/complete/dismiss flows and displays step lists.
  (src/features/tutorials/components/tutorial-panel.tsx)
- Help center provides searchable guides and FAQs for key tasks (getting started,
  imports, analytics). (src/features/help/help-content.ts,
  src/features/help/components/help-center.tsx)
- Template hub supports context-based filtering, search, and downloads; admin
  panel supports uploads and archival. (src/features/templates/components/template-hub.tsx,
  src/features/templates/components/template-admin-panel.tsx)
- Support requests are submitted in-app with categories and status tracking; admin
  console provides response workflow. (src/features/support/components/support-requests-panel.tsx,
  src/features/support/components/support-admin-panel.tsx)
- UX review evidence includes help center, templates, and support screens.
  (docs/sin-rfp/ux-review-findings.md)

## Draft Bullets for final.md (notes only)

### Audience-Based Training Approach

- Role-based onboarding aligned to viaSport admins, PSO reporters, and data
  stewards, with guided walkthroughs for core reporting/import workflows.
  (docs/sin-rfp/requirements/user-stories-and-flows.md,
  src/features/tutorials/tutorials.config.ts)
- Guided walkthrough panel provides step checklists and in-context tours on the
  SIN portal dashboard and imports pages. (src/features/tutorials/components/tutorial-panel.tsx)

### Resources and Sample Training Materials

- Help center guides + FAQs cover getting started, import preparation, and
  analytics usage with searchable content. (src/features/help/help-content.ts,
  src/features/help/components/help-center.tsx)
- Template hub delivers downloadable templates by context (forms/imports/
  reporting/analytics); admin upload supports updates and version control.
  (src/features/templates/components/template-hub.tsx,
  src/features/templates/components/template-admin-panel.tsx)

### Help Desk and Ticketing Model

- In-app support requests with categories (question/issue/feature/feedback),
  status workflow (open/in progress/resolved/closed), and admin response UI.
  (src/features/support/components/support-requests-panel.tsx,
  src/features/support/components/support-admin-panel.tsx)
- Support interactions are tracked inside the portal, with responses visible
  in the requester list for follow-up. (src/features/support/components/support-requests-panel.tsx)
