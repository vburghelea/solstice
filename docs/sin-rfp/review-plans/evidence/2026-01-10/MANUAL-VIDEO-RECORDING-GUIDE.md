# Manual Video Recording Guide

**Date:** 2026-01-13
**Purpose:** Step-by-step scripts for manually recording the six RFP evidence videos
**Environment:** sin-dev or sin-uat (whichever has seeded data)

---

## Pre-Recording Setup (Do Once)

### 1. Environment Verification

```bash
# Start SST tunnel to your target environment
AWS_PROFILE=techdev npx sst tunnel --stage sin-dev
# OR
AWS_PROFILE=techdev npx sst tunnel --stage sin-uat
```

### 2. Verify Seeded Data

```bash
# Check audit log entries (need 200+)
AWS_PROFILE=techdev npx sst shell --stage sin-dev -- bash -c 'psql ... -c "SELECT category, COUNT(*) FROM audit_log GROUP BY category"'

# Expected output:
# ADMIN    | 1
# AUTH     | 83+
# DATA     | 20+
# EXPORT   | 4+
# SECURITY | 99+
```

### 3. Test User Credentials

| User                      | Password          | Has MFA | Use For                                           |
| ------------------------- | ----------------- | ------- | ------------------------------------------------- |
| `viasport-staff@demo.com` | `testpassword123` | No      | All videos (has platform admin + org owner roles) |
| `global-admin@demo.com`   | `demopassword123` | No      | Platform admin only (no org access)               |
| `pso-admin@demo.com`      | `testpassword123` | No      | BC Hockey org features                            |

**Note:** MFA is disabled on all demo accounts for evaluator convenience. Users can enable MFA via Settings > Security if needed for SEC-AGG-001 demo.

### 4. MFA Setup (If Needed for SEC-AGG-001)

If you want to demonstrate MFA login in SEC-AGG-001:

1. Log in to `viasport-staff@demo.com`
2. Navigate to Settings > Security
3. Click "Enable MFA" and scan QR with authenticator app
4. Complete setup - future logins will require TOTP

To generate TOTP codes after MFA is enabled:

```bash
# Use the secret shown during MFA setup, or if using test secret:
npx tsx -e "
import { createOTP } from '@better-auth/utils/otp';
(async () => {
  const code = await createOTP('solstice-test-totp-secret-32char', { period: 30, digits: 6 }).totp();
  console.log(code);
})();
"
```

### 5. Screen Recording Setup

- Use QuickTime or OBS
- Resolution: 1920x1080 or 2560x1440
- Frame rate: 30fps (will be converted to 2fps keyframes later)
- Record the browser window only, not the full screen
- Enable cursor visibility (important for demonstrating interactions)

### 6. Browser Prep

- Use Chrome or Firefox
- Clear cookies/cache for the target domain
- Set zoom to 100%
- Close other tabs
- Disable notifications

---

## Video 1: SEC-AGG-001 - Auth & MFA Login

**Target Duration:** 35-45 seconds
**Goal:** Demonstrate MFA login, then show MFA enabled badge, passkeys section, and active sessions.

### Pre-Recording Verification

1. **Enable MFA on the demo account FIRST** (see Section 4 above)
2. Open browser dev tools (Network tab)
3. Navigate to `https://sindev.solsticeapp.ca/auth/login` (or sinuat)
4. Verify page loads without errors

**Important:** MFA is disabled by default on demo accounts. You must enable it before recording this video to demonstrate the MFA login flow.

### Recording Steps

#### Phase 1: Login (0:00 - 0:12)

| Step | Action                                            | What to Show                                       | Duration |
| ---- | ------------------------------------------------- | -------------------------------------------------- | -------- |
| 1    | Start recording, navigate to `/auth/login`        | Login page loads                                   | 2s       |
| 2    | Click email field, type `viasport-staff@demo.com` | Email populating character by character            | 3s       |
| 3    | Press Enter or click Continue                     | "Checking..." spinner briefly, then password field | 1s       |
| 4    | Type password `testpassword123`                   | Masked dots appearing                              | 2s       |
| 5    | Click "Login" button                              | "Logging in..." spinner                            | 1s       |
| 6    | Wait for MFA prompt                               | MFA code entry screen                              | 1-2s     |

#### Phase 2: MFA Verification (0:12 - 0:20)

| Step | Action                                        | What to Show                     | Duration    |
| ---- | --------------------------------------------- | -------------------------------- | ----------- |
| 7    | **Generate fresh TOTP code** (in terminal)    | -                                | Do this NOW |
| 8    | Click code field, type the 6-digit code       | Code appearing digit by digit    | 2s          |
| 9    | Click "Verify" or press Enter                 | "Verifying..." spinner           | 1-2s        |
| 10   | Wait for org selector or dashboard            | Org selection modal or dashboard | 2s          |
| 11   | If org selector appears: select "viaSport BC" | Organization dropdown            | 2s          |

