#!/bin/bash
# Generate all SIN requirement bundles

cd "$(dirname "$0")/.."

echo "Generating Bundle 1: Security, Auth & Access Control (6 requirements)..."
npx repomix@latest --include "\
src/lib/auth/**/*.ts,\
src/lib/security/**/*.ts,\
src/lib/pacer/**/*.ts,\
src/lib/env.server.ts,\
src/features/auth/**/*.ts,\
src/features/auth/**/*.tsx,\
src/features/roles/**/*.ts,\
src/features/roles/**/*.tsx,\
src/features/membership/**/*.ts,\
src/features/membership/**/*.tsx,\
src/db/schema/**/*.ts,\
src/db/connections.ts,\
src/routes/api/auth/**/*.ts,\
src/routes/auth/**/*.tsx,\
src/routes/dashboard/route.tsx,\
src/routes/__root.tsx,\
netlify/edge-functions/**/*.ts,\
repomix-bundles/REQUIREMENTS-BUNDLE-1.md" \
--output repomix-bundles/bundle-1-security.xml

echo ""
echo "Generating Bundle 2: Data Collection, Forms & Validation (6 requirements)..."
npx repomix@latest --include "\
src/components/form-fields/FormSubmitButton.tsx,\
src/components/form-fields/ValidatedCheckbox.tsx,\
src/components/form-fields/ValidatedColorPicker.tsx,\
src/components/form-fields/ValidatedCombobox.tsx,\
src/components/form-fields/ValidatedDatePicker.tsx,\
src/components/form-fields/ValidatedFileUpload.tsx,\
src/components/form-fields/ValidatedInput.tsx,\
src/components/form-fields/ValidatedPhoneInput.tsx,\
src/components/form-fields/ValidatedSelect.tsx,\
src/lib/form.ts,\
src/lib/db/**/*.ts,\
src/lib/utils/**/*.ts,\
src/db/**/*.ts,\
src/features/events/events.*.ts,\
src/features/events/index.ts,\
src/features/events/components/**/*.tsx,\
src/features/events/utils/**/*.ts,\
src/features/teams/teams.schemas.ts,\
src/features/teams/teams.mutations.ts,\
src/features/teams/teams.queries.ts,\
src/features/profile/profile.schemas.ts,\
src/features/profile/profile.mutations.ts,\
src/features/profile/profile.queries.ts,\
src/features/profile/profile.types.ts,\
drizzle.config.ts,\
repomix-bundles/REQUIREMENTS-BUNDLE-2.md" \
--output repomix-bundles/bundle-2-data.xml

echo ""
echo "Generating Bundle 3: Dashboard, UI/UX, Reporting & Onboarding (13 requirements)..."
npx repomix@latest --include "\
src/components/ui/admin-sidebar.tsx,\
src/components/ui/alert.tsx,\
src/components/ui/avatar.tsx,\
src/components/ui/badge.tsx,\
src/components/ui/breadcrumbs.tsx,\
src/components/ui/button.tsx,\
src/components/ui/card.tsx,\
src/components/ui/checkbox.tsx,\
src/components/ui/data-state.tsx,\
src/components/ui/data-table.tsx,\
src/components/ui/dialog.tsx,\
src/components/ui/dropdown-menu.tsx,\
src/components/ui/icons.tsx,\
src/components/ui/input.tsx,\
src/components/ui/label.tsx,\
src/components/ui/logo.tsx,\
src/components/ui/select.tsx,\
src/components/ui/table.tsx,\
src/components/ui/tabs.tsx,\
src/components/ui/TypedLink.tsx,\
src/shared/**/*.ts,\
src/shared/**/*.tsx,\
src/features/layouts/**/*.ts,\
src/features/layouts/**/*.tsx,\
src/features/dashboard/**/*.tsx,\
src/features/profile/components/**/*.tsx,\
src/features/profile/hooks/**/*.ts,\
src/features/events/events.queries.ts,\
src/features/events/events.types.ts,\
src/features/membership/membership.queries.ts,\
src/features/membership/membership.types.ts,\
src/features/membership/components/**/*.tsx,\
src/features/members/**/*.ts,\
src/lib/utils/csv-export.ts,\
src/lib/email/**/*.ts,\
src/routes/onboarding/**/*.tsx,\
src/routes/__root.tsx,\
src/routes/index.tsx,\
src/routes/dashboard/index.tsx,\
src/routes/dashboard/reports.tsx,\
src/routes/dashboard/members.tsx,\
src/routes/dashboard/membership.tsx,\
repomix-bundles/REQUIREMENTS-BUNDLE-3.md" \
--output repomix-bundles/bundle-3-ui-reporting.xml

echo ""
echo "Done! Generated bundles:"
ls -lh repomix-bundles/*.xml 2>/dev/null || echo "No XML files found"
echo ""
echo "Requirements per bundle:"
echo "  Bundle 1: 6 requirements (SEC-AGG-001-004, DM-AGG-003, UI-AGG-001)"
echo "  Bundle 2: 6 requirements (DM-AGG-001-002, DM-AGG-004-006, RP-AGG-001)"
echo "  Bundle 3: 13 requirements (RP-AGG-002-005, UI-AGG-002-007, TO-AGG-001-003)"
echo "  Total: 25 requirements"
