# Bundle 3: Dashboard, UI/UX, Reporting & Onboarding

> **Your Task:** Implement or enhance the 13 requirements below for the viaSport Strength in Numbers (SIN) system.

---

## Requirements You Must Address

### REPORTING

#### RP-AGG-002: Reporting Information Management

**Description:** The system shall manage metadata related to reporting including but not limited to contribution agreements, NCCP, contact details, fiscal periods, organization profiles, and delegated access rights.

**Acceptance Criteria:** Users can update relevant metadata and access reporting features accordingly.

**Current Status:** 35% complete

- Events have metadata (JSONB fields)
- Team/membership data tracked

**Gaps to Implement:**

- [ ] Reporting metadata schema (fiscal periods, agreements, NCCP)
- [ ] Organization profile management
- [ ] Delegated access rights for reporting
- [ ] Metadata update UI for admins

---

#### RP-AGG-003: Reporting Flow & Support

**Description:** The system shall support automated reporting reminders, allow users to track data resubmissions, and visualize submitted data through dashboards.

**Acceptance Criteria:** Users are reminded, track changes, and view data in a dashboard format.

**Current Status:** 40% complete

- Dashboard exists (MemberDashboard.tsx)
- Email infrastructure exists (SendGrid)
- No automated reminders

**Gaps to Implement:**

- [ ] Reporting deadline tracking
- [ ] Automated email reminders (upcoming deadlines, overdue)
- [ ] Resubmission tracking with history
- [ ] Submission status dashboard (pending, submitted, approved)

---

#### RP-AGG-004: Reporting Configuration & Collection

**Description:** The system shall allow system administrators to configure customizable reporting forms, define required fields, display files for users to read, edit, delete, and download.

**Acceptance Criteria:** System admin can configure reporting information and forms.

**Current Status:** 10% complete

- Basic form components exist
- No admin form configuration UI

**Gaps to Implement:**

- [ ] Admin form builder UI
- [ ] Required field configuration per form
- [ ] File attachment management (view, edit, delete, download)
- [ ] Form versioning (track changes to form structure)

---

#### RP-AGG-005: Self-Service Analytics & Data Export

**Description:** Enable authorized users to build ad-hoc charts, pivot tables, and export raw or aggregated datasets in CSV, Excel, or JSON (optional) without developer intervention.

**Acceptance Criteria:** User builds a custom chart and exports underlying dataset to CSVs; export respects field-level access rules.

**Current Status:** 5% complete

- CSV export utility exists
- No chart builder or analytics UI

**Gaps to Implement:**

- [ ] Chart builder UI (bar, line, pie charts)
- [ ] Pivot table functionality
- [ ] Data aggregation queries
- [ ] Export with field-level access control
- [ ] Save/share custom reports

---

### USER INTERFACE

#### UI-AGG-002: Personalized Dashboard

**Description:** The system shall provide the capability to create personalized dashboard for each user role, summarizing relevant data, actions, and reporting progress.

**Acceptance Criteria:** Users can view personalized dashboards based on their roles.

**Current Status:** 70% complete

- MemberDashboard.tsx shows role-based content
- Admin routes exist

**Gaps to Implement:**

- [ ] Dashboard widget customization (add/remove/reorder)
- [ ] Role-specific default dashboards
- [ ] Reporting progress indicators
- [ ] Quick action shortcuts per role

---

#### UI-AGG-003: Responsive and Inclusive Design

**Description:** The system shall provide a responsive interface across devices and include accessibility features such as screen reader compatibility, color contrast tools, and etc.

**Acceptance Criteria:** System is functional on all devices and meets accessibility compliance.

**Current Status:** 80% complete

- Tailwind CSS responsive utilities
- shadcn/ui (accessibility-focused components)
- Mobile-friendly layouts

**Gaps to Implement:**

- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] Screen reader testing and fixes
- [ ] High contrast mode toggle
- [ ] Keyboard navigation improvements

---

#### UI-AGG-004: Communication: Task & Notification Management

**Description:** The system shall enable automated and customizable notification messages and task reminders that alert users of pending actions and updates, both on the platform and via email.

**Acceptance Criteria:** Users receive timely and relevant notifications and reminders.

**Current Status:** 25% complete