#### Phase 3: Dashboard Brief View (0:20 - 0:25)

| Step | Action                              | What to Show                  | Duration |
| ---- | ----------------------------------- | ----------------------------- | -------- |
| 12   | Dashboard loads                     | Admin menu visible in sidebar | 3s       |
| 13   | Hover over admin menu items briefly | Show role-based access        | 2s       |

#### Phase 4: Settings Page (0:25 - 0:45)

| Step | Action                                            | What to Show                        | Duration |
| ---- | ------------------------------------------------- | ----------------------------------- | -------- |
| 14   | Click "Settings" in sidebar (or user menu)        | Navigation to settings              | 2s       |
| 15   | Wait for Settings page to load                    | Account Settings header             | 1s       |
| 16   | **Scroll to "Two-Factor Authentication" section** | MFA section visible                 | 2s       |
| 17   | **Look for "MFA Enabled" badge (green)**          | This is critical - see Issues below | 3s       |
| 18   | Scroll to "Passkeys" section                      | Passkey management visible          | 3s       |
| 19   | Scroll to "Active Sessions" section               | Current session with IP/device      | 5s       |
| 20   | Stop recording                                    | -                                   | -        |

### Potential Issues

**Issue 1: MFA shows "Enable MFA" instead of "Enabled"**

- Root cause: `twoFactorEnabled` flag not set correctly in database
- Workaround for recording: Skip Settings entirely and end on dashboard with a note, OR re-seed data
- Fix: Run seed script with `BETTER_AUTH_SECRET` to properly encrypt MFA enrollment

**Issue 2: Passkeys shows "unavailable"**

- This is expected - passkeys cannot be seeded programmatically
- Show the section exists but accept "Add passkey" button is visible

**Issue 3: Active Sessions not visible**

- May need to scroll further down
- Or sessions section might be collapsed - click to expand

### Post-Recording Checklist

- [ ] Login completes successfully
- [ ] MFA code accepted
- [ ] Dashboard shows admin menu
- [ ] Settings page shows MFA section
- [ ] MFA badge shows "Enabled" (critical)
- [ ] Passkeys section visible
- [ ] Active Sessions section visible
- [ ] No single view exceeds 5 seconds

---

## Video 2: SEC-AGG-004 - Audit Trail Verification

**Target Duration:** 40-50 seconds
**Goal:** Show diverse audit entries, PII/step-up badges, detail panel, hash chain verification, and CSV export.

### Pre-Recording Verification

1. Log in as `viasport-staff@demo.com`
2. Navigate to `/dashboard/admin/sin/audit`
3. Verify 200+ entries are visible (not empty state)
4. Verify hash chain: Click "Verify hash chain" - should show **green** success message

**If hash chain fails (red error):** Stop. Re-run seed script to regenerate valid hash chain.

### Recording Steps

#### Phase 1: Navigate to Audit Log (0:00 - 0:05)

| Step | Action                                               | What to Show                                  | Duration |
| ---- | ---------------------------------------------------- | --------------------------------------------- | -------- |
| 1    | Already logged in from SEC-AGG-001 OR do fresh login | -                                             | -        |
| 2    | Start recording                                      | Dashboard visible                             | 1s       |
| 3    | Click "Audit" in admin sidebar                       | Navigation                                    | 1s       |
| 4    | Wait for audit page to load                          | Entries visible immediately (NOT empty state) | 2s       |

**Critical:** If you see "No audit entries yet", stop and re-seed data.

#### Phase 2: Browse Audit Entries (0:05 - 0:15)

| Step | Action                                   | What to Show                                      | Duration |
| ---- | ---------------------------------------- | ------------------------------------------------- | -------- |
| 5    | Scroll down slowly to show entry variety | Multiple categories: AUTH, DATA, SECURITY, EXPORT | 5s       |
| 6    | **Click on a DATA entry**                | Entry detail panel opens                          | 2s       |
| 7    | Show detail panel content                | Actor, target, timestamp, metadata                | 3s       |
| 8    | Close detail panel (click X or outside)  | Panel closes                                      | 1s       |

#### Phase 3: Show PII and Step-up Badges (0:15 - 0:25)

| Step | Action                                    | What to Show                            | Duration |
| ---- | ----------------------------------------- | --------------------------------------- | -------- |
| 9    | Click category filter dropdown            | Filter options visible                  | 1s       |
| 10   | Select "EXPORT"                           | Filter applied                          | 1s       |
| 11   | **Look for entries with "PII" badge**     | Blue PII badge on relevant entries      | 3s       |
| 12   | **Look for entries with "Step-up" badge** | Yellow/orange step-up badge             | 3s       |
| 13   | Click one EXPORT entry with Step-up badge | Detail panel shows step-up verification | 3s       |

**Potential Issue:** No PII or Step-up badges visible

- Check if `metadata.includesPii: true` and `metadata.stepUpAuthUsed: true` were seeded
- May need to re-seed audit entries with proper metadata

