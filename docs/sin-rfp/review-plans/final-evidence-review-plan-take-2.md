# Final Evidence Review Plan - Top 6 Requirements (sin-uat)

Evidence for the six most impressive requirements in the compliance crosswalk.

- Screenshots via MCP (audit-friendly)
- Short Playwright videos for "hero" flows (stakeholder-friendly)

## Scope (Top 6 Requirements)

1. **SEC-AGG-001** - Authentication and Access Control
2. **SEC-AGG-004** - Audit Trail and Data Lineage
3. **RP-AGG-003** - Reporting Flow and Support
4. **RP-AGG-005** - Self-Service Analytics and Data Export
5. **DM-AGG-001** - Data Collection and Submission
6. **DM-AGG-006** - Legacy Data Migration and Bulk Import

## Current Evidence Status

| Requirement | Screenshots | Video            | Frames | Status       |
| ----------- | ----------- | ---------------- | ------ | ------------ |
| SEC-AGG-001 | 4           | FINAL.mp4 (359K) | 49     | **Complete** |
| SEC-AGG-004 | 5           | FINAL.mp4 (349K) | 50     | **Complete** |
| RP-AGG-003  | 4           | FINAL.mp4 (393K) | 20     | **Complete** |
| RP-AGG-005  | 3           | FINAL.mp4 (639K) | 53     | **Complete** |
| DM-AGG-001  | 7           | FINAL.mp4 (561K) | 35     | **Complete** |
| DM-AGG-006  | 14+         | FINAL.mp4 (607K) | 53     | **Complete** |

All videos: H.264 MP4, 1440x900, 25fps, faststart

## Evidence Output Structure

```
docs/sin-rfp/review-plans/evidence/2026-01-10/
├── screenshots/
│   ├── SEC-AGG-001/
│   ├── SEC-AGG-004/
│   ├── RP-AGG-003/
│   ├── RP-AGG-005/
│   ├── DM-AGG-001/
│   └── DM-AGG-006/
└── videos/
    ├── *-FINAL.mp4 (6 videos)
    └── frames/ (2fps extracts for review)
```

**Naming**: Screenshots `<NN>-<description>.png`, Videos `<REQID>-<feature>-FINAL.mp4`

---

## Preflight Checklist (for re-recording)

1. Login: `viasport-staff@example.com` / `testpassword123`
2. TOTP secret (base32): `ONXWY43UNFRWKLLUMVZXILLUN52HALLTMVRXEZLUFUZTEY3IMFZA`
3. Clear browser cookies before recording
4. Viewport: 1440x900
5. Storage state: `outputs/sin-uat-storage.json`

---

## Evidence Flows (Step-by-Step)

### 1) SEC-AGG-001 - Authentication & Access Control

**Script**: `scripts/record-sin-uat-login-video.ts`

**Flow**:

1. `/auth/login` → enter email
2. Enter password → submit
3. MFA challenge → enter TOTP
4. Land on `/dashboard/select-org` → select org
5. Navigate to `/dashboard/settings` → show MFA status

---

### 2) SEC-AGG-004 - Audit Trail & Data Lineage

**Script**: `scripts/record-sin-uat-sec-agg-004.ts`

**Flow**:

1. `/dashboard/admin/sin/audit`
2. Filter by `Action category = EXPORT`
3. Show BI:EXPORT entry
4. Click **Verify hash chain** → show success

---

### 3) RP-AGG-003 - Reporting Flow & Support

**Script**: `scripts/record-sin-uat-rp-agg-003.ts`

**Flow**:

1. `/dashboard/admin/sin/reporting`
2. Show reporting cycles list
3. Show task assignment form
4. Navigate to submissions table

---

### 4) RP-AGG-005 - Self-Service Analytics & Data Export

**Script**: `scripts/verify-sin-analytics.ts`

**Flow**:

1. `/dashboard/analytics/explore`
2. Select Organizations dataset
3. Add Parent Organization to Rows
4. Run query → show results
5. Show Export CSV/Excel/JSON buttons

---

### 5) DM-AGG-001 - Data Collection & Submission (Forms)

