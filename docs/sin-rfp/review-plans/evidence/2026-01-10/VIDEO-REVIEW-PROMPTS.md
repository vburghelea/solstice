# Video Review Agent Prompts

Six prompts for systematically reviewing each RFP evidence video. Each prompt is designed to:

> **IMPORTANT: Coordination Required**
> All agents MUST use the central worklog at `VIDEO-REVIEW-WORKLOG.md` to coordinate blocking operations.
>
> - Read the worklog before starting
> - Claim locks before using MCP browser, ffmpeg, or editing shared files
> - Release locks when done

1. Read the context documents (VIDEO-IMPROVEMENT-ANALYSIS.md, VIDEO-EXCELLENCE-PLAN.md)
2. Extract frames from the FINAL video at 2fps
3. Spawn a subagent to analyze every frame and produce a detailed table
4. Categorize each issue found (code, script, data, or mcp/capture issue)
5. Create a remediation plan in a linked markdown file

---

## Prompt 1: DM-AGG-001 - Form Submission Flow

````
# Task: Comprehensive Video Review - DM-AGG-001 Form Submission

## Context
You are reviewing the DM-AGG-001 form submission video for the SIN RFP evidence package. This video demonstrates the data management capability for form creation and submission workflows.

## Step 0: Register in Worklog
Read and update `docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-REVIEW-WORKLOG.md`:
1. Check if any conflicting resources are locked
2. Add yourself to "Active Sessions" table
3. Log: `### [TIMESTAMP] - DM-AGG-001 - SESSION_START - STARTED`

## Step 1: Read Context Documents
Read these files to understand the quality standards and known issues:
- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-IMPROVEMENT-ANALYSIS.md
- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-EXCELLENCE-PLAN.md
- scripts/record-sin-uat-dm-agg-001.ts

## Step 2: Extract Frames at 2fps
Run this command to extract frames:
```bash
VIDEO="DM-AGG-001-form-submission-flow-FINAL.mp4"
FRAMES_DIR="docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/DM-AGG-001-form-submission-flow-FINAL-2fps"
mkdir -p "$FRAMES_DIR"
ffmpeg -i "docs/sin-rfp/review-plans/evidence/2026-01-10/videos/$VIDEO" \
  -vf "fps=2" "$FRAMES_DIR/frame_%03d.png"
````

## Step 3: Launch Frame Analysis Subagent

Spawn a subagent with this prompt:

---

Task: Analyze video frames for DM-AGG-001 form submission flow

Read every PNG file in `docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/DM-AGG-001-form-submission-flow-FINAL-2fps/` sequentially.

For each frame, note:

1. What is visible on screen
2. What changed from the previous frame
3. Any potential issues (blank screens, loading spinners >4 frames, error states, static content >10 frames, incomplete UI, missing elements)

Output a markdown table with columns:
| Frames | What's On Screen / Changed | Potential Issues |
|--------|---------------------------|------------------|

Group consecutive frames with identical content. Flag:

- Blank/loading frames lasting >2 seconds (>4 frames)
- Static content lasting >5 seconds (>10 frames)
- Error messages or red text visible
- Missing UI elements expected per the ideal flow
- Form fields that should be filled but appear empty
- Submit buttons that should be clicked but aren't
- Success toasts that should appear but don't

---

## Step 4: Issue Categorization

For each issue identified in the frame analysis, categorize as:

1. **Code Issue** - Missing UI element, badge not showing, feature not working
2. **Script Issue** - Action not performed, wrong navigation, timing problem
3. **Data Issue** - Empty state, missing test data, wrong data values
4. **MCP/Capture Issue** - Recording artifact, frame timing, encoding problem

## Step 5: Create Remediation Plan

Create a markdown file at:
`docs/sin-rfp/review-plans/evidence/2026-01-10/DM-AGG-001-remediation-plan.md`

Structure:

```markdown
# DM-AGG-001 Remediation Plan

Generated: [date]

## Frame Analysis Summary
[Summary table from subagent]

## Issues Found

### Code Issues
| Issue | Location | Fix Required |
|-------|----------|--------------|

### Script Issues
| Issue | Script Line | Fix Required |
|-------|-------------|--------------|

### Data Issues
| Issue | Seed Location | Fix Required |
|-------|---------------|--------------|

### MCP/Capture Issues
| Issue | Cause | Fix Required |
|-------|-------|--------------|

## Recommended Actions
1. [Priority action 1]
2. [Priority action 2]
...

