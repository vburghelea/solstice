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
   - `cp -rf src/lib/i18n/locales/ public/`

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

```typescript
// Import the hook
import { useGamesTranslation } from "~/hooks/useTypedTranslation";

// Use in component
const { t } = useGamesTranslation();

// Access translations
const label = t("form.fields.game_session_name.label");
const validation = t("form.validation.name_required");
```

This comprehensive structure ensures that all user-facing strings are properly organized, translatable, and type-safe across the entire Roundup Games platform.
