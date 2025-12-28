# CODE_GUIDE.md - Missing Descriptions

This file contains descriptions for files that the other agent only counted lines for but didn't read.

---

## Dashboard

- `src/features/dashboard/MemberDashboard.tsx` (544 lines) - Member dashboard home page component.
  Displays profile completion status, membership cards with status badges, team memberships
  with pending invites, upcoming events, and admin quick actions. Role-aware section visibility
  using `isAnyAdmin()`. Contains sub-components: ActionCards, TeamsCard, MembershipCard,
  UpcomingEventsCard, AdminToolsCard, QuickLinksCard. Uses tenant branding via `getBrand()`.

- `src/features/dashboard/PublicPortalPage.tsx` (95 lines) - Public portal page for unauthenticated
  visitors. Displays login/signup buttons and optional marketing site link. Tenant-aware with
  brand name, description, and marketing URL from `getBrand()`.

---

## Events

- `src/features/events/events.mutations.ts` (1280 lines) - Event management mutations.
  cancelEvent (cascade to registrations/payments with auto/manual refund modes via Square),
  createEvent, updateEvent, registerForEvent (individual/team with Square checkout or e-transfer),
  markEventEtransferPaid, markEventEtransferReminder, cancelEventRegistration.
  Uses feature gate `qc_events`. Validates organizer/admin permissions.

- `src/features/events/events.queries.ts` (460 lines) - Event data fetching server functions.
  listEvents (with filters for status/type/date/location, pagination, sorting),
  getEvent/getEventBySlug, getUpcomingEvents (for dashboard),
  getEventRegistrations (admin/organizer only - returns user emails and payment data),
  checkEventRegistration. Returns typed EventWithDetails with computed fields
  (isRegistrationOpen, availableSpots, registrationCount).

---

## Forms

- `src/features/forms/components/form-builder-shell.tsx` (1627 lines) - Full-featured dynamic form builder UI.
  Drag-and-drop field palette with 11 field types (text, number, email, phone, date, select,
  multiselect, checkbox, file, textarea, rich_text). Supports conditional field visibility,
  validation rules (min/max length, regex patterns), file upload config. Includes DynamicFormRenderer
  for live preview, submission review workflow with status management (under_review, changes_requested,
  approved, rejected), submission version history, and file attachment handling with S3 presigned URLs.

- `src/features/forms/forms.mutations.ts` (589 lines) - Form management mutations.
  createForm, updateForm, publishForm (with versioning), submitForm (with payload validation
  and completeness scoring), updateFormSubmission, reviewFormSubmission (approve/reject workflow),
  createFormUpload (S3 presigned URLs with file type/size validation). All mutations enforce
  org access via `requireOrgAccess()` and audit log changes. Uses feature gates `sin_admin_forms`
  and `sin_forms`.

- `src/features/forms/forms.queries.ts` (327 lines) - Form data fetching server functions.
  getForm, listForms (with org filtering based on user memberships), getLatestFormVersion,
  listFormSubmissions, getFormSubmission, listFormSubmissionVersions, listSubmissionFiles,
  getSubmissionFileDownloadUrl (S3 presigned URL). Enforces org access and global admin fallback.

---

## Imports

- `src/features/imports/imports.mutations.ts` (512 lines) - Import job management mutations.
  createImportJob (with rollback window), updateImportJobStatus, createMappingTemplate,
  updateMappingTemplate, deleteMappingTemplate, createImportUpload (S3 presigned URLs),
  runInteractiveImport (single-row validation with field type coercion for number/checkbox/multiselect),
  runBatchImport (delegates to batch-runner), rollbackImportJob (deletes submissions within window).
  All mutations enforce org access and audit log changes. Uses feature gate `sin_admin_imports`.

- `src/features/imports/imports.queries.ts` (195 lines) - Import job data queries.
  getImportJob, listImportJobs (with org filtering based on user memberships),
  listMappingTemplates (includes global templates), listImportJobErrors.
  Enforces organization membership for access control with global admin fallback.

---

## Layouts

- `src/features/layouts/__tests__/admin-layout.test.tsx` (122 lines) - Test suite for AdminLayout.
  Tests navigation rendering, user context handling, mobile menu, and navigation link hrefs.
  Uses `renderWithRouter` and `OrgContextProvider` for proper context setup.