## Re-recording Checklist
- [ ] Fix applied: [issue 1]
- [ ] Fix applied: [issue 2]
...
```

## Step 6: Link in VIDEO-IMPROVEMENT-ANALYSIS.md

**Before editing:** Claim lock on `VIDEO-IMPROVEMENT-ANALYSIS.md` in worklog.

Add a link to the remediation plan in the DM-AGG-001 section of VIDEO-IMPROVEMENT-ANALYSIS.md:

```markdown
**Remediation Plan:** [DM-AGG-001-remediation-plan.md](./DM-AGG-001-remediation-plan.md)
```

**After editing:** Release lock in worklog.

## Step 7: Complete Session in Worklog

Update `VIDEO-REVIEW-WORKLOG.md`:

1. Log: `### [TIMESTAMP] - DM-AGG-001 - SESSION_END - COMPLETED`
2. Move yourself from "Active Sessions" to "Completed Reviews"
3. Note issues found count in "Completed Reviews" table

```

---

## Prompt 2: DM-AGG-006 - Import Wizard Flow

```

# Task: Comprehensive Video Review - DM-AGG-006 Import Wizard

## Context

You are reviewing the DM-AGG-006 import wizard video for the SIN RFP evidence package. This video demonstrates the data management capability for legacy data import with validation.

## Step 0: Register in Worklog

Read and update `docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-REVIEW-WORKLOG.md`:

1. Check if any conflicting resources are locked
2. Add yourself to "Active Sessions" table
3. Log: `### [TIMESTAMP] - DM-AGG-006 - SESSION_START - STARTED`

## Step 1: Read Context Documents

Read these files to understand the quality standards and known issues:

- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-IMPROVEMENT-ANALYSIS.md
- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-EXCELLENCE-PLAN.md
- scripts/record-sin-uat-dm-agg-006.ts

## Step 2: Extract Frames at 2fps

Run this command to extract frames:

```bash
VIDEO="DM-AGG-006-import-wizard-flow-FINAL.mp4"
FRAMES_DIR="docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/DM-AGG-006-import-wizard-flow-FINAL-2fps"
mkdir -p "$FRAMES_DIR"
ffmpeg -i "docs/sin-rfp/review-plans/evidence/2026-01-10/videos/$VIDEO" \
  -vf "fps=2" "$FRAMES_DIR/frame_%03d.png"
```

## Step 3: Launch Frame Analysis Subagent

Spawn a subagent with this prompt:

---

Task: Analyze video frames for DM-AGG-006 import wizard flow

Read every PNG file in `docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/DM-AGG-006-import-wizard-flow-FINAL-2fps/` sequentially.

For each frame, note:

1. What is visible on screen
2. What changed from the previous frame
3. Any potential issues (blank screens, loading spinners >4 frames, error states, static content >10 frames, incomplete UI, missing elements)

Output a markdown table with columns:
| Frames | What's On Screen / Changed | Potential Issues |
|--------|---------------------------|------------------|

Group consecutive frames with identical content. Flag:

- Blank/loading frames lasting >2 seconds (>4 frames)
- Static content lasting >5 seconds (>10 frames)
- Validation errors visible but not clearly explained
- Import status stuck on "pending" (should show "completed")
- Missing template download step
- Row count not visible (should show "50 rows")
- Form submissions not verified after import

---

## Step 4: Issue Categorization

For each issue identified in the frame analysis, categorize as:

1. **Code Issue** - Missing UI element, import not completing, validation not showing
2. **Script Issue** - Step skipped, wrong CSV uploaded, not waiting for completion
3. **Data Issue** - Wrong CSV content, missing template, seed data incomplete
4. **MCP/Capture Issue** - Recording artifact, frame timing, encoding problem

## Step 5: Create Remediation Plan

Create a markdown file at:
`docs/sin-rfp/review-plans/evidence/2026-01-10/DM-AGG-006-remediation-plan.md`

Structure as shown in Prompt 1.

## Step 6: Link in VIDEO-IMPROVEMENT-ANALYSIS.md

**Before editing:** Claim lock on `VIDEO-IMPROVEMENT-ANALYSIS.md` in worklog.

Add a link to the remediation plan in the DM-AGG-006 section of VIDEO-IMPROVEMENT-ANALYSIS.md:

```markdown
**Remediation Plan:** [DM-AGG-006-remediation-plan.md](./DM-AGG-006-remediation-plan.md)
```

**After editing:** Release lock in worklog.

## Step 7: Complete Session in Worklog