#### Phase 4: Hash Chain Verification (0:25 - 0:33)

| Step | Action                            | What to Show                                     | Duration |
| ---- | --------------------------------- | ------------------------------------------------ | -------- |
| 14   | Clear filter (show all entries)   | Full list visible                                | 1s       |
| 15   | Click "Verify hash chain" button  | Button click                                     | 1s       |
| 16   | Wait for verification             | Processing indicator                             | 2s       |
| 17   | **Green success message appears** | "Hash chain verified successfully (207 entries)" | 4s       |

**Critical:** Must show green success. If red error, hash chain is corrupt - stop and re-seed.

#### Phase 5: Export CSV (0:33 - 0:42)

| Step | Action                                             | What to Show                                 | Duration |
| ---- | -------------------------------------------------- | -------------------------------------------- | -------- |
| 18   | Click "Export CSV" button                          | Button click                                 | 1s       |
| 19   | **If step-up auth modal appears:** Enter TOTP code | MFA prompt visible                           | 4s       |
| 20   | Wait for download                                  | Download toast or browser download indicator | 3s       |
| 21   | Show download complete toast                       | "Export complete" message                    | 2s       |

#### Phase 6: Date Filter Demo (0:42 - 0:50)

| Step | Action                                  | What to Show          | Duration |
| ---- | --------------------------------------- | --------------------- | -------- |
| 22   | Click date range picker                 | Date selector opens   | 1s       |
| 23   | Select a date range (e.g., last 7 days) | Dates selected        | 2s       |
| 24   | Apply filter                            | Entry list updates    | 2s       |
| 25   | Show filtered results                   | Fewer entries visible | 2s       |
| 26   | Stop recording                          | -                     | -        |

### Potential Issues

**Issue 1: Empty state appears**

- Data not seeded correctly
- Solution: Re-run seed script with valid DATABASE_URL and BETTER_AUTH_SECRET

**Issue 2: Hash chain verification fails**

- Hash chain was corrupted (e.g., entries deleted/modified)
- Solution: Re-seed ALL audit entries to regenerate valid chain

**Issue 3: Export doesn't trigger step-up auth**

- Step-up may only trigger for certain roles or data
- Workaround: Show export button click and download toast regardless

### Post-Recording Checklist

- [ ] 200+ entries visible (no empty state)
- [ ] Multiple categories shown (AUTH, DATA, SECURITY, EXPORT)
- [ ] Entry detail panel demonstrated
- [ ] PII badge visible on at least one entry
- [ ] Step-up badge visible on EXPORT entries
- [ ] Hash chain shows green "verified successfully"
- [ ] Export CSV triggers download
- [ ] Date filter demonstration included

---

## Video 3: RP-AGG-003 - Reporting Workflow

**Target Duration:** 60-90 seconds
**Goal:** Show complete reporting cycle: admin creates cycle, assigns task, user completes task, admin reviews.

### Pre-Recording Verification

1. Log in as `viasport-staff@demo.com`
2. Navigate to `/dashboard/admin/sin/reporting`
3. Verify page loads with existing cycles/tasks visible
4. Open a second browser tab (or incognito) and log in as different user if testing user perspective

**Note:** This is the most complex video. Consider recording in segments if needed.

### Recording Steps

#### Phase 1: Admin - Create Reporting Cycle (0:00 - 0:20)

| Step | Action                                       | What to Show                     | Duration |
| ---- | -------------------------------------------- | -------------------------------- | -------- |
| 1    | Start recording on admin reporting page      | `/dashboard/admin/sin/reporting` | 2s       |
| 2    | Click "Create reporting cycle"               | Form opens or dialog appears     | 2s       |
| 3    | Enter cycle name: "Q2 2026 Quarterly Report" | Text input                       | 3s       |
| 4    | Select start date                            | Date picker                      | 2s       |
| 5    | Select end date                              | Date picker                      | 2s       |
| 6    | Add description (optional)                   | Text area                        | 3s       |
| 7    | Click "Create" button                        | Button click                     | 1s       |
| 8    | Wait for success toast                       | "Cycle created successfully"     | 2s       |
| 9    | **Verify cycle appears in list**             | New cycle row visible            | 3s       |

**Potential Issue:** Create button disabled

- Check required fields are filled
- Check for validation errors

#### Phase 2: Admin - Assign Task (0:20 - 0:40)

| Step | Action                                       | What to Show                   | Duration |
| ---- | -------------------------------------------- | ------------------------------ | -------- |
| 10   | Scroll to "Assign reporting task" section    | Form visible                   | 2s       |
| 11   | Click cycle dropdown                         | Dropdown opens                 | 1s       |
| 12   | Select the cycle just created                | "Q2 2026 Quarterly Report"     | 2s       |
| 13   | Click organization dropdown                  | Dropdown opens                 | 1s       |
| 14   | Select "viaSport BC" (or another org)        | Organization selected          | 2s       |
| 15   | Click form dropdown                          | Dropdown opens                 | 1s       |
| 16   | Select "Annual Statistics Report"            | Form selected                  | 2s       |
| 17   | Set due date (e.g., 14 days from now)        | Date picker                    | 2s       |
| 18   | Configure reminder (optional): 3 days before | Reminder checkbox              | 2s       |
| 19   | Click "Create task"                          | Button click                   | 1s       |
| 20   | Wait for success toast                       | "Task assigned successfully"   | 2s       |
| 21   | **Verify task appears in table**             | Task row with "pending" status | 3s       |