- `src/features/layouts/admin-layout.tsx` (50 lines) - Admin section layout component.
  Renders admin navigation tabs with role-based filtering via `filterNavItems()`.
  Shows admin subtitle from brand config and renders child routes via `<Outlet />`.

- `src/features/layouts/admin-nav.ts` (25 lines) - Admin sidebar navigation configuration.
  Defines admin nav items: Admin Home, Roles, SIN Admin. All items require global admin role.
  SIN Admin is feature-gated with `sin_admin` flag.

---

## Members

- `src/features/members/members.queries.ts` (354 lines) - Member directory queries.
  listMembers with search (name/email/phone/team), pagination, and privacy filtering.
  Joins users with teams and memberships, computes active/expired membership status,
  respects user privacy settings (showEmail/showPhone/showBirthYear) for non-self views.
  Returns MemberDirectoryMember with membership history. Feature-gated with `qc_members_directory`.

---

## Membership

- `src/features/membership/membership.admin-queries.ts` (135 lines) - Admin membership queries.
  getAllMemberships for paginated membership records with user info, requires admin access.
  Returns MembershipReportRow with user name/email, type, dates, status, price, payment ID.
  Feature-gated with `qc_membership`.

- `src/features/membership/membership.mutations.ts` (439 lines) - Membership purchase mutations.
  createCheckoutSession (Square integration with payment session upsert),
  confirmMembershipPurchase (with retry logic for pending payments, uses finalizeMembershipForSession
  for atomic transaction). Validates membership type, prevents duplicate active memberships,
  sends receipt email on creation. Feature-gated with `qc_membership`.