Update `VIDEO-REVIEW-WORKLOG.md`:

1. Log: `### [TIMESTAMP] - DM-AGG-006 - SESSION_END - COMPLETED`
2. Move yourself from "Active Sessions" to "Completed Reviews"
3. Note issues found count in "Completed Reviews" table

```

---

## Prompt 3: RP-AGG-003 - Reporting Workflow

```

# Task: Comprehensive Video Review - RP-AGG-003 Reporting Workflow

## Context

You are reviewing the RP-AGG-003 reporting workflow video for the SIN RFP evidence package. This video demonstrates the reporting cycle management with task assignment, user submission, and admin approval.

## Step 0: Register in Worklog

Read and update `docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-REVIEW-WORKLOG.md`:

1. Check if any conflicting resources are locked
2. Add yourself to "Active Sessions" table
3. Log: `### [TIMESTAMP] - RP-AGG-003 - SESSION_START - STARTED`

## Step 1: Read Context Documents

Read these files to understand the quality standards and known issues:

- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-IMPROVEMENT-ANALYSIS.md
- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-EXCELLENCE-PLAN.md
- scripts/record-sin-uat-rp-agg-003.ts
- scripts/record-sin-uat-rp-agg-003-admin.ts (helper script if exists)

## Step 2: Extract Frames at 2fps

Run this command to extract frames:

```bash
VIDEO="RP-AGG-003-reporting-workflow-flow-FINAL.mp4"
FRAMES_DIR="docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/RP-AGG-003-reporting-workflow-flow-FINAL-2fps"
mkdir -p "$FRAMES_DIR"
ffmpeg -i "docs/sin-rfp/review-plans/evidence/2026-01-10/videos/$VIDEO" \
  -vf "fps=2" "$FRAMES_DIR/frame_%03d.png"
```

## Step 3: Launch Frame Analysis Subagent

Spawn a subagent with this prompt:

---

Task: Analyze video frames for RP-AGG-003 reporting workflow

Read every PNG file in `docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/RP-AGG-003-reporting-workflow-flow-FINAL-2fps/` sequentially.

For each frame, note:

1. What is visible on screen
2. What changed from the previous frame
3. Any potential issues

Output a markdown table with columns:
| Frames | What's On Screen / Changed | Potential Issues |
|--------|---------------------------|------------------|

CRITICAL: This video was previously noted as having ALL BLANK FRAMES (script crash). Verify if this is still the case.

Flag:

- Blank/white frames (CRITICAL if >50% of video is blank)
- Missing cycle creation flow
- Missing task assignment with reminder config
- Missing user perspective switch
- Missing task completion flow
- Missing admin approval flow
- Status not changing from "pending" to "submitted" to "approved"

---

## Step 4: Issue Categorization

Categorize each issue as:

1. **Code Issue** - UI bug, feature not working
2. **Script Issue** - Crash, missing navigation, wrong flow order
3. **Data Issue** - No cycles seeded, no tasks seeded, missing forms
4. **MCP/Capture Issue** - Browser didn't launch, auth failed, page didn't load

## Step 5: Create Remediation Plan

Create a markdown file at:
`docs/sin-rfp/review-plans/evidence/2026-01-10/RP-AGG-003-remediation-plan.md`

Structure as shown in Prompt 1.

## Step 6: Link in VIDEO-IMPROVEMENT-ANALYSIS.md

**Before editing:** Claim lock on `VIDEO-IMPROVEMENT-ANALYSIS.md` in worklog.

Add a link to the remediation plan in the RP-AGG-003 section of VIDEO-IMPROVEMENT-ANALYSIS.md:

```markdown
**Remediation Plan:** [RP-AGG-003-remediation-plan.md](./RP-AGG-003-remediation-plan.md)
```

**After editing:** Release lock in worklog.

## Step 7: Complete Session in Worklog

Update `VIDEO-REVIEW-WORKLOG.md`:

1. Log: `### [TIMESTAMP] - RP-AGG-003 - SESSION_END - COMPLETED`
2. Move yourself from "Active Sessions" to "Completed Reviews"
3. Note issues found count in "Completed Reviews" table

```

---

## Prompt 4: RP-AGG-005 - Analytics Export

```

# Task: Comprehensive Video Review - RP-AGG-005 Analytics Export

## Context

You are reviewing the RP-AGG-005 analytics export video for the SIN RFP evidence package. This video demonstrates the BI pivot builder, chart visualization, step-up authentication for export, and dashboard save functionality.