**Potential Issue:** Dropdowns don't populate

- Wait for page to fully load
- Check network requests for errors

#### Phase 3: User - View and Complete Task (0:40 - 1:05)

**Option A: Same browser, navigate to user view**

| Step | Action                                 | What to Show                  | Duration |
| ---- | -------------------------------------- | ----------------------------- | -------- |
| 22   | Navigate to `/dashboard/sin/reporting` | User reporting view           | 2s       |
| 23   | Show "My Tasks" or task queue          | Assigned task visible         | 3s       |
| 24   | Click on the assigned task             | Task opens                    | 2s       |
| 25   | Fill form fields (5-6 fields)          | Data entry                    | 10s      |
| 26   | Click "Submit"                         | Button click                  | 1s       |
| 27   | Wait for success                       | "Submission successful" toast | 3s       |
| 28   | **Show task status changed**           | Status: "submitted"           | 3s       |

**Option B: If switching users is complex**

- Show existing submissions from seeded data
- Focus on admin workflow view

#### Phase 4: Admin - Review Submission (1:05 - 1:30)

| Step | Action                            | What to Show                         | Duration |
| ---- | --------------------------------- | ------------------------------------ | -------- |
| 29   | Navigate back to admin reporting  | `/dashboard/admin/sin/reporting`     | 2s       |
| 30   | Find the submission in table      | Row with "submitted" status          | 2s       |
| 31   | Click on submission row           | Detail panel or page opens           | 2s       |
| 32   | Review submitted data             | Form fields visible with values      | 5s       |
| 33   | Click status dropdown             | Options: approved, changes_requested | 2s       |
| 34   | Select "Approved"                 | Status change                        | 2s       |
| 35   | Click "Update" or "Save"          | Confirmation                         | 2s       |
| 36   | Wait for success toast            | "Status updated"                     | 2s       |
| 37   | **Show approved status in table** | Green "approved" badge               | 3s       |
| 38   | Stop recording                    | -                                    | -        |

### Potential Issues

**Issue 1: Form dropdowns empty**

- Seed data may not include forms or organizations
- Check seed script creates forms with `isActive: true`

**Issue 2: User view doesn't show task**

- Task assignment may have failed silently
- Check task is associated with correct organization

**Issue 3: Status update fails**

- Permission issue - ensure user has admin role
- Check network for error responses

### Post-Recording Checklist

- [ ] Cycle created with success toast
- [ ] Cycle visible in list
- [ ] Task assigned with success toast
- [ ] Task visible in submissions table
- [ ] User perspective shows assigned task
- [ ] Form submission completed
- [ ] Status changes from pending → submitted
- [ ] Admin approves submission
- [ ] Status changes to approved

---

## Video 4: RP-AGG-005 - Analytics Export (with AI-Powered NL Query)

**Target Duration:** 80-100 seconds
**Goal:** Demonstrate AI-powered natural language query, then Pivot Builder visualization, export with step-up auth, and save to dashboard.

**This is your strongest differentiator video.** The NL Query feature shows AI integration that most competitors won't have.

### Pre-Recording Verification

1. Log in as `viasport-staff@demo.com`
2. Navigate to `/dashboard/analytics/explore` (or `/dashboard/sin/analytics` which redirects there)
3. Verify the **"Ask AI" input** is visible (sparkle icon)
4. Verify datasets are available (Organizations, Form Submissions)
5. **Test NL Query:** Type a question and verify preview dialog appears
6. **Check Form Submissions has data:** Ensure 10+ organizations with submissions

### Recording Steps

#### Phase 1: Navigate to Analytics (0:00 - 0:05)

| Step | Action                       | What to Show                      | Duration |
| ---- | ---------------------------- | --------------------------------- | -------- |
| 1    | Start recording on dashboard | Dashboard visible                 | 1s       |
| 2    | Click "Analytics" in sidebar | Navigation                        | 2s       |
| 3    | Analytics page loads         | **"Ask AI" input visible at top** | 2s       |

#### Phase 2: AI-Powered Natural Language Query (0:05 - 0:30) - KEY DIFFERENTIATOR

