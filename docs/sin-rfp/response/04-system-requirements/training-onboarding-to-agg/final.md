# System Requirements: Training and Onboarding (TO-AGG)

## Compliance Summary

| Req ID     | Title                            | Status | Built Today                         | Remaining Scope                  |
| ---------- | -------------------------------- | ------ | ----------------------------------- | -------------------------------- |
| TO-AGG-001 | Template Support and Integration | Built  | Templates hub with contextual links | viaSport templates content       |
| TO-AGG-002 | Guided Learning and Walkthroughs | Built  | Guided tours and walkthroughs       | Final content review (TBD)       |
| TO-AGG-003 | Reference Materials and Support  | Built  | Help center with guides and FAQ     | Content refinement with viaSport |

## TO-AGG-001: Template Support and Integration

**Requirement:**

> The system shall provide a centralized templates tab and offer contextual template access directly from each data entry item to guide users through required formats.

**Acceptance Criteria:**

> Users can easily locate and access the correct template when needed.

**How We Meet It:**

- Templates hub centralizes all templates in one location.
- Contextual links surface templates from forms, imports, and reporting.
- Templates are tagged by context for search and filtering.

**Built Today:**

- Templates hub UI with context filters.
- Admin panel to manage global and organization templates.
- Contextual links on form, reporting, and import screens.

**Remaining Scope:**

- viaSport specific templates and sample data (TBD).

**viaSport Dependencies:**

- Template content and formatting requirements.

**Approach:**
Collect templates during Discovery and load into the hub prior to UAT.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/TO-AGG-001-templates-20251228-1953.png`
- `docs/sin-rfp/review-plans/evidence/TO-AGG-001-templates-admin-20251228-1953.png`

## TO-AGG-002: Guided Learning and Walkthroughs

**Requirement:**

> The system shall offer onboarding and data upload tutorials to help users navigate key processes, especially during their first-time use.

**Acceptance Criteria:**

> Users can complete tasks independently with support from walkthroughs.

**How We Meet It:**

- Guided walkthroughs highlight key UI elements.
- Tutorials cover onboarding and data upload workflows.
- Progress tracking allows users to resume or restart.

**Built Today:**

- Guided tours for onboarding and data upload.
- Tutorial panel with progress tracking.
- Contextual launch points on portal pages.

**Remaining Scope:**

- Final content review with viaSport stakeholders (TBD).

**Approach:**
Refine tutorial copy and steps during Discovery and UAT.

**Evidence:**

- `src/features/tutorials/tutorials.config.ts`
- `src/features/tutorials/components/tutorial-panel.tsx`

## TO-AGG-003: Reference Materials and Support

**Requirement:**

> The system shall provide categorized guides and a frequently asked questions (FAQ) section to help users resolve issues and understand system functionality.

**Acceptance Criteria:**

> Users can find accurate answers and instructional material without needing direct support.

**How We Meet It:**

- Help center organizes guides by role and category.
- FAQ entries surface common questions.
- Search filters content by keyword.

**Built Today:**

- Help center with searchable guides and FAQ.
- Role-based content filtering.
- In-app support requests for escalation.

**Remaining Scope:**

- Content refinement based on viaSport terminology (TBD).

**Approach:**
Review help content during Discovery and incorporate viaSport feedback.

**Evidence:**

- `docs/sin-rfp/review-plans/evidence/TO-AGG-003-help-center-20251228-1953.png`