**Script**: `scripts/record-sin-uat-dm-agg-001.ts`

**Flow**:

1. `/dashboard/admin/sin/forms` → show form builder
2. Navigate to `/dashboard/sin/forms`
3. Show forms list (or empty state)

---

### 6) DM-AGG-006 - Legacy Data Migration & Bulk Import

**Script**: `scripts/record-sin-uat-dm-agg-006.ts`

**Flow**:

1. `/dashboard/admin/sin/imports?tab=wizard`
2. Select org (viaSport BC) and form (Annual Statistics Report)
3. Upload CSV: `docs/sin-rfp/legacy-data-samples/import-demo-annual-stats.csv`
4. Show auto-mapping (7 columns)
5. Click "Create import job"
6. Switch to History tab → show pending entry

---

## Frame-by-Frame Video Review

All 6 FINAL videos extracted at 2fps (260 total frames) and reviewed.

### SEC-AGG-001 (49 frames)

| Frames | Content                                    |
| ------ | ------------------------------------------ |
| 1-5    | Login page → email entered                 |
| 6-12   | Password step → "Logging in..."            |
| 13-18  | MFA prompt → TOTP entered → "Verifying..." |
| 19-21  | Org selection → dropdown expanded          |
| 22-28  | SIN Portal dashboard                       |
| 29-49  | Account Settings (MFA section visible)     |

### SEC-AGG-004 (50 frames)

| Frames | Content                            |
| ------ | ---------------------------------- |
| 1-9    | Empty Audit Log page               |
| 10-36  | 2 login entries (AUTH, SECURITY)   |
| 37-38  | Category dropdown → EXPORT filter  |
| 39-40  | 2 BI:EXPORT entries                |
| 41-50  | "Hash chain verified successfully" |

### RP-AGG-003 (20 frames)

| Frames | Content                                 |
| ------ | --------------------------------------- |
| 1-10   | Reporting admin (cycle creation form)   |
| 11-12  | "Q2 2026 Quarterly" typed               |
| 13-20  | Submissions table (5 BC Hockey entries) |

### RP-AGG-005 (53 frames)

| Frames | Content                               |
| ------ | ------------------------------------- |
| 1-38   | Pivot builder (Organizations dataset) |
| 39     | Scrolled to export buttons            |
| 40-48  | "Loading preview..."                  |
| 49-53  | Query results displayed               |

### DM-AGG-001 (35 frames)

| Frames | Content                   |
| ------ | ------------------------- |
| 1-4    | Org selection → dashboard |
| 5-11   | Admin Forms page          |
| 12-29  | Dashboard (stats loading) |
| 30-35  | Forms page (empty state)  |

### DM-AGG-006 (53 frames)

| Frames | Content                                          |
| ------ | ------------------------------------------------ |
| 1-7    | Loading → org selection                          |
| 8-14   | Org dropdown → dashboard                         |
| 15-27  | Import wizard → form selection                   |
| 31-37  | File uploaded (167 bytes), 7 columns auto-mapped |
| 38-46  | **"Import job created"** (success)               |
| 50-53  | History tab with Pending entry                   |

---

## Related Issues

- **[SIN-IMPORT-WIZARD-FAILED-TO-FETCH](../../issues/SIN-IMPORT-WIZARD-FAILED-TO-FETCH.md)** - ✅ FIXED
  - Root cause: CSP `connect-src` missing S3 bucket domain
  - Fix: Added `https://*.s3.ca-central-1.amazonaws.com` to CSP in `sst.config.ts`

---

## Key Fixes Applied (2026-01-11)

| Fix             | Location                       | Notes                                 |
| --------------- | ------------------------------ | ------------------------------------- |
| CSP connect-src | `sst.config.ts:433`            | Added S3 wildcard for uploads         |
| S3 CORS         | `sst.config.ts`                | All SIN domains allowed               |
| Presigned URL   | `artifacts.ts`                 | No longer signs Content-Type/Length   |
| Demo CSV        | `import-demo-annual-stats.csv` | Matches Annual Statistics Report form |
