# Austin's Notes - Training & Onboarding Requirements (TO-AGG)

## Status Summary

| Req ID     | Title                          | Status    | Notes                              |
| ---------- | ------------------------------ | --------- | ---------------------------------- |
| TO-AGG-001 | Template Support & Integration | ✅ Comply | Templates hub with context filters |
| TO-AGG-002 | Guided Learning & Walkthroughs | ✅ Comply | Tutorial framework, guided tours   |
| TO-AGG-003 | Reference Materials & Support  | ✅ Comply | Help center with guides + FAQ      |

## What's Built

- **Templates hub**: Centralized with context filters (forms, imports, reporting)
- **Contextual access**: Links from forms/imports/reporting to relevant templates
- **Tutorial framework**: Per-user progress tracking, guided tours
- **Help center**: Searchable guides + FAQ by category/keyword
- **Support requests**: In-app ticket submission with status tracking

## Plan: UX Interviews to Refine

All training/onboarding content will be upgraded based on UX interviews with viaSport:

- Refine guided tours to match actual user workflows
- Update help content to address real PSO pain points
- Tailor templates to viaSport's specific data formats
- Add FAQ entries based on common questions during onboarding

**Framing**: "Infrastructure is built; content will be co-developed with viaSport to ensure relevance."

## Evidence Available

- Templates hub: `src/features/templates/components/template-hub.tsx`
- Tutorial panel: `src/features/tutorials/components/tutorial-panel.tsx`
- Guided tour: `src/features/tutorials/components/guided-tour.tsx`
- Help center: `src/features/help/components/help-center.tsx`
