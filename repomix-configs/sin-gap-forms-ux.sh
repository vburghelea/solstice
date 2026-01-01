#!/usr/bin/env bash
# SIN RFP Gap Closure - Forms & UX Bundle
#
# Covers:
# - DM-AGG-001: Form submission tracking + edit flow
# - DM-AGG-003: Data catalog verification
# - Guided walkthroughs (tutorials)
# - Global search (command palette)
# - SIN dashboard + forms routes
#
# Estimated tokens: ~53k
#
# GPT 5.2 Pro Prompt (paste after the XML):
# ─────────────────────────────────────────
# You are reviewing a TanStack Start + React application for SIN RFP compliance.
# Focus on the forms, tutorials, and search features.
#
# Context:
# - WORKLOG-gap-closure.md contains the current gap status and session logs
# - Evidence files in docs/sin-rfp/review-plans/evidence/ show verification results
# - viasport.ts defines feature flags for this tenant
#
# Tasks:
# 1. Review DM-AGG-001 (form submission tracking) - verify the submission flow
#    in forms.tsx, forms/$formId.tsx, and submissions/$submissionId.tsx handles:
#    - Form assignment display
#    - Submission creation with version tracking
#    - File attachment with legal-hold checks
#    - Submission history/audit trail
#
# 2. Review guided walkthroughs - verify tutorials.config.ts and guided-tour.tsx
#    provide contextual onboarding with spotlight overlays and step progression.
#
# 3. Review global search - verify search.queries.ts provides unified search
#    across forms, submissions, and organizations with proper access control.
#
# 4. Identify any remaining gaps or issues that need attention before sign-off.
#
# Output a structured report with: findings, recommendations, and a pass/fail
# assessment for each gap area.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "Generating SIN gap closure bundle (Forms & UX)..."
npx repomix@latest --config ./repomix-configs/sin-gap-forms-ux.json

echo ""
echo "Bundle created: repomix-configs/outputs/sin-gap-forms-ux.xml"
echo ""
echo "Token count:"
npx repomix@latest --config ./repomix-configs/sin-gap-forms-ux.json --token-count-tree 0 2>/dev/null | grep "Total Tokens"
