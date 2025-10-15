# I18n Migration Strategy

## Phase 1: Discovery & Categorization (Automated)

### 1.1 String Pattern Detection

```javascript
// Target patterns:
- JSX text content: <Button>Save Changes</Button>
- String literals: const title = "Welcome to Roundup Games"
- Template literals with variables: `Welcome ${user.name}`
- Form labels/placeholders in schema files
- Error messages in validation schemas
- Button text and aria-labels
- Status messages and notifications
```

### 1.2 Feature-Based Organization

- Map strings to `src/features/[feature]/` structure
- Use existing namespace system (admin, auth, campaigns, etc.)
- Create translation keys following `feature.component.type.key` pattern

### 1.3 Conflict Detection

- Identify strings already in translation files
- Flag potential duplicates for manual review
- Maintain mapping of original → translation key

## Phase 2: Translation Key Generation (Automated)

### 2.1 Key Naming Convention

```javascript
// Examples:
"Save Changes" → "common.buttons.save"
"Create New Event" → "events.create_form.title"
"Event name is required" → "events.validation.name_required"
"Players approved successfully" → "events.messages.players_approved"
```

### 2.2 Existing Translation Matching

- Cross-reference with existing 1,599+ keys
- Leverage manual translations already completed
- Flag only truly new strings for translation

## Phase 3: Code Transformation (Automated)

### 3.1 Component Updates

```typescript
// Before:
const CreateEventButton = () => (
  <Button>Create New Event</Button>
);

// After:
const CreateEventButton = () => {
  const { t } = useEventsTranslation();
  return <Button>{t('create_form.title')}</Button>;
};
```

### 3.2 Schema Updates

```typescript
// Before:
const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
});

// After:
const eventSchema = z.object({
  name: z.string().min(1, () => t("events.validation.name_required")),
});
```

### 3.3 Hook Integration

- Auto-import appropriate namespace hooks
- Add translation context where needed
- Maintain existing functionality

## Phase 4: Validation & Testing (Automated + Manual)

### 4.1 Automated Validation

- TypeScript compilation check
- Translation key existence validation
- Import statement verification

### 4.2 Manual Review Areas

- Context-sensitive strings that may need different translations
- Dynamic content with variables
- Accessibility labels and descriptions

## Implementation Plan

### Step 1: Enhanced Extraction Script

```bash
# New script combining extraction + replacement
pnpm i18n:auto-migrate --dry-run  # Preview changes
pnpm i18n:auto-migrate --apply     # Apply changes
```

### Step 2: Progressive Migration

1. Start with low-risk features (forms, buttons)
2. Progress to complex components (dashboards, admin)
3. Handle edge cases manually

### Step 3: Quality Assurance

1. Run `pnpm i18n:generate-types` after changes
2. Validate all translation keys exist
3. Test language switching functionality
4. Review UI layout for text expansion

## Safety Features

### Backup & Restore

- Git commit before major changes
- File-level backups for critical components
- Rollback capability for failed migrations

### Incremental Processing

- Process one feature at a time
- Validate after each feature migration
- Stop on critical errors

### Manual Override

- Flag complex cases for manual review
- Maintain human oversight for important UI elements
- Allow customization of auto-generated keys

## Expected Outcomes

### Automated Coverage

- 80% of hardcoded strings migrated automatically
- Translation keys matched to existing 1,599+ keys
- TypeScript types generated automatically

### Manual Review Required

- 20% complex/context-sensitive strings
- Dynamic content with business logic
- Accessibility and SEO-critical text

### Timeline

- Phase 1-2: 1-2 days (automated extraction and categorization)
- Phase 3: 2-3 days (code transformation)
- Phase 4: 1-2 days (validation and manual review)

## Integration with Existing Tools

### Leverage Current Infrastructure

- Use existing `i18next-parser.config.js` configuration
- Integrate with `scripts/extract-translations.js`
- Build on `pnpm i18n:generate-types` workflow

### Extend Existing Scripts

- Enhance extraction script with replacement logic
- Add conflict detection with existing translations
- Maintain compatibility with current workflow
