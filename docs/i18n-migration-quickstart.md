# I18n Quickstart Guide

## Overview

The migration is the process of replacing hardcoded strings with translation keys. This guide shows you how to do it safely and effectively.

## Prerequisites

- Ensure your i18n infrastructure is set up (completed in your project)
- Run `pnpm i18n:generate-types` to ensure latest types are available
- Commit any current changes before running migration

## 🌐 **Localized Navigation Implementation - Updated Guide**

### **Rules for Implementing Localized Navigation Actions**

After completing the basic i18n migration, follow these rules for implementing localized navigation:

#### **1. Use LocalizedLink Components - MANDATORY**

**❌ AVOID - Regular Link components:**

```tsx
import { Link } from "@tanstack/react-router";

// Don't do this
<Link to="/player/games">My Games</Link>
<a href="/events">Events</a>
```

**✅ CORRECT - Use LocalizedLink variants:**

```tsx
import { LocalizedLink, LocalizedNavLink, LocalizedButtonLink } from "~/components/ui/LocalizedLink";

// Basic navigation
<LocalizedNavLink
  to="/player/games"
  translationKey="links.game_management.my_games"
  translationNamespace="navigation"
/>

// Button-style actions
<LocalizedButtonLink
  to="/player/games/create"
  translationKey="links.game_management.create_game"
  translationNamespace="navigation"
/>

// External links
<LocalizedExternalLink
  href="https://example.com"
  translationKey="links.external.continue_to_site"
  translationNamespace="navigation"
/>
```

#### **2. Programmatic Navigation Rules**

**❌ AVOID - Direct router navigation:**

```tsx
import { useNavigate } from "@tanstack/react-router";

const navigate = useNavigate();
navigate("/player/games"); // Missing localization
```

**✅ CORRECT - Use localized navigation hooks:**

```tsx
import { useLocalizedNavigation } from "~/lib/i18n/links/hooks";

const { navigateLocalized, changeLanguageAndNavigate } = useLocalizedNavigation();

// Navigate with localization
await navigateLocalized({
  to: "/player/games",
  params: { gameId: game.id },
});

// Change language and navigate
await changeLanguageAndNavigate("de", "/player/dashboard");
```

#### **3. Translation Key Organization**

**Structure keys by feature and action type:**

```json
{
  "links": {
    "game_management": {
      "my_games": "My Games",
      "create_game": "Create New Game",
      "view_details": "View Details"
    },
    "event_management": {
      "browse_events": "Browse Events",
      "register_for_event": "Register",
      "event_calendar": "Event Calendar"
    },
    "navigation": {
      "go_home": "Go Home",
      "go_back": "Go Back"
    },
    "accessibility": {
      "link_aria_label": {
        "game_details": "View game details",
        "user_profile": "View user profile"
      }
    }
  }
}
```

#### **4. Route Parameter Handling**

**For dynamic routes with parameters:**

```tsx
// ✅ CORRECT - Use params prop
<LocalizedLink
  to="/player/games/$gameId"
  params={{ gameId: game.id }}
  translationKey="links.common.view_details"
  translationNamespace="navigation"
  ariaLabelTranslationKey="links.accessibility.link_aria_label.game_details"
/>;

// ✅ CORRECT - Programmatic with params
await navigateLocalized({
  to: "/player/events/$eventId",
  params: { eventId: event.id },
  search: { tab: "details" },
});
```

#### **5. Search Parameters**

**For links with search/query parameters:**

```tsx
<LocalizedLink
  to="/player/games"
  search={{ page: 2, filter: "strategy" }}
  translationKey="links.game_management.browse_games"
  translationNamespace="navigation"
/>
```

#### **6. Accessibility Requirements**

**Always provide proper accessibility labels:**

```tsx
<LocalizedLink
  to="/player/games"
  translationKey="links.game_management.my_games"
  ariaLabelTranslationKey="links.accessibility.link_aria_label.my_games"
  titleTranslationKey="links.accessibility.link_title.my_games"
/>
```

