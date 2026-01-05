# Update Notes

## Verified 2026-01-05

All features implemented on 2026-01-04 have been verified in `sin-dev`:

- ✅ Auto-launch onboarding tour after first org selection (tested with `viasport-staff@example.com`)
- ✅ Restart tour action appears after completion/dismissal
- ✅ Role-aware Help Center with audience badges ("Admin role" badge visible)
- ✅ Guides filtered by role (Owner/Admin/Reporter see imports + analytics content)
- ✅ Template Hub loads with search and context filter; preview/download working
- ✅ Form detail pages show template shortcuts with "View templates" link
- ✅ Support requests capture priority, display SLA targets
- ✅ Admin response workflow triggers notifications (verified in `notifications` table)

Test environment: `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono`

---

## 2026-01-04 16:20 PST

- Auto-launches the SIN portal onboarding tour after the first org selection when no tutorial progress exists, with restart support that resets completion/dismissal state. Evidence: `src/features/tutorials/components/tutorial-panel.tsx`, `src/features/tutorials/tutorials.mutations.ts`, `src/routes/dashboard/sin/index.tsx`.
- Help Center guides/FAQs are now role-scoped and display audience badges for org-aware guidance. Evidence: `src/features/help/help-content.ts`, `src/features/help/components/help-center.tsx`.
- Template Hub now groups versions by template name/context, shows update metadata, and supports preview URLs alongside downloads. Evidence: `src/features/templates/components/template-hub.tsx`, `src/features/templates/templates.mutations.ts`.
- Form detail pages now surface template shortcuts with preview/download actions. Evidence: `src/routes/dashboard/sin/forms/$formId.tsx`.
- Support requests now capture priority, optional SLA targets, and attachments; admin responses and status changes trigger in-app/email notifications. Evidence: `src/db/schema/support.schema.ts`, `src/features/support/support.mutations.ts`, `src/features/support/support.queries.ts`, `src/features/support/components/support-requests-panel.tsx`, `src/features/support/components/support-admin-panel.tsx`, `src/lib/notifications/queue.ts`.

## 2026-01-04 13:40 PST

- Guided walkthroughs exist with progress tracking, but only two tutorials are defined (portal onboarding + data upload), and there is no auto-run for first-time users or restart option. Evidence: `src/features/tutorials/tutorials.config.ts`, `src/features/tutorials/components/tutorial-panel.tsx`, `src/features/tutorials/components/guided-tour.tsx`.
- The onboarding tour described as a first-time experience is manual via the TutorialPanel; no automatic trigger on login/onboarding. Evidence: `src/routes/dashboard/sin/index.tsx`, `src/features/tutorials/components/tutorial-panel.tsx`.
- Help center content is static and not role-filtered; search only filters in-memory guides/FAQs. Evidence: `src/features/help/help-content.ts`, `src/features/help/components/help-center.tsx`.
- Templates hub supports filtering, download, and admin upload/archival, but there is no preview, sample data, or versioned template history in the UI. Evidence: `src/features/templates/components/template-hub.tsx`, `src/features/templates/components/template-admin-panel.tsx`.
- Contextual template access exists on the main Forms/Reporting/Imports pages, but individual form detail pages do not surface template links; "directly from each data entry item" is not met. Evidence: `src/routes/dashboard/sin/forms.tsx`, `src/routes/dashboard/sin/reporting.tsx`, `src/routes/dashboard/sin/imports.tsx`, `src/routes/dashboard/sin/forms/$formId.tsx`.
- Support requests capture subject/message/category and track status, but there is no priority or attachment support and no SLA/escalation logic in code; responses are stored and shown in-app only. Evidence: `src/features/support/components/support-requests-panel.tsx`, `src/db/schema/support.schema.ts`, `src/features/support/support.mutations.ts`, `src/features/support/components/support-admin-panel.tsx`.
