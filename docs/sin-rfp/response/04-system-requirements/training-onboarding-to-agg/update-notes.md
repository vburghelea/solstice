# Update Notes

## Verified 2026-01-05

All TO-AGG requirements implemented on 2026-01-04 have been verified in `sin-dev`:

- ✅ **TO-AGG-001**: Template hub with preview URLs and version grouping; form detail pages surface template shortcuts
- ✅ **TO-AGG-002**: Onboarding tour auto-launches after first org selection; restart controls work
- ✅ **TO-AGG-003**: Help Center content role-scoped with audience badges; support requests include priority/SLA/attachments with notifications

Test environment: `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

---

## 2026-01-04 16:20 PST

### TO-AGG-001 Template Support & Integration

- Template hub now supports inline preview URLs and groups templates into version histories with updated metadata. Evidence: `src/features/templates/components/template-hub.tsx`, `src/features/templates/templates.mutations.ts`.
- Form detail pages now surface template shortcuts with preview/download actions. Evidence: `src/routes/dashboard/sin/forms/$formId.tsx`.

### TO-AGG-002 Guided Learning & Walkthroughs

- Onboarding tour auto-launches after first org selection when no progress exists, and completed/dismissed tours can be restarted. Evidence: `src/features/tutorials/components/tutorial-panel.tsx`, `src/features/tutorials/tutorials.mutations.ts`, `src/routes/dashboard/sin/index.tsx`.

### TO-AGG-003 Reference Materials & Support

- Help Center content is now role-scoped with audience badges, keeping guides and FAQs aligned to org roles. Evidence: `src/features/help/help-content.ts`, `src/features/help/components/help-center.tsx`.
- Support requests now include priority, optional SLA targets, and attachments, with response/status notifications dispatched in-app/email. Evidence: `src/db/schema/support.schema.ts`, `src/features/support/support.mutations.ts`, `src/features/support/support.queries.ts`, `src/features/support/components/support-requests-panel.tsx`, `src/features/support/components/support-admin-panel.tsx`.

## 2026-01-04 13:43 PST

### TO-AGG-001 Template Support & Integration

- The templates hub supports context filtering and downloads, but there is no in-app preview; templates are downloaded via signed URLs only. Evidence: `src/features/templates/components/template-hub.tsx`, `src/features/templates/templates.mutations.ts`.
- Contextual access is provided via "View templates" buttons on the forms/imports/reporting landing pages, not inside individual submissions or import records. Evidence: `src/routes/dashboard/sin/forms.tsx`, `src/routes/dashboard/sin/imports.tsx`, `src/routes/dashboard/sin/reporting.tsx`.
- Template uploads are supported in the admin console and require admin permissions for global or org-scoped templates. Evidence: `src/features/templates/components/template-admin-panel.tsx`, `src/features/templates/templates.mutations.ts`.

### TO-AGG-002 Guided Learning & Walkthroughs

- Guided walkthroughs are user-initiated from the Tutorial panel; there is no automatic first-login tour trigger. Evidence: `src/features/tutorials/components/tutorial-panel.tsx`, `src/features/tutorials/components/guided-tour.tsx`, `src/routes/dashboard/sin/index.tsx`.
- Tutorial progress is stored per user, but the onboarding route only covers privacy and profile completion and does not launch tutorials. Evidence: `src/db/schema/tutorials.schema.ts`, `src/routes/onboarding/index.tsx`.
- The data upload walkthrough appears on the Imports page and relies on `data-tour` targets; there are no help-icon triggers elsewhere. Evidence: `src/routes/dashboard/sin/imports.tsx`, `src/features/tutorials/tutorials.config.ts`.

### TO-AGG-003 Reference Materials & Support

- The Help Center is a static guide/FAQ list with client-side text filtering; no role-based filtering or ranked/full-text search is implemented. Evidence: `src/features/help/components/help-center.tsx`, `src/features/help/help-content.ts`.
- Support requests include status tracking and admin responses in-app, but there is no notification/email dispatch on response updates. Evidence: `src/features/support/components/support-requests-panel.tsx`, `src/features/support/components/support-admin-panel.tsx`, `src/features/support/support.mutations.ts`.
- Internal training materials for support staff exist in repo docs but are not surfaced in the Help Center UI. Evidence: `src/features/bi/docs/TRAINING-bi-support-coordinator.md`, `src/features/bi/docs/PLAYBOOK-bi-support.md`.
