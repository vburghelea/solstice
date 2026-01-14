# TO-AGG-002: Guided Learning and Walkthroughs

## Status

**Finalization Scope** - To be completed during Discovery/Design phase with viaSport input

## Requirement Summary

From RFP System Requirements Addendum:

> TO-AGG-002: The system should provide guided learning features, such as interactive walkthroughs, tooltips, or step-by-step tutorials, to help users navigate new features or complex tasks.

## Current State

The evaluation environment (sin-uat) includes:

- ✅ Help center with documentation
- ✅ Contextual help links throughout the application
- ✅ Role-based navigation (different views per role)
- ❌ Interactive onboarding overlay for first-time users
- ❌ Step-by-step guided walkthroughs for complex tasks

## Proposed Implementation

### Minimal Viable Implementation (Path A - Recommended)

Implement a lightweight onboarding system with two components:

#### 1. First-Login Getting Started Checklist

- Display on dashboard for new users
- Role-specific checklist items:
  - **Reporter**: Complete profile → View assigned tasks → Submit first report
  - **Admin**: Set up organization → Configure forms → Invite team members
  - **PSO Admin**: Review reporting cycles → Assign tasks → Export data
- Checklist completion persisted per user
- Can be dismissed and accessed later from help menu

#### 2. Interactive Walkthrough Overlays

- Triggered on first visit to key pages:
  - Form Builder (admin)
  - Import Wizard (admin)
  - Analytics Explore (all users with access)
  - Reporting Cycles (admin)
- Uses step-by-step overlays highlighting UI elements
- "Skip" and "Don't show again" options

### Technical Approach

**Library**: Use [react-joyride](https://react-joyride.com/) or [driver.js](https://driverjs.com/)

- Both support step-by-step tours with highlighting
- Accessible (WCAG 2.1 compliant)
- Customizable styling to match viaSport brand

**State Management**:

- Store completion state in user preferences (database)
- Check preference on page load to determine if tour should display
- API endpoint: `POST /api/users/preferences/onboarding`

### Dependencies on viaSport

| Input Needed       | Purpose                                | Timing             |
| :----------------- | :------------------------------------- | :----------------- |
| Role definitions   | Determine which tours each role sees   | Discovery Week 1-2 |
| Key tasks per role | Define checklist items                 | Discovery Week 2-3 |
| Terminology        | Ensure tour copy uses correct language | Discovery Week 3-4 |
| Priority workflows | Which pages get walkthroughs first     | Discovery Week 4-5 |

### Definition of Done

- [ ] Getting Started checklist appears for new users on dashboard
- [ ] Checklist items are role-specific
- [ ] At least 3 key pages have interactive walkthroughs
- [ ] Completion tracking visible in user analytics
- [ ] Tours can be re-triggered from help menu
- [ ] All tour content reviewed by viaSport
- [ ] Accessibility tested (screen reader, keyboard navigation)

## Effort Estimate

| Task                                       | Effort         |
| :----------------------------------------- | :------------- |
| Library integration and base setup         | 2-3 days       |
| Getting Started checklist component        | 2-3 days       |
| 4 page-specific walkthroughs               | 4-5 days       |
| User preference API and persistence        | 1-2 days       |
| Content writing and review (with viaSport) | 3-4 days       |
| Accessibility testing and fixes            | 1-2 days       |
| **Total**                                  | **13-19 days** |

## Delivery Timing

**Phase**: Training and Onboarding (Weeks 12-14 of project timeline)

This feature is scheduled after core functionality is complete to ensure:

1. UI is stable (tours don't break with UI changes)
2. viaSport has used the system and can provide informed input on content
3. Content reflects final terminology and workflows

## Evidence Approach for Evaluation

For the RFP evaluation, we commit to this implementation with:

- Design approach documented above
- Library selection made (react-joyride or driver.js)
- Delivery timing confirmed (Training phase)
- Definition of done established

During evaluation, reviewers can:

- Review this ticket as evidence of planned implementation
- Note the existing help infrastructure in sin-uat
- Understand the finalization depends on viaSport input

## References

- RFP Section: System Requirements Addendum - Training and Onboarding
- Related Requirements: TO-AGG-001 (Template Support), TO-AGG-003 (Reference Materials)
- Technical Libraries: [react-joyride](https://react-joyride.com/), [driver.js](https://driverjs.com/)
