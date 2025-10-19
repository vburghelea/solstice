# i18n Feature Structure Implementation

## Overview

This document outlines the comprehensive internationalization (i18n) namespace structure for the Roundup Games platform, based on actual feature analysis and string extraction from the codebase.

## Implemented Namespaces

### ✅ Completed (with actual extracted strings)

1. **common** - Shared UI elements, buttons, status messages
2. **auth** - Login, signup, password reset, security features
3. **navigation** - Navigation menus, breadcrumbs, links
4. **admin** - Admin dashboard, user management, insights, feature flags
5. **campaigns** - Campaign creation, management, participation
6. **games** - Game listings, details, reviews, applications, invitations
7. **teams** - Team creation and management
8. **player** - Player dashboard and profile
9. **forms** - Form validation and input labels
10. **errors** - Error messages and error pages
11. **membership** - Membership plans, billing, subscriptions
12. **settings** - User settings, preferences, account management
13. **profile** - User profile management and preferences
14. **events** - Event creation, management, attendance

### 🚧 Pending Implementation

The following namespaces need to be created with actual string extraction:

1. **collaboration** - Collaboration tools and features
2. **consent** - Cookie consent, privacy agreements
3. **game-systems** - Game system management and rules
4. **gm** - Game master tools and features
5. **inbox** - Messaging and notifications
6. **layouts** - Layout components and structure
7. **members** - Member management and profiles
8. **ops** - Operations and system management
9. **reviews** - Game and campaign reviews
10. **roles** - Role management and permissions
11. **social** - Social features and interactions

## String Extraction Examples

### Admin Feature (✅ Complete)

- Navigation: "Insights", "Users", "Security", "Feature flags"
- User Management: "Assign Role", "Export CSV", "Permanently Delete User"
- Feature Flags: "Enable", "Disable", "Clear override"
- Security Center: "Enable control", "Critical safeguards"
- Events Review: "Approve", "Reject", "Events Awaiting Approval"

### Campaigns Feature (✅ Complete)

- Form Sections: "Campaign overview", "Location", "Safety & table culture"
- Form Fields: "Campaign Name", "Game System Used", "Visibility"
- Visibility Options: "Public", "Connections & Teammates", "Private"
- Validation: "The campaign name is what most players see first..."
- Buttons: "Create Campaign", "Update Campaign"

### Games Feature (✅ Complete)

- Form Sections: "Session overview", "Participant requirements"
- Form Fields: "Game Session Name", "Expected Duration", "Safety Tool"
- Participants: "Approve", "Reject", "Application status updated"
- Invitations: "Invite Participants", "Search by name or email"
- Reviews: "Rate the GM", "Select up to 3 strengths"

## Implementation Pattern

For each namespace, follow this pattern:

1. **Extract strings from actual feature files**
   - Component files (\*.tsx)
   - Form files
   - Route files
   - Schema validation files

2. **Organize by component and category**
   - Forms (labels, placeholders, validation)
   - Buttons (actions, loading states)
   - Status (success, error, info messages)
   - Navigation (menus, breadcrumbs, links)

3. **Create locale file structure**

   ```json
   {
     "component_name": {
       "subcategory": {
         "label": "Human-readable string",
         "placeholder": "Input placeholder text",
         "validation": "Error messages"
       }
     }
   }
   ```

4. **Update i18n configuration**
   - Add to namespaces array in config.ts
   - Import locale file in i18n.ts
   - Add to resources object
   - Create corresponding hook

5. **Copy to public directory**
   - `cp -rf src/lib/i18n/locales/* public/locales/`

## Next Steps

1. **Priority Features** - Extract strings from high-traffic features:
   - membership (billing, plans)
   - events (creation, management)
   - profile (user management)
   - settings (app configuration)

2. **Secondary Features** - Complete remaining namespaces:
   - collaboration, consent, game-systems, gm, inbox
   - layouts, members, ops, reviews, roles
   - settings, social