| Step | Action                                                  | What to Show                                         | Duration |
| ---- | ------------------------------------------------------- | ---------------------------------------------------- | -------- |
| 4    | **Click the input field**                               | Placeholder: "Ask a question about your data..."     | 2s       |
| 5    | **Type:** "Show me total participants by organization"  | Text appearing character by character                | 4s       |
| 6    | Press Enter or click **"Ask AI"** button (sparkle icon) | Loading spinner appears                              | 2s       |
| 7    | **"Query Preview" dialog appears**                      | Title: "Review the interpreted query before running" | 3s       |
| 8    | Show preview dialog contents:                           |                                                      |          |
|      | - **Interpretation** section                            | AI's plain-English explanation                       | 2s       |
|      | - **Dataset**: e.g., "form_submissions"                 | Which data source                                    | 1s       |
|      | - **Metrics**: e.g., "participant_count"                | What's being calculated                              | 1s       |
|      | - **Group By**: e.g., "organization_name"               | How results are grouped                              | 1s       |
|      | - **Confidence badge: "92% - High confidence"** (green) | AI confidence indicator                              | 2s       |
| 9    | **Click "Run Query" button** (has Play icon)            | User confirms the interpretation                     | 1s       |
| 10   | Wait for results                                        | "Query Results (X rows)" header appears              | 3s       |
| 11   | Scroll through results table                            | Show data variety, Export CSV button visible         | 3s       |

**What to emphasize:** The user asked a plain English question and got structured results without knowing SQL or the data model.

**Alternative example questions** (shown as "Try:" buttons in UI):

- "How many registrations by sport in 2023?"
- "Show me total participants by organization"
- "What are the monthly submission counts?"

**Potential Issue:** Preview dialog doesn't appear

- NL Query feature may not be enabled
- Check feature flag `sin_nl_query` is true for this tenant
- Workaround: Skip to manual pivot flow (see Alternative Flow section)

**Potential Issue:** Low confidence score (< 70%)

- Yellow warning box appears: "Low confidence interpretation"
- Message: "The AI is not confident about this query. Consider rephrasing..."
- This actually demonstrates responsible AI - **show this if it happens!**
- Try clicking an example question instead for more reliable results

#### Phase 3: Visualization via Pivot Builder (0:30 - 0:45)

**Note:** NL Query results display as a table with an "Export CSV" button. For chart visualization, use the Pivot Builder below the NL Query results.

| Step | Action                                                                            | What to Show                      | Duration |
| ---- | --------------------------------------------------------------------------------- | --------------------------------- | -------- |
| 12   | Notice the suggestion: "For bar chart visualization, use the Pivot Builder above" | Suggestion banner with chart icon | 2s       |
| 13   | Scroll down to **Pivot Builder** section                                          | Dataset dropdown visible          | 2s       |
| 14   | Select dataset: "Form Submissions"                                                | Dataset selected                  | 2s       |
| 15   | **Drag "Organization" to Rows**                                                   | Visible drag operation            | 3s       |
| 16   | **Drag "Count" to Measures**                                                      | Visible drag operation            | 2s       |
| 17   | Click "Run Query" button                                                          | Query executes                    | 2s       |
| 18   | Click "Chart" tab                                                                 | Bar chart renders                 | 2s       |
| 19   | **Hover over bars to show tooltips**                                              | Data values visible               | 3s       |

#### Phase 4: Export with Step-up Auth (0:45 - 1:00)

**Two export options available:**

1. **NL Query Results Export** - Quick CSV download (client-side, no step-up auth)
2. **Pivot Builder Export** - May require step-up auth for sensitive data

| Step | Action                                          | What to Show                       | Duration |
| ---- | ----------------------------------------------- | ---------------------------------- | -------- |
| 20   | Click "Export CSV" button (in Pivot Builder)    | Button click                       | 1s       |
| 21   | **Step-up auth modal appears** (if MFA enabled) | MFA challenge for sensitive export | 3s       |
| 22   | **Generate fresh TOTP code** (if prompted)      | In terminal                        | NOW      |
| 23   | Enter TOTP code                                 | 6 digits appearing                 | 3s       |
| 24   | Click "Verify"                                  | Verification processing            | 2s       |
| 25   | Wait for download                               | Download starts                    | 2s       |
| 26   | **Show success toast**                          | "Export complete" message          | 3s       |

**Note:** If MFA is not enabled on the demo account, step-up auth may not appear. This is fine - the export still demonstrates the feature.

**Potential Issue:** No step-up auth appears

- Expected if MFA not enabled on account
- Workaround: Show export completes successfully regardless

#### Phase 5: Save to Dashboard (1:00 - 1:20)

| Step | Action                                          | What to Show                | Duration |
| ---- | ----------------------------------------------- | --------------------------- | -------- |
| 27   | Click "Save to Dashboard"                       | Button click                | 1s       |
| 28   | Dialog opens                                    | Name input field            | 2s       |
| 29   | Enter name: "Submissions by Org (AI Generated)" | Text input - note AI origin | 3s       |
| 30   | Click "Save"                                    | Button click                | 1s       |
| 31   | Wait for success                                | "Saved to dashboard" toast  | 2s       |
| 32   | Navigate to "My Dashboards"                     | Click menu item             | 2s       |
| 33   | Click on saved dashboard                        | Dashboard opens             | 2s       |
| 34   | **Wait for widget to fully render**             | Chart visible in widget     | 4s       |
| 35   | Stop recording                                  | -                           | -        |

