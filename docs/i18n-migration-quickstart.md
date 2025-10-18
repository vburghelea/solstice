# I18n Migration Quickstart Guide

## Overview

The automated i18n migration script can dramatically accelerate the process of replacing hardcoded strings with translation keys. This guide shows you how to use it safely and effectively.

## Prerequisites

- Ensure your i18n infrastructure is set up (completed in your project)
- Run `pnpm i18n:generate-types` to ensure latest types are available
- Commit any current changes before running migration

## Available Commands

```bash
# Test the migration on sample files (recommended first)
pnpm i18n:migrate:test

# Preview what changes would be made to your entire codebase
pnpm i18n:migrate:dry-run

# Actually apply the migration changes
pnpm i18n:migrate:apply

# Verbose output for debugging
pnpm i18n:migrate:dry-run --verbose
```

## Migration Strategy

### Phase 1: Testing (5 minutes)

```bash
# 1. Test on sample files
pnpm i18n:migrate:test

# 2. Review the output and ensure it looks correct
# 3. Check that existing translations are being reused
```

### Phase 2: Preview Changes (10 minutes)

```bash
# 1. Run dry-run on full codebase
pnpm i18n:migrate:dry-run --verbose

# 2. Review the report:
#    - Files with changes
#    - Sample transformations
#    - Number of strings replaced
#    - Any errors detected
```

### Phase 3: Apply Changes (30-60 minutes)

```bash
# 1. Commit your current state
git add .
git commit -m "Before i18n migration"

# 2. Apply the migration
pnpm i18n:migrate:apply

# 3. Review changes
git status
git diff

# 4. Test the application
pnpm dev
# Test language switching functionality

# 5. Fix any issues manually
#    - Import statement conflicts
#    - Complex strings that need manual review
#    - Type errors

# 6. Run type checking
pnpm check-types

# 7. Generate final types
pnpm i18n:generate-types

# 8. Commit the changes
git add .
git commit -m "feat: automated i18n migration"
```

## What the Script Does

### ✅ Automatic Transformations

1. **String Detection**: Finds hardcoded strings in:
   - JSX text content: `<Button>Save Changes</Button>`
   - String literals: `const title = "Welcome"`
   - Form labels/placeholders
   - Button text
   - Error messages

2. **Translation Key Generation**:
   - Matches existing translations from your JSON files
   - Generates new keys following feature-based naming
   - Example: `"Create New Event"` → `events.create_form.title`

3. **Code Transformation**:
   - Adds appropriate translation hook imports
   - Replaces strings with `t()` function calls
   - Maintains existing functionality

4. **Safety Features**:
   - Creates backup files (.backup)
   - Preserves existing translations
   - Skips already internationalized code

### ⚠️ Manual Review Required

The script will flag these for manual review:

- Complex template literals with variables
- Technical strings (variable names, URLs)
- Very short strings (< 3 characters)
- Strings in test files
- Already internationalized code

## Expected Results

Based on your project structure:

- **Files processed**: 100-200 TypeScript/React files
- **Strings replaced**: 300-500 hardcoded strings
- **Translation keys reused**: 200+ from existing 1,599 keys
- **New keys generated**: 100-200 new translation keys
- **Imports added**: 50-100 hook imports

## Example Transformations

### Before:

```typescript
export const CreateEventButton = () => (
  <Button>Create New Event</Button>
);

export const EventForm = () => {
  return (
    <form>
      <label>Event Name</label>
      <input placeholder="Enter your event name" />
      <button>Submit Event</button>
    </form>
  );
};
```

### After:

```typescript
import { useEventsTranslation } from "~/hooks/useTypedTranslation";

export const CreateEventButton = () => {
  const { t } = useEventsTranslation();
  return <Button>{t("create_form.title")}</Button>;
};

export const EventForm = () => {
  const { t } = useEventsTranslation();
  return (
    <form>
      <label>{t("form.fields.name.label")}</label>
      <input placeholder={t("form.fields.name.placeholder")} />
      <button>{t("form.buttons.submit")}</button>
    </form>
  );
};
```

## Troubleshooting

### Common Issues

1. **Import Conflicts**:
   - Error: Multiple imports of the same hook
   - Fix: Manually resolve duplicate imports

2. **Type Errors**:
   - Error: `t()` function not available
   - Fix: Ensure proper hook is imported and used

3. **Missing Translation Keys**:
   - Error: Translation key doesn't exist
   - Fix: Run `pnpm i18n:extract` to add missing keys

4. **Incorrect Replacements**:
   - Issue: Technical strings replaced (variable names, etc.)
   - Fix: Manually revert and add to exclude patterns

### Recovery

If something goes wrong:

```bash
# Restore from backups
find src -name "*.backup" -exec sh -c 'mv "$1" "${1%.backup}"' _ {} \;

# Or use git to reset
git reset --hard HEAD~1
```

## Post-Migration Tasks

1. **Test Language Switching**:
   - Verify LanguageSwitcher component works
   - Test that all UI elements update correctly

2. **Review Translation Quality**:
   - Check `src/lib/i18n/locales/en/` for new keys
   - Ensure generated keys make sense
   - Add missing translations for German/Polish

3. **Update Documentation**:
   - Document any new patterns established
   - Update developer guidelines

4. **Run Full Test Suite**:
   ```bash
   pnpm test
   pnpm test:e2e
   ```

## Best Practices

1. **Commit Often**: Create checkpoints during the migration
2. **Test Incrementally**: Test features as you migrate them
3. **Review Changes**: Don't blindly accept all automated changes
4. **Preserve Context**: Some strings need different translations based on context

## Next Steps

After migration:

1. Focus on completing missing translations
2. Implement URL localization
3. Add hreflang tags for SEO
4. Set up CI/CD for translation management

This migration will get you 80% of the way to full internationalization with minimal manual effort!