3. **Translation Preparation** - Once all English strings are extracted:
   - Set up translation management system (Tolgee)
   - Begin translation process for German and Polish
   - Implement URL localization
   - Add language preference server functions

## File Structure

```
src/lib/i18n/
├── config.ts                 # Namespace configuration
├── i18n.ts                   # Main i18n setup
├── types.ts                  # Type definitions
├── locales/
│   └── en/
│       ├── admin.json       # ✅ Complete
│       ├── auth.json        # ✅ Complete
│       ├── campaigns.json   # ✅ Complete
│       ├── common.json      # ✅ Complete
│       ├── errors.json      # ✅ Complete
│       ├── forms.json       # ✅ Complete
│       ├── games.json       # ✅ Complete
│       ├── navigation.json  # ✅ Complete
│       ├── player.json      # ✅ Complete
│       ├── teams.json       # ✅ Complete
│       └── [pending].json   # 🚧 To be created
└── utils.ts                  # Helper functions
```

## Usage Example

### Text Translations

```typescript
// Import the hook
import { useGamesTranslation } from "~/hooks/useTypedTranslation";

// Use in component
const { t } = useGamesTranslation();

// Access translations
const label = t("form.fields.game_session_name.label");
const validation = t("form.validation.name_required");
```

### Date/Time Formatting

```typescript
// Import date formatting utilities
import { formatDistanceToNowLocalized, formatDateWithPattern, createDateFormatter } from "~/lib/i18n/utils";
import { useAdminTranslation } from "~/hooks/useTypedTranslation";

function MyComponent() {
  const { currentLanguage } = useAdminTranslation();
  const createdAt = new Date(2023, 0, 1);
  const eventDate = new Date(2023, 0, 1, 14, 30);

  // Basic relative time formatting
  return (
    <div>
      <p>Created {formatDistanceToNowLocalized(createdAt, currentLanguage)}</p>
      <p>Event starts {formatDateWithPattern(eventDate, "LONG", currentLanguage)}</p>
    </div>
  );
}

// Advanced usage - better for components with multiple dates
function EventList() {
  const { currentLanguage } = useAdminTranslation();
  const formatter = createDateFormatter(currentLanguage);

  return (
    <div>
      <p>Created: {formatter.formatWithPattern(createdAt, "MEDIUM")}</p>
      <p>Updated: {formatter.formatDistanceToNow(updatedAt)}</p>
      <p>Event: {formatter.format(eventDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
    </div>
  );
}
```

### Available Date Formatting Patterns

```typescript
import { DATE_FORMATS } from "~/lib/i18n/utils";

// Predefined platform patterns:
DATE_FORMATS.SHORT; // "Jan 1, 2023"
DATE_FORMATS.MEDIUM; // "January 1, 2023"
DATE_FORMATS.LONG; // "January 1, 2023 at 3:45 PM"
DATE_FORMATS.FULL; // "Sunday, January 1, 2023 at 3:45 PM"
DATE_FORMATS.TIME_ONLY; // "3:45 PM"
DATE_FORMATS.DATE_ONLY; // "2023-01-01"
DATE_FORMATS.DATETIME_SHORT; // "01/01/2023 15:45"
```

### Supported Languages for Date/Time Formatting

- **English** (default): "about 2 hours ago", "January 1, 2023"
- **German**: "vor etwa 2 Stunden", "Januar 1, 2023"
- **Polish**: "około 2 godziny temu", "stycznia 1, 2023"

The date formatting utilities automatically use the correct locale based on the current language setting, providing consistent localized date/time displays across the entire platform.

## Hydration Safety Patterns

### Server-Side Rendering (SSR) Considerations

When working with internationalization in a React SSR environment (TanStack Start), hydration mismatches can occur when server-rendered HTML differs from client-rendered HTML. This commonly happens with:

- **Translation readiness states** - `ready` flag from `useTranslation()`
- **Dynamic content states** - Loading/fetching states that change on mount
- **Client-only data** - User preferences, localStorage values
- **Dynamic class names** - Conditional styling based on client state

