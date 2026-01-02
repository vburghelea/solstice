# Context Notes - System Requirements Compliance - Training and Onboarding (TO-AGG)

## Requirement Definitions

- TO-AGG-001 Template Support and Integration
  - Description: Central templates tab and contextual template access.
  - Acceptance: Users can locate the correct template.
- TO-AGG-002 Guided Learning and Walkthroughs
  - Description: Onboarding and upload tutorials for first-time use.
  - Acceptance: Users can complete tasks independently.
- TO-AGG-003 Reference Materials and Support
  - Description: Guides and FAQ for self-service support.
  - Acceptance: Users find answers without direct support.

## Evidence Targets

- Screenshots or exports demonstrating each requirement.
- References to supporting docs or code as needed.

## Sources

- docs/sin-rfp/source/VIASPORT-PROVIDED-viasport-sin-rfp.md
- docs/sin-rfp/source/initial-template-rfp-response.md
- docs/sin-rfp/source/DO-NOT-COMMIT-CONFIDENTIAL-example-rfp-real.txt
- docs/sin-rfp/source/VIASPORT-PROVIDED-system-requirements-addendum.md
- docs/sin-rfp/requirements/SIN-REQUIREMENTS.md

## Draft Notes (for final.md)

- TO-AGG-001 Template Support and Integration
  - Response: Comply.
  - How requirement is met: Templates hub with context filters and downloads; contextual links from forms/imports/reporting to the correct template context.
  - Evidence: `src/features/templates/components/template-hub.tsx`, `src/routes/dashboard/sin/forms.tsx`, `src/routes/dashboard/sin/imports.tsx`, `src/routes/dashboard/sin/reporting.tsx`.
  - Notes: Template seeding + contextual access evidence still needed.
- TO-AGG-002 Guided Learning and Walkthroughs
  - Response: Comply.
  - How requirement is met: Tutorial framework with per-user progress and guided tours surfaced on the SIN dashboard.
  - Evidence: `src/features/tutorials/components/tutorial-panel.tsx`, `src/features/tutorials/components/guided-tour.tsx`, `src/routes/dashboard/sin/index.tsx`.
  - Notes: Verify in-context tour targets with seeded data.
- TO-AGG-003 Reference Materials and Support
  - Response: Comply.
  - How requirement is met: Help Center with guides + FAQ, searchable by category/keyword.
  - Evidence: `src/features/help/components/help-center.tsx`, `src/features/help/help-content.ts`, `src/routes/dashboard/sin/help.tsx`.
  - Notes: Confirm viaSport-specific content coverage.