## Step 0: Register in Worklog

Read and update `docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-REVIEW-WORKLOG.md`:

1. Check if any conflicting resources are locked
2. Add yourself to "Active Sessions" table
3. Log: `### [TIMESTAMP] - RP-AGG-005 - SESSION_START - STARTED`

## Step 1: Read Context Documents

Read these files to understand the quality standards and known issues:

- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-IMPROVEMENT-ANALYSIS.md
- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-EXCELLENCE-PLAN.md
- scripts/record-sin-uat-rp-agg-005.ts

## Step 2: Extract Frames at 2fps

Run this command to extract frames:

```bash
VIDEO="RP-AGG-005-analytics-export-flow-FINAL.mp4"
FRAMES_DIR="docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/RP-AGG-005-analytics-export-flow-FINAL-2fps"
mkdir -p "$FRAMES_DIR"
ffmpeg -i "docs/sin-rfp/review-plans/evidence/2026-01-10/videos/$VIDEO" \
  -vf "fps=2" "$FRAMES_DIR/frame_%03d.png"
```

## Step 3: Launch Frame Analysis Subagent

Spawn a subagent with this prompt:

---

Task: Analyze video frames for RP-AGG-005 analytics export flow

Read every PNG file in `docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/RP-AGG-005-analytics-export-flow-FINAL-2fps/` sequentially.

For each frame, note:

1. What is visible on screen
2. What changed from the previous frame
3. Any potential issues

Output a markdown table with columns:
| Frames | What's On Screen / Changed | Potential Issues |
|--------|---------------------------|------------------|

Flag:

- Excessive static time in pivot builder (>10 frames)
- Only 1 organization in results (should be 10+)
- Export CSV button visible but never clicked
- Step-up auth modal NOT appearing (CRITICAL - key security feature)
- No TOTP code entry shown
- No "Export complete" toast
- Dashboard widget ending with spinner (should fully render)
- Minimal pivot configuration (should have org/status/count)

---

## Step 4: Issue Categorization

Categorize each issue as:

1. **Code Issue** - Step-up not triggering, export not working
2. **Script Issue** - Export button not clicked, step skipped
3. **Data Issue** - Only 1 org seeded, no form submissions
4. **MCP/Capture Issue** - Recording ended too early, frame timing

## Step 5: Create Remediation Plan

Create a markdown file at:
`docs/sin-rfp/review-plans/evidence/2026-01-10/RP-AGG-005-remediation-plan.md`

Structure as shown in Prompt 1.

## Step 6: Link in VIDEO-IMPROVEMENT-ANALYSIS.md

**Before editing:** Claim lock on `VIDEO-IMPROVEMENT-ANALYSIS.md` in worklog.

Add a link to the remediation plan in the RP-AGG-005 section of VIDEO-IMPROVEMENT-ANALYSIS.md:

```markdown
**Remediation Plan:** [RP-AGG-005-remediation-plan.md](./RP-AGG-005-remediation-plan.md)
```

**After editing:** Release lock in worklog.

## Step 7: Complete Session in Worklog

Update `VIDEO-REVIEW-WORKLOG.md`:

1. Log: `### [TIMESTAMP] - RP-AGG-005 - SESSION_END - COMPLETED`
2. Move yourself from "Active Sessions" to "Completed Reviews"
3. Note issues found count in "Completed Reviews" table

```

---

## Prompt 5: SEC-AGG-001 - Auth & MFA Login

```

# Task: Comprehensive Video Review - SEC-AGG-001 Auth & MFA Login

## Context

You are reviewing the SEC-AGG-001 authentication and MFA video for the SIN RFP evidence package. This video demonstrates secure login with MFA, the MFA enabled badge in settings, passkey registration, and active session management.

## Step 0: Register in Worklog

Read and update `docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-REVIEW-WORKLOG.md`:

1. Check if any conflicting resources are locked
2. Add yourself to "Active Sessions" table
3. Log: `### [TIMESTAMP] - SEC-AGG-001 - SESSION_START - STARTED`

## Step 1: Read Context Documents

Read these files to understand the quality standards and known issues:

- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-IMPROVEMENT-ANALYSIS.md
- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-EXCELLENCE-PLAN.md
- scripts/record-sin-uat-sec-agg-001.ts
- scripts/record-sin-uat-login-video.ts (alternative script)

## Step 2: Extract Frames at 2fps

Run this command to extract frames:

