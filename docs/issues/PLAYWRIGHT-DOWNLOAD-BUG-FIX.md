# Playwright Download Bug Fix for sin-uat

## Problem

When using Playwright to navigate to certain URLs on sin-uat after authentication, the browser would trigger a file download instead of rendering the page. This affected:

- `/dashboard/sin`
- `/dashboard/sin/imports`
- `/dashboard/admin/sin/imports`
- Other routes after initial login

The bug occurred both in:

1. Playwright MCP browser sessions
2. Standalone Playwright scripts with `storageState` option

## Root Cause

The `storageState` option in `browser.newContext()` appears to load cookies in a way that triggers the download behavior for certain routes. This may be related to how the session cookies interact with the server's response headers.

## Solution

Instead of using the `storageState` option, manually manage cookies:

```typescript
// DON'T do this - causes download bug:
const context = await browser.newContext({
  storageState: storageStatePath,  // ❌ Causes downloads
});

// DO this instead:
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  // Don't use storageState option
});

const page = await context.newPage();

// Clear any existing state
await page.context().clearCookies();

// Manually add cookies from storage state file
const { readFile } = await import("node:fs/promises");
const storageState = JSON.parse(await readFile(storageStatePath, "utf-8"));
await page.context().addCookies(storageState.cookies);

// Navigate to a known-working URL first
await page.goto(`${baseUrl}/dashboard/admin/sin/audit`, { waitUntil: "networkidle" });

// Then use click navigation to reach other pages
const importsTab = page.locator("a, button").filter({ hasText: /^Imports$/ });
await importsTab.click();
```

## Key Points

1. **Don't use `storageState` option** - It causes the download bug
2. **Clear cookies first** - Ensures clean state
3. **Add cookies manually** - Use `addCookies()` instead
4. **Navigate to audit first** - `/dashboard/admin/sin/audit` works reliably
5. **Use click navigation** - Click links/tabs instead of `goto()` for problematic routes

## For Playwright MCP

When using the Playwright MCP tool, clear cookies before navigating:

```javascript
// Clear cookies first
await page.context().clearCookies();

// Then navigate
await page.goto('https://sinuat.solsticeapp.ca/auth/login');
```

## Affected Scripts

- `scripts/record-sin-uat-dm-agg-006.ts` - Uses this fix
- `scripts/record-sin-uat-sec-agg-004.ts` - Works with storageState for audit URL only

## Date Discovered

2026-01-10
