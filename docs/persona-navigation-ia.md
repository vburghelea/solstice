# Persona Navigation Information Architecture

This document captures the navigation information architecture for the phase 0 persona scaffolding work. Each map prioritizes mobile use first, then indicates desktop enhancements. All actions assume the shared layout and role switcher established in phase 0.

## Visitor Namespace (`/visit`)

- **Primary actions (mobile-first)**
  - Hero CTA: "Preview upcoming stories" (anchors to featured stories)
  - Secondary CTA cluster: "RSVP Interest", "Browse public events"
  - Persistent tab bar: "Highlights", "Stories", "Schedule"
- **Secondary actions**
  - Feedback trigger: "Tell us what you want to see"
  - Deep links to onboarding content and FAQ
  - Footer links: Accessibility statement, Community guidelines
- **Desktop enhancements**
  - Left rail hero summary with contextual CTA
  - Sticky right rail for RSVP interest form and newsletter opt-in

## Player Namespace (`/player`)

- **Primary actions (mobile-first)**
  - Hero CTA: "Review today's agenda"
  - Quick actions row: "Respond to invites", "Check-in", "Update availability"
  - Tab set: "Dashboard", "Sessions", "Community"
- **Secondary actions**
  - Inline announcement banner linking to privacy center
  - Support shortcut to help center chat
  - Profile completeness progress indicator linking to settings
- **Desktop enhancements**
  - Two-column dashboard with agenda feed and activity insights
  - Persistent quick actions dock on the right rail

## Event Operations Namespace (`/ops`)

- **Primary actions (mobile-first)**
  - Hero CTA: "Monitor today's events"
  - Operations nav: "Overview", "Staffing", "Logistics"
  - Alert surface for escalations with acknowledge/dismiss controls
- **Secondary actions**
  - Export menu with CSV + ICS options
  - Link to staffing playbook and vendor directory
  - Analytics drill-down cards for funnel stages
- **Desktop enhancements**
  - Three-column layout: KPIs, task board, staffing queue
  - Global search for events and staff

## Game Master Namespace (`/gm`)

- **Primary actions (mobile-first)**
  - Hero CTA: "Prep your next session"
  - Campaign switcher carousel
  - Workspace tabs: "Campaigns", "Feedback", "Assets"
- **Secondary actions**
  - Safety tools shortcut
  - Feedback summary card linking to backlog
  - Collaboration invite entry point
- **Desktop enhancements**
  - Split view for session notes and asset library
  - Timeline view for campaign milestones

## Platform Admin Namespace (`/admin`)

- **Primary actions (mobile-first)**
  - Hero CTA: "Review platform health"
  - Governance nav: "Insights", "Users", "Flags"
  - Alert center with severity filters
- **Secondary actions**
  - Compliance export shortcuts (PDF, CSV)
  - System changelog link
  - Support escalation contact card
- **Desktop enhancements**
  - Quad-panel dashboard with KPIs, incident log, approvals, and feature flag queue
  - Multi-select toolbar for bulk user actions