### **Migration Checklist for Navigation**

**For each navigation element:**

- [ ] Replace `<Link>` with appropriate `LocalizedLink` variant
- [ ] Add translation key in `navigation.json`
- [ ] Include accessibility labels for screen readers
- [ ] Handle route parameters correctly
- [ ] Test language switching functionality
- [ ] Verify proper URL generation with language prefixes

### **Common Navigation Patterns**

#### **Navigation Menus:**

```tsx
// Use LocalizedNavLink for menu items
<LocalizedNavLink
  to="/player/dashboard"
  translationKey="navigation.main.dashboard"
  activeProps={{ className: "active" }}
/>
```

#### **Action Buttons:**

```tsx
// Use LocalizedButtonLink for primary actions
<LocalizedButtonLink
  to="/player/events/create"
  translationKey="links.event_management.create_event"
  translationNamespace="navigation"
/>
```

#### **Card Links:**

```tsx
// Use LocalizedLink for card-based navigation
<LocalizedLink
  to="/player/games/$gameId"
  params={{ gameId: game.id }}
  translationKey="links.common.view_details"
  translationNamespace="navigation"
/>
```

## **Implementation Status**

### ✅ **Completed Infrastructure:**

- `LocalizedLink` component with all variants implemented
- Core hooks: `useLocalizedNavigation`, `useLocalizedLink`, `useLocalizedBreadcrumbs`

## **Development Guidelines**

### **Adding New Navigation**

When adding new navigation to the application:

1. **Always use LocalizedLink components** - Never use plain `<Link>` or `<a href>`
2. **Add translation keys** to `src/lib/i18n/locales/en/navigation.json`
3. **Include accessibility labels** for screen readers
4. **Test language switching** to verify proper URL generation

### **Adding New Translation Keys**

```bash
# After adding new translation keys
pnpm i18n:generate-types

# This updates TypeScript definitions automatically
```

### **Common Translation Key Patterns**

```json
{
  "links": {
    "feature_name": {
      "action": "Action Text",
      "view_details": "View Details",
      "create_new": "Create New Feature",
      "manage": "Manage",
      "browse": "Browse Features"
    }
  },
  "accessibility": {
    "link_aria_label": {
      "feature_page": "Visit feature page",
      "feature_details": "View feature details"
    }
  }
}
```

## **Testing Localized Navigation**

```bash
# Test language switching in development
pnpm dev

# 1. Navigate to any page with links
# 2. Use language switcher to change languages
# 3. Verify all links maintain proper language prefixes
# 4. Check that URLs update correctly: /en/player/games → /de/player/games

# Test parameter resolution
# Navigate to dynamic routes and verify parameters are correctly substituted
```

## **Maintenance Tasks**

### **When Adding New Languages:**

1. Add translation files to `src/lib/i18n/locales/[language]/`
2. Copy `navigation.json` structure and translate all keys
3. Run `pnpm i18n:generate-types` to update types
4. Test language switching functionality

### **When Adding New Routes:**

1. Add route translation keys to `navigation.json`
2. Use `LocalizedLink` components for any navigation to the new route
3. Test parameter resolution for dynamic routes
4. Verify language switching works correctly

### **Regular Maintenance:**

- Run `pnpm check-types` to ensure type safety
- Test language switching before releases
- Keep translation keys organized and consistent
- Review accessibility labels for completeness

## **Production Considerations**

### **SEO Optimization:**

- Localized URLs automatically include language prefixes
- Consider implementing hreflang tags for multilingual SEO
- Ensure sitemap includes all language variants

### **Performance:**

- LocalizedLink components are optimized with memoization
- Translation types are generated at build time
- Language detection happens server-side for optimal performance

### **Monitoring:**

- Monitor 404 errors for broken localized links
- Track language switching usage analytics
- Test all user journeys across supported languages

This comprehensive approach ensures all navigation in the application is properly internationalized and maintains a consistent user experience across all supported languages.