```bash
VIDEO="SEC-AGG-001-auth-mfa-login-flow-FINAL.mp4"
FRAMES_DIR="docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/SEC-AGG-001-auth-mfa-login-flow-FINAL-2fps"
mkdir -p "$FRAMES_DIR"
ffmpeg -i "docs/sin-rfp/review-plans/evidence/2026-01-10/videos/$VIDEO" \
  -vf "fps=2" "$FRAMES_DIR/frame_%03d.png"
```

## Step 3: Launch Frame Analysis Subagent

Spawn a subagent with this prompt:

---

Task: Analyze video frames for SEC-AGG-001 auth MFA login flow

Read every PNG file in `docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/SEC-AGG-001-auth-mfa-login-flow-FINAL-2fps/` sequentially.

For each frame, note:

1. What is visible on screen
2. What changed from the previous frame
3. Any potential issues

Output a markdown table with columns:
| Frames | What's On Screen / Changed | Potential Issues |
|--------|---------------------------|------------------|

Flag:

- Settings page showing "Enable MFA" button instead of "MFA Enabled" badge (CRITICAL)
- "No passkeys yet" message (should show registered passkeys)
- Active Sessions section missing entirely
- Excessive static time on any single view (>10 frames)
- Onboarding modal shown too long
- No passkey registration flow demonstrated
- No session revocation shown

---

## Step 4: Issue Categorization

Categorize each issue as:

1. **Code Issue** - MFA badge not rendering, passkeys section bug
2. **Script Issue** - Not scrolling to show sections, timing issues
3. **Data Issue** - User doesn't have MFA enabled in DB, no passkeys seeded
4. **MCP/Capture Issue** - Recording artifact, page load timing

## Step 5: Create Remediation Plan

Create a markdown file at:
`docs/sin-rfp/review-plans/evidence/2026-01-10/SEC-AGG-001-remediation-plan.md`

Structure as shown in Prompt 1.

## Step 6: Link in VIDEO-IMPROVEMENT-ANALYSIS.md

**Before editing:** Claim lock on `VIDEO-IMPROVEMENT-ANALYSIS.md` in worklog.

Add a link to the remediation plan in the SEC-AGG-001 section of VIDEO-IMPROVEMENT-ANALYSIS.md:

```markdown
**Remediation Plan:** [SEC-AGG-001-remediation-plan.md](./SEC-AGG-001-remediation-plan.md)
```

**After editing:** Release lock in worklog.

## Step 7: Complete Session in Worklog

Update `VIDEO-REVIEW-WORKLOG.md`:

1. Log: `### [TIMESTAMP] - SEC-AGG-001 - SESSION_END - COMPLETED`
2. Move yourself from "Active Sessions" to "Completed Reviews"
3. Note issues found count in "Completed Reviews" table

```

---

## Prompt 6: SEC-AGG-004 - Audit Trail Verification

```

# Task: Comprehensive Video Review - SEC-AGG-004 Audit Trail

## Context

You are reviewing the SEC-AGG-004 audit trail video for the SIN RFP evidence package. This video demonstrates the tamper-evident audit log with hash chain verification, PII access badges, step-up authentication badges, and export functionality.

## Step 0: Register in Worklog

Read and update `docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-REVIEW-WORKLOG.md`:

1. Check if any conflicting resources are locked
2. Add yourself to "Active Sessions" table
3. Log: `### [TIMESTAMP] - SEC-AGG-004 - SESSION_START - STARTED`

## Step 1: Read Context Documents

Read these files to understand the quality standards and known issues:

- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-IMPROVEMENT-ANALYSIS.md
- docs/sin-rfp/review-plans/evidence/2026-01-10/VIDEO-EXCELLENCE-PLAN.md
- scripts/record-sin-uat-sec-agg-004.ts

## Step 2: Extract Frames at 2fps

Run this command to extract frames:

```bash
VIDEO="SEC-AGG-004-audit-verification-flow-FINAL.mp4"
FRAMES_DIR="docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/SEC-AGG-004-audit-verification-flow-FINAL-2fps"
mkdir -p "$FRAMES_DIR"
ffmpeg -i "docs/sin-rfp/review-plans/evidence/2026-01-10/videos/$VIDEO" \
  -vf "fps=2" "$FRAMES_DIR/frame_%03d.png"
```

## Step 3: Launch Frame Analysis Subagent

Spawn a subagent with this prompt:

---

Task: Analyze video frames for SEC-AGG-004 audit trail verification

