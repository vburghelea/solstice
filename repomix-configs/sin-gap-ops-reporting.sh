#!/usr/bin/env bash
# SIN RFP Gap Closure - Operations & Reporting Bundle
#
# Covers:
# - RP-AGG-002/003: Reporting metadata + resubmission history
# - SEC-AGG-002: Security lockout evidence
# - Notifications delivery
# - Data quality monitoring
# - Retention enforcement (cron jobs)
# - Accessibility scanning
#
# Estimated tokens: ~47k
#
# GPT 5.2 Pro Prompt (paste after the XML):
# ─────────────────────────────────────────
# You are reviewing a TanStack Start + React application for SIN RFP compliance.
# Focus on reporting, notifications, security, and operational features.
#
# Context:
# - WORKLOG-gap-closure.md contains the current gap status and session logs
# - Evidence files in docs/sin-rfp/review-plans/evidence/ show verification results
# - viasport.ts defines feature flags for this tenant
#
# Tasks:
# 1. Review RP-AGG-002 (reporting metadata) - verify reporting.schemas.ts and
#    reporting.mutations.ts handle fiscal periods, agreements, and NCCP metadata
#    with proper validation and audit logging.
#
# 2. Review RP-AGG-003 (resubmission history) - verify reporting.tsx provides
#    submission version history with comparison and rollback capabilities.
#
# 3. Review SEC-AGG-002 (security lockout) - verify the lockout flow in
#    verify-sin-security-lockout.ts and check evidence in SECURITY-LOCKOUT*.md.
#
# 4. Review notifications - verify process-notifications.ts and notification-worker.ts
#    handle scheduled notifications with email delivery and in-app fallback.
#    Check NOTIFICATIONS-DELIVERY*.md for delivery evidence.
#
# 5. Review retention enforcement - verify enforce-retention.ts respects legal
#    holds and purges eligible records. Check RETENTION-JOB*.md for evidence.
#
# 6. Review data quality - verify data-quality.monitor.ts validates submissions
#    for completeness and consistency with proper error reporting.
#
# 7. Review accessibility - check run-sin-a11y-scan.ts methodology and note
#    any remaining WCAG 2.1 AA violations from the evidence.
#
# Output a structured report with: findings, recommendations, and a pass/fail
# assessment for each gap area.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "Generating SIN gap closure bundle (Operations & Reporting)..."
npx repomix@latest --config ./repomix-configs/sin-gap-ops-reporting.json

echo ""
echo "Bundle created: repomix-configs/outputs/sin-gap-ops-reporting.xml"
echo ""
echo "Token count:"
npx repomix@latest --config ./repomix-configs/sin-gap-ops-reporting.json --token-count-tree 0 2>/dev/null | grep "Total Tokens"