- `src/features/membership/membership.queries.ts` (208 lines) - Membership data queries.
  listMembershipTypes (active types ordered by price), getMembershipType by ID,
  getUserMembershipStatus (current user's active membership with expiry and days remaining).
  All queries feature-gated with `qc_membership`.

---

## Notifications

- `src/features/notifications/notifications.mutations.ts` (282 lines) - Notification management mutations.
  markNotificationRead, dismissNotification, updateNotificationPreferences (per-category email/in-app
  channels with frequency), createNotification (with audit logging), createNotificationTemplate,
  updateNotificationTemplate, deleteNotificationTemplate (admin-only), scheduleNotification
  (with templateKey, user/org/role filters, scheduled time, variables). Feature-gated with
  `notifications_core` and `sin_admin_notifications`.

- `src/features/notifications/notifications.queries.ts` (111 lines) - Notification data queries.
  listNotifications (with unreadOnly filter, pagination), getUnreadNotificationCount,
  getNotificationPreferences, listNotificationTemplates (admin-only). Feature-gated with
  `notifications_core` and `sin_admin_notifications`.

---

## Organizations

- `src/features/organizations/components/organization-admin-panel.tsx` (542 lines) - Organization
  management admin UI. Create organizations with type hierarchy (governing_body, pso, league, club,
  affiliate), manage members with role assignment (owner/admin/reporter/viewer/member),
  handle member invitations and approvals, configure delegated access with scopes
  (reporting/analytics/admin) and expiration. Uses React Query mutations.

- `src/features/organizations/organizations.mutations.ts` (882 lines) - Organization management mutations.
  createOrganization (with hierarchy validation and auto-owner membership), updateOrganization,
  inviteOrganizationMember, approveOrganizationMember, updateOrganizationMemberRole,
  removeOrganizationMember, createDelegatedAccess, revokeDelegatedAccess, setActiveOrganization
  (sets cookie for org context). All mutations enforce org membership with admin roles and
  audit log changes. Feature-gated with `sin_admin_orgs` and `sin_portal`.

- `src/features/organizations/organizations.queries.ts` (242 lines) - Organization data queries.
  getOrganization, listOrganizations (user's orgs via membership), listAccessibleOrganizations
  (includes delegated access), searchOrganizations (name search), listAllOrganizations (admin-only),
  listOrganizationMembers, listDelegatedAccess. Feature-gated with `sin_portal` and `sin_admin_orgs`.

- `src/features/organizations/organizations.schemas.ts` (135 lines) - Zod schemas for organizations.
  Defines types (governing_body/pso/league/club/affiliate), statuses (pending/active/suspended/archived),
  roles (owner/admin/reporter/viewer/member), member statuses, delegated access scopes.
  Input schemas for CRUD operations, member management, and delegated access.

- `src/features/organizations/organizations.types.ts` (65 lines) - TypeScript types for organizations.
  OrganizationOperationResult<T> result wrapper, OrganizationSummary, OrganizationMemberRow,
  DelegatedAccessRow, AccessibleOrganization (with role and delegated scopes).

---

## Privacy

- `src/features/privacy/components/privacy-acceptance-card.tsx` (91 lines) - Privacy policy acceptance UI.
  Shows current policy version and effective date, links to policy document, accept button.
  Uses React Query to fetch latest policy and user acceptances, tracks acceptance state.

- `src/features/privacy/privacy.mutations.ts` (659 lines) - GDPR/PIPEDA privacy compliance mutations.
  createPolicyDocument, acceptPolicy (with IP/user-agent capture), createPrivacyRequest,
  updatePrivacyRequest (status workflow), upsertRetentionPolicy (configurable retention/archive/purge days),
  generatePrivacyExport (full data export to S3 with all user data, submissions, audit logs, etc.),
  applyPrivacyErasure (anonymizes user, deletes accounts/sessions/files, revokes delegated access,
  nullifies form submissions - DSAR erasure). All mutations audit logged.
  Feature-gated with `security_core` and `sin_admin_privacy`.

- `src/features/privacy/privacy.queries.ts` (156 lines) - Privacy data queries.
  listPolicyDocuments, getLatestPolicyDocument (by type), listUserPolicyAcceptances,
  listPrivacyRequests (user's own), listAllPrivacyRequests (admin-only), listRetentionPolicies,
  getPrivacyExportDownloadUrl (S3 presigned URL). Feature-gated with `security_core` and `sin_admin_privacy`.

---

## Reporting

- `src/features/reporting/components/reporting-dashboard-shell.tsx` (587 lines) - Reporting admin
  dashboard. Create reporting cycles (date ranges), assign reporting tasks (linked to forms, scoped
  to org/org type with reminder config), view submission overview by organization with due dates
  and status tracking, review submissions with status workflow (not_started → in_progress → submitted
  → under_review → approved/rejected). Includes submission history timeline. Uses step-up auth
  for sensitive operations.

- `src/features/reporting/reporting.mutations.ts` (330 lines) - Reporting management mutations.
  createReportingCycle (with step-up auth), createReportingTask (auto-creates submissions for
  matching orgs, schedules reminder notifications via notification scheduler),
  updateReportingSubmission (status workflow with org-scoped authorization, history logging).
  All mutations require global admin and step-up auth for cycle/task creation.
  Feature-gated with `sin_admin_reporting` and `sin_reporting`.

- `src/features/reporting/reporting.queries.ts` (229 lines) - Reporting data queries.
  listReportingCycles, listReportingTasks (with org filtering), listReportingSubmissions,
  listReportingOverview (joined view of submissions + tasks + cycles + orgs with org-scoped access),
  listReportingSubmissionHistory. Feature-gated with `sin_reporting`.

- `src/features/reporting/reporting.schemas.ts` (58 lines) - Zod schemas for reporting.
  Cycle statuses (upcoming/active/closed/archived), submission statuses (not_started through approved),
  organization types. Input schemas for cycle/task creation and submission updates.

---

## Reports (Analytics)

- `src/features/reports/reports.mutations.ts` (359 lines) - Saved report and export mutations.
  createSavedReport, updateSavedReport, deleteSavedReport (owner or admin only),
  exportReport (CSV/JSON with step-up auth, PII field-level ACL based on permissions/roles,
  export history logging). Sensitive fields (email, phone, DOB, emergency contact) masked
  for non-admin/non-PII-permitted users. Feature-gated with `sin_analytics`.

- `src/features/reports/reports.queries.ts` (36 lines) - Saved reports queries.
  listSavedReports (with org filtering, includes org-wide reports). Feature-gated with `sin_analytics`.