### Alternative Flow: Manual Pivot (If NL Query Unavailable)

If the NL Query feature isn't ready, use this manual flow for Phase 2:

| Step | Action                                  | What to Show                       | Duration |
| ---- | --------------------------------------- | ---------------------------------- | -------- |
| 4    | Click dataset dropdown                  | Options visible                    | 1s       |
| 5    | Select "Form Submissions"               | Dataset selected                   | 2s       |
| 6    | Wait for fields to load                 | Field list populates               | 2s       |
| 7    | **Drag "Organization" to Rows**         | Visible drag operation with cursor | 3s       |
| 8    | **Drag "Submission Status" to Columns** | Visible drag operation             | 3s       |
| 9    | **Drag "Count" to Measures**            | Visible drag operation             | 3s       |
| 10   | Click "Run Query"                       | Button click                       | 1s       |
| 11   | Wait for results                        | Table populates with 10+ rows      | 3s       |

### Potential Issues

**Issue 1: NL Query preview doesn't appear**

- Feature flag may be disabled
- Bedrock API connection may be failing
- Check browser console for errors
- Fallback: Use manual pivot builder

**Issue 2: Low confidence interpretation**

- AI wasn't sure about the question
- This actually demonstrates responsible AI - show the warning
- Rephrase or confirm anyway to show user control

**Issue 3: Only 1 organization in results**

- Need more form submissions seeded
- Re-run seed with more submission data

**Issue 4: Dashboard widget stays in loading state**

- Wait longer (up to 10 seconds)
- May be a real bug - document and note in video

### Post-Recording Checklist

**NL Query Demo:**

- [ ] **Input placeholder visible: "Ask a question about your data..."**
- [ ] **"Try:" example question buttons visible**
- [ ] **Natural language question typed or example clicked**
- [ ] **"Ask AI" button clicked (sparkle icon)**
- [ ] **"Query Preview" dialog appears**
- [ ] **Interpretation, Dataset, Metrics, Group By sections visible**
- [ ] **Confidence badge displayed (e.g., "92% - High confidence")**
- [ ] **"Run Query" button clicked (Play icon)**
- [ ] **"Query Results (X rows)" header appears**
- [ ] Results table shows data

**Pivot Builder Visualization:**

- [ ] Pivot Builder dataset selected
- [ ] Drag operations visible (Organization to Rows, Count to Measures)
- [ ] Bar chart renders in Chart tab
- [ ] Export button clicked
- [ ] Step-up auth modal shown (if MFA enabled)
- [ ] Export download completes with toast
- [ ] Saved to dashboard successfully
- [ ] Dashboard widget renders fully

### Why This Video Matters

The NL Query feature demonstrates:

1. **AI Integration** - Modern, forward-thinking platform
2. **Self-Service Analytics** - Users don't need SQL knowledge
3. **Responsible AI** - Preview before execution, confidence scoring
4. **Security** - Step-up auth for sensitive exports
5. **Productivity** - Questions answered in seconds, not minutes

---

## Video 5: DM-AGG-001 - Form Submission

**Target Duration:** 30-45 seconds
**Status:** Per remediation plan, this video is already acceptable. Re-record only if needed.

### Pre-Recording Verification

1. Log in as `viasport-staff@demo.com`
2. Navigate to `/dashboard/sin/forms`
3. Verify at least one form exists (e.g., "Facility Usage Survey" or "Annual Statistics Report")

### Recording Steps

#### Phase 1: Navigate to Forms (0:00 - 0:08)

| Step | Action                                           | What to Show            | Duration |
| ---- | ------------------------------------------------ | ----------------------- | -------- |
| 1    | Start recording (can start from logged-in state) | Dashboard               | 1s       |
| 2    | Click "Forms" in sidebar                         | Navigation              | 2s       |
| 3    | Show forms list                                  | Available forms visible | 2s       |
| 4    | Click on a form (e.g., "Facility Usage Survey")  | Form opens              | 2s       |

#### Phase 2: Fill Form (0:08 - 0:25)

| Step | Action                        | What to Show      | Duration |
| ---- | ----------------------------- | ----------------- | -------- |
| 5    | Click first text field        | Focus on field    | 1s       |
| 6    | Type: "Richmond Olympic Oval" | Text appearing    | 2s       |
| 7    | Tab to date field             | Focus moves       | 1s       |
| 8    | Enter date: "2026-01-15"      | Date populated    | 2s       |
| 9    | Tab to number field           | Focus moves       | 1s       |
| 10   | Enter: "42" (hours)           | Number entered    | 1s       |
| 11   | Click file upload field       | File dialog opens | 2s       |
| 12   | Select a PDF file             | File name appears | 3s       |
| 13   | Wait for upload indicator     | Upload progress   | 2s       |