Read every PNG file in `docs/sin-rfp/review-plans/evidence/2026-01-10/videos/frames/SEC-AGG-004-audit-verification-flow-FINAL-2fps/` sequentially.

For each frame, note:

1. What is visible on screen
2. What changed from the previous frame
3. Any potential issues

Output a markdown table with columns:
| Frames | What's On Screen / Changed | Potential Issues |
|--------|---------------------------|------------------|

CRITICAL FLAGS:

- "No audit entries yet" empty state shown (CRITICAL - should have 200+ entries)
- "Hash chain invalid" error in RED (CRITICAL - hash chain must verify successfully)
- Only 2 entries visible (should be 20+ diverse entries)
- No PII badges visible (red "PII" badge should appear on some entries)
- No Step-up badges visible (should appear on EXPORT entries)
- Export CSV button visible but never clicked
- No entry detail panel shown (should click an entry to show details)
- Date filter not demonstrated

---

## Step 4: Issue Categorization

Categorize each issue as:

1. **Code Issue** - Hash chain calculation bug, badge rendering issue
2. **Script Issue** - Not clicking entries, not using filters, not exporting
3. **Data Issue** - Not enough audit entries, missing PII/step-up metadata, invalid hash chain
4. **MCP/Capture Issue** - Page not fully loaded, timing issues

## Step 5: Create Remediation Plan

Create a markdown file at:
`docs/sin-rfp/review-plans/evidence/2026-01-10/SEC-AGG-004-remediation-plan.md`

Structure as shown in Prompt 1.

## Step 6: Link in VIDEO-IMPROVEMENT-ANALYSIS.md

**Before editing:** Claim lock on `VIDEO-IMPROVEMENT-ANALYSIS.md` in worklog.

Add a link to the remediation plan in the SEC-AGG-004 section of VIDEO-IMPROVEMENT-ANALYSIS.md:

```markdown
**Remediation Plan:** [SEC-AGG-004-remediation-plan.md](./SEC-AGG-004-remediation-plan.md)
```

**After editing:** Release lock in worklog.

## Step 7: Complete Session in Worklog

Update `VIDEO-REVIEW-WORKLOG.md`:

1. Log: `### [TIMESTAMP] - SEC-AGG-004 - SESSION_END - COMPLETED`
2. Move yourself from "Active Sessions" to "Completed Reviews"
3. Note issues found count in "Completed Reviews" table

````

---

## Usage Instructions

### Running Reviews in Parallel

Multiple agents CAN run in parallel for frame extraction and analysis, but must coordinate via the worklog for:
- MCP browser access (one at a time only)
- Editing VIDEO-IMPROVEMENT-ANALYSIS.md (one at a time only)

### Execution Steps

1. Copy one prompt at a time into a new Claude Code session
2. The agent will:
   - **Step 0**: Register in `VIDEO-REVIEW-WORKLOG.md`
   - **Step 1**: Read context documents
   - **Step 2**: Extract frames using ffmpeg (CAN run in parallel - different output dirs)
   - **Step 3**: Spawn subagent for frame-by-frame analysis
   - **Step 4**: Categorize issues (code/script/data/mcp)
   - **Step 5**: Create remediation plan markdown
   - **Step 6**: Link in VIDEO-IMPROVEMENT-ANALYSIS.md (MUST claim lock)
   - **Step 7**: Complete session in worklog

3. After all 6 reviews complete, you'll have:
   - 6 remediation plan markdown files
   - VIDEO-IMPROVEMENT-ANALYSIS.md updated with links
   - Clear action items categorized by type
   - Full audit trail in VIDEO-REVIEW-WORKLOG.md

### Monitoring Progress

Check `VIDEO-REVIEW-WORKLOG.md` to see:
- Which agents are currently active
- Which resources are locked
- Which reviews have completed
- Any escalated issues

## Subagent Frame Analysis Template

For reference, here's the standard subagent output format:

```markdown
## Frame Analysis: [VIDEO_NAME]

Analyzed [N] frames at 2fps ([duration]s video)

| Frames | What's On Screen / Changed | Potential Issues |
|--------|---------------------------|------------------|
| 1-3    | Blank/loading screen | Blank frames >2s |
| 4-8    | Login page, email entry | None |
| 9-15   | Password, MFA prompt | None |
| 16-30  | Dashboard, static | Too long static (7.5s) |
| 31-35  | Settings page | Missing MFA badge |

### Summary
- Total frames: N
- Blank frames: X (Y%)
- Static sections: Z
- Critical issues: A
- Minor issues: B
````