- Email sending via SendGrid exists
- No in-app notifications

**Gaps to Implement:**

- [ ] In-app notification system (bell icon, notification panel)
- [ ] Notification preferences (email, in-app, frequency)
- [ ] Task reminder scheduling
- [ ] Customizable notification templates
- [ ] Mark as read/unread functionality

---

#### UI-AGG-005: Content Navigation & Interaction

**Description:** The system shall allow users to efficiently locate and interact with information using robust categorization, search and filtering capabilities.

**Acceptance Criteria:** Users can retrieve accurate results through search and filter functions.

**Current Status:** 40% complete

- Data tables with basic filtering
- No global search

**Gaps to Implement:**

- [ ] Global search across all entities
- [ ] Advanced filtering UI (multiple criteria)
- [ ] Saved search/filter presets
- [ ] Search result highlighting
- [ ] Category-based navigation

---

#### UI-AGG-006: User Support & Feedback Mechanism

**Description:** The system shall enable users to submit support inquiries and feedback and allow administrators to respond through a managed interface.

**Acceptance Criteria:** Users can submit and receive responses to inquiries within the system.

**Current Status:** 0% complete

- No support system exists

**Gaps to Implement:**

- [ ] Support ticket submission form
- [ ] Ticket tracking (open, in progress, resolved)
- [ ] Admin ticket management interface
- [ ] Email notifications for ticket updates
- [ ] Feedback collection (ratings, comments)

---

#### UI-AGG-007: Consistent Visual Language & Branding

**Description:** The system shall maintain a consistent design style, color scheme, and branding across all modules.

**Acceptance Criteria:** All UI components follow a standardized visual style.

**Current Status:** 85% complete

- shadcn/ui component library
- Tailwind theme configuration
- Consistent styling across features

**Gaps to Implement:**

- [ ] Brand guidelines documentation
- [ ] Theme customization for white-labeling (if needed)
- [ ] Component style audit for consistency

---

### TRAINING & ONBOARDING

#### TO-AGG-001: Template Support & Integration

**Description:** The system shall provide a centralized templates tab and offer contextual template access directly from each data entry item to guide users through required formats.

**Acceptance Criteria:** Users can easily locate and access the correct template when needed.

**Current Status:** 0% complete

- No template system exists

**Gaps to Implement:**

- [ ] Templates library page
- [ ] Template categorization
- [ ] Contextual template suggestions in forms
- [ ] Template download/preview functionality

---

#### TO-AGG-002: Guided Learning & Walkthroughs

**Description:** The system shall offer onboarding and data upload tutorials to help users navigate key processes, especially during their first-time use.

**Acceptance Criteria:** Users can complete tasks independently with support from walkthroughs.

**Current Status:** 20% complete

- Onboarding route exists for profile completion
- No interactive tutorials

**Gaps to Implement:**

- [ ] Interactive walkthrough system (step-by-step tooltips)
- [ ] First-time user detection and onboarding flow
- [ ] Feature tours for key functionality
- [ ] Progress tracking for onboarding completion

---

#### TO-AGG-003: Reference Materials & Support

**Description:** The system shall provide categorized guides and a frequently asked questions (FAQ) section to help users resolve issues and understand system functionality.

**Acceptance Criteria:** Users can find accurate answers and instructional material without needing direct support.

**Current Status:** 0% complete

- No help system exists

**Gaps to Implement:**

- [ ] Help center / documentation pages
- [ ] FAQ section with search
- [ ] Categorized guides (by feature area)
- [ ] Contextual help links from UI

---

## Context: viaSport SIN Project

viaSport BC is replacing legacy systems with a modern platform for B.C. amateur sport data management.

**Key Context:**

- Users: Sport organizations, administrators, provincial staff
- Primary use: Data submission, reporting, analytics
- User experience is critical for adoption

## Existing Patterns to Follow

```typescript
// Dashboard pattern (see MemberDashboard.tsx)
export function Dashboard() {
  const { data } = useSuspenseQuery(queryOptions);
  return <Card>...</Card>;
}

// Email pattern (see sendgrid.ts)
await sendEmail({ to, subject, html });

// Query pattern (see members.queries.ts, events.queries.ts)
export const getData = createServerFn()
  .handler(async () => {
    return db.select().from(table);
  });
```