#### Phase 3: Submit and Verify (0:25 - 0:40)

| Step | Action                                               | What to Show                  | Duration |
| ---- | ---------------------------------------------------- | ----------------------------- | -------- |
| 14   | **Click "Submit" button**                            | Button click - critical       | 1s       |
| 15   | Wait for success toast                               | "Form submitted successfully" | 3s       |
| 16   | Navigate to "My Submissions" or "Submission History" | History view                  | 2s       |
| 17   | **Show new submission in list**                      | Entry with timestamp          | 5s       |
| 18   | Click on submission                                  | Detail view                   | 2s       |
| 19   | Show submitted data                                  | All fields visible            | 3s       |
| 20   | Stop recording                                       | -                             | -        |

### Potential Issues

**Issue 1: "No forms assigned" message**

- User may not have forms assigned to their organization
- Solution: Navigate to admin forms first, then to user forms

**Issue 2: Submit button doesn't respond**

- Check for validation errors
- Ensure all required fields are filled

**Issue 3: File upload fails**

- Check file size limits
- Try a smaller PDF

### Post-Recording Checklist

- [ ] Form opens and fields are visible
- [ ] All required fields filled
- [ ] File upload succeeds
- [ ] Submit button clicked (visible cursor click)
- [ ] Success toast appears
- [ ] Submission appears in history
- [ ] Can view submitted data

---

## Video 6: DM-AGG-006 - Import Wizard

**Target Duration:** 60-90 seconds
**Goal:** Upload CSV, show validation, complete import, verify imported data.

### Pre-Recording Verification

1. Log in as `viasport-staff@demo.com`
2. Navigate to `/dashboard/admin/sin/imports`
3. Prepare test files:
   - `import-demo-annual-stats-errors.csv` (intentionally has errors)
   - `import-demo-annual-stats-large.csv` (50 clean rows)
4. Verify files exist in `docs/sin-rfp/legacy-data-samples/`

### Recording Steps

#### Phase 1: Navigate to Import Wizard (0:00 - 0:10)

| Step | Action                                  | What to Show             | Duration |
| ---- | --------------------------------------- | ------------------------ | -------- |
| 1    | Start recording on admin dashboard      | Dashboard visible        | 1s       |
| 2    | Click "Imports" in admin sidebar        | Navigation               | 2s       |
| 3    | Import wizard page loads                | Upload interface visible | 2s       |
| 4    | Select organization: "viaSport BC"      | Dropdown selection       | 2s       |
| 5    | Select form: "Annual Statistics Report" | Dropdown selection       | 2s       |

#### Phase 2: Template Download (0:10 - 0:15)

| Step | Action                                  | What to Show          | Duration |
| ---- | --------------------------------------- | --------------------- | -------- |
| 6    | Click "Download XLSX Template"          | Button click          | 1s       |
| 7    | Wait for download                       | Download indicator    | 2s       |
| 8    | Show download toast or browser download | "Template downloaded" | 2s       |

#### Phase 3: Upload Error File First (0:15 - 0:30)

| Step | Action                                       | What to Show          | Duration |
| ---- | -------------------------------------------- | --------------------- | -------- |
| 9    | Click "Upload CSV" or drag zone              | File picker opens     | 1s       |
| 10   | Select `import-demo-annual-stats-errors.csv` | File name appears     | 2s       |
| 11   | Wait for upload and validation               | Progress indicator    | 3s       |
| 12   | **Show validation errors panel**             | "12 errors found"     | 3s       |
| 13   | Scroll through errors                        | Error details visible | 5s       |

This demonstrates validation catches bad data.

#### Phase 4: Upload Clean File (0:30 - 0:45)

| Step | Action                                      | What to Show                | Duration |
| ---- | ------------------------------------------- | --------------------------- | -------- |
| 14   | Click "Clear" or "Upload different file"    | Reset                       | 1s       |
| 15   | Select `import-demo-annual-stats-large.csv` | File name                   | 2s       |
| 16   | Wait for upload and validation              | Progress                    | 3s       |
| 17   | **Show "No errors - 50 rows ready"**        | Validation success          | 3s       |
| 18   | Show field mapping                          | 7 columns auto-mapped       | 3s       |
| 19   | Scroll through mapping                      | All fields green checkmarks | 3s       |

#### Phase 5: Execute Import (0:45 - 1:05)

| Step | Action                                     | What to Show                        | Duration |
| ---- | ------------------------------------------ | ----------------------------------- | -------- |
| 20   | Click "Run Import" or "Start Import"       | Button click                        | 1s       |
| 21   | Watch status change                        | "Processing..."                     | 2s       |
| 22   | **Wait for "Completed" status**            | This is critical - don't skip early | 10s      |
| 23   | Show import history with "Completed" badge | Success confirmation                | 3s       |
| 24   | Show "50 rows imported" message            | Row count                           | 2s       |

**Critical:** The previous automated recordings ended too early. Wait for the full "Completed" status.