### ✅ Proven Hydration-Safe Patterns

#### 1. Translation Readiness Guard

**Use this pattern for all components with translations:**

```typescript
import { useTranslation } from "react-i18next";
import { useFeatureTranslation } from "~/hooks/useTypedTranslation";

function MyComponent() {
  const { t } = useFeatureTranslation();
  const { ready } = useTranslation("feature");

  // Always wait for translations to be ready
  if (!ready) {
    return (
      <div className="container mx-auto p-6">
        {/* Loading skeleton that matches final structure */}
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1>{t("title")}</h1>
      {/* Component content */}
    </div>
  );
}
```

#### 2. Client-Only State with `useEffect`

**Use this pattern for dynamic states that change on mount:**

```typescript
import React, { useState, useEffect } from "react";

function MyComponent() {
  // ❌ PROBLEMATIC - Causes hydration mismatch
  const isRefreshingBad = isFetchingData || isProcessingData;

  // ✅ CORRECT - Use client-only state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update state after mount to prevent hydration mismatch
  useEffect(() => {
    setIsRefreshing(isFetchingData || isProcessingData);
  }, [isFetchingData, isProcessingData]);

  if (isRefreshing) {
    return <LoadingBanner />;
  }

  return <MainContent />;
}
```

#### 3. Memoized Static Data

**Use this pattern for data that should be consistent between server/client:**

```typescript
import { useMemo } from "react";

function MyComponent() {
  // ✅ CORRECT - Static data memoized for consistency
  const staticData = useMemo(() => {
    return {
      countries: COUNTRIES,
      getCountryName: (code: string) => COUNTRY_MAP.get(code) ?? code,
    };
  }, []); // Empty dependency array = static

  // ❌ AVOID - Dynamic computations that change
  const dynamicData = computeExpensiveValue(props.data); // May differ server/client

  return <Component data={staticData} />;
}
```

#### 4. Consistent Initial States

**Use this pattern for loading/fetching states:**

```typescript
function MyComponent() {
  const { data, isFetching } = useQuery({
    queryKey: ["myData"],
    queryFn: fetchData,
    // ✅ Provide initial data to ensure consistent initial state
    initialData: [],
  });

  // ✅ Use isFetching safely with translation guard
  const { ready } = useTranslation("myFeature");
  if (!ready || isFetching) {
    return <LoadingSkeleton />;
  }

  return <DataDisplay data={data} />;
}
```

### Common Hydration Mistakes to Avoid

#### ❌ Direct Computation from Fetching States

```typescript
// BAD - Causes hydration mismatch
const isRefreshing = isFetchingTeams || isFetchingInvites;
```

#### ❌ Conditional Rendering Based on Client-Only Values

```typescript
// BAD - Different HTML on server vs client
{typeof window !== "undefined" && <ClientOnlyComponent />}
```

#### ❌ Dynamic Class Names Based on Loading States

```typescript
// BAD - Different CSS classes server vs client
<div className={isRefreshing ? "bg-red-50" : "bg-white"}>
```

### Debugging Hydration Issues

When you encounter hydration errors:

1. **Check the error details** - Look for className mismatches
2. **Identify dynamic states** - Find computed values that change on mount
3. **Add translation guards** - Ensure `ready` check is present
4. **Use client-only state** - Apply `useState` + `useEffect` pattern
5. **Test with skeleton loading** - Match final component structure

### Files with Proven Patterns

Reference these files for working examples:

- `src/routes/player/teams/index.tsx` - Client-only state pattern
- `src/routes/player/events/index.tsx` - Translation readiness guard
- `src/shared/hooks/useCountries.ts` - Memoized static data
- `src/shared/hooks/useTheme.tsx` - Client-only theme detection

This comprehensive structure ensures that all user-facing strings, date/time formatting, and SSR hydration patterns are properly organized, translatable, and type-safe across the entire Roundup Games platform.