#### Phase 6: Verify Imported Data (1:05 - 1:30)

| Step | Action                           | What to Show         | Duration |
| ---- | -------------------------------- | -------------------- | -------- |
| 25   | Navigate to Forms                | Sidebar click        | 2s       |
| 26   | Click "Annual Statistics Report" | Form page            | 2s       |
| 27   | Click "Submissions" tab          | Submissions list     | 2s       |
| 28   | **Show 50+ submissions in list** | "Showing 50 of 50"   | 5s       |
| 29   | Scroll through submissions       | Multiple entries     | 5s       |
| 30   | Click one submission             | Detail view          | 2s       |
| 31   | Show imported data values        | All fields populated | 5s       |
| 32   | Stop recording                   | -                    | -        |

### Potential Issues

**Issue 1: Import stays on "pending" forever**

- Backend job may be stuck
- Check Lambda logs
- Workaround: Describe issue, show import was submitted

**Issue 2: "50 rows imported" message doesn't appear**

- Message may be in a toast that disappears
- Or row count may be shown elsewhere
- Look for any indication of import size

**Issue 3: Previous imports clutter the view**

- Old "pending" imports from failed attempts
- Clear import history before recording if possible
- Or filter to only show recent imports

**Issue 4: Form Submissions doesn't show imported data**

- Data may be in different organization's view
- Check organization filter
- Navigate directly to the correct form

### Post-Recording Checklist

- [ ] Organization and form selected
- [ ] Template download demonstrated
- [ ] Error CSV shows validation errors
- [ ] Clean CSV shows "No errors" or "Ready"
- [ ] Field mapping auto-detected (7 columns)
- [ ] Import executes (button clicked)
- [ ] Status changes to "Completed" (critical)
- [ ] Row count visible ("50 rows")
- [ ] Form Submissions shows imported data
- [ ] Can view individual imported submission

---

## General Tips for All Videos

### Cursor Movement

- Move cursor smoothly, not erratically
- Pause cursor briefly before clicking (helps viewer track)
- Don't hide cursor - it shows user interaction

### Timing

- Don't rush - viewers need time to see what's happening
- Don't linger - avoid more than 5 seconds on static content
- Natural pace is best

### Error Recovery

- If something fails, stop recording and start over
- Better to have a clean recording than one with visible errors

### Audio (Optional)

- Recording without audio is fine for evidence videos
- If adding narration, keep it brief and factual

### Post-Processing

- Trim blank frames at start/end
- Consider 1.25x speed for slow sections
- Convert to H.264/AAC for compatibility

---

## Quick Reference Card

| Video          | Login As                | Start URL                      | Key Actions                                        |
| -------------- | ----------------------- | ------------------------------ | -------------------------------------------------- |
| SEC-AGG-001    | viasport-staff@demo.com | /auth/login                    | Login, MFA\*, Settings sections                    |
| SEC-AGG-004    | (logged in)             | /dashboard/admin/sin/audit     | Browse, filter, verify hash, export                |
| RP-AGG-003     | viasport-staff@demo.com | /dashboard/admin/sin/reporting | Create cycle, assign task, user completes, approve |
| **RP-AGG-005** | (logged in)             | /dashboard/analytics/explore   | **Ask AI, NL query, pivot chart, export, save**    |
| DM-AGG-001     | viasport-staff@demo.com | /dashboard/sin/forms           | Fill form, upload file, submit                     |
| DM-AGG-006     | viasport-staff@demo.com | /dashboard/admin/sin/imports   | Template, upload error/clean, complete import      |

_\* MFA must be enabled manually before recording SEC-AGG-001_

---

## Sample NL Query Questions for RP-AGG-005

The UI shows three **"Try:" example buttons** - these are reliable choices:

| Built-in Example                             | Expected Output                          |
| -------------------------------------------- | ---------------------------------------- |
| "How many registrations by sport in 2023?"   | Count grouped by sport, filtered to 2023 |
| "Show me total participants by organization" | Sum of participants grouped by org       |
| "What are the monthly submission counts?"    | Time-series count by month               |

**Additional questions to try:**

| Question                                           | Expected Output                       |
| -------------------------------------------------- | ------------------------------------- |
| "Show form submissions by organization and status" | Table grouped by org + status columns |
| "Which organizations have pending submissions?"    | Filtered list with status = pending   |
| "Compare approved vs pending submissions by org"   | Status breakdown per org              |

**Tips:**

- Click a **"Try:" example button** for guaranteed high confidence
- If typing your own question and confidence is low (< 70%), rephrase or use an example
- Shorter, more direct questions work better than complex ones

---

_Document created: 2026-01-13_
_Updated: 2026-01-14 - Added NL Query feature to RP-AGG-005, updated demo credentials (MFA disabled by default)_
_Verified: 2026-01-14 - Confirmed guide matches NL Query implementation (nl-query-input.tsx, query-preview.tsx, query-results.tsx)_
