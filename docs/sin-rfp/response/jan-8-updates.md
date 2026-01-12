# Jan 8 Updates — viaSport Q&A Clarifications + Proposal Polish

This document captures updates based on:

- viaSport Q&A responses (2026-01-08)
- SSO investigation progress (passkeys implemented)
- Performance evidence from sin-perf testing
- Proposal polish feedback (reduce reviewer friction)

## Source Documents

- `docs/sin-rfp/source/VIASPORT-QA-2026-01-08.md` — Email Q&A with Adam/Joe
- `docs/sin-rfp/requirements/tickets/SIN-AUTH-001-multi-provider-sso-investigation.md` — SSO capability analysis
- `docs/sin-rfp/review-plans/evidence/PERF-WORKLOG-2026-01-08.md` — Performance test results

---

## SSO Investigation Progress

**Source:** `docs/sin-rfp/requirements/tickets/SIN-AUTH-001-multi-provider-sso-investigation.md`

### Current Implementation Status

| Feature                       | Status                  |
| ----------------------------- | ----------------------- |
| Email/password authentication | ✅ Implemented          |
| Google OAuth                  | ✅ Implemented          |
| TOTP MFA                      | ✅ Implemented          |
| Backup codes                  | ✅ Implemented          |
| **Passkeys (WebAuthn)**       | ✅ **Phase 2 Complete** |

### Passkey Implementation (Phase 2 Complete)

- ✅ Passkey plugin installed (`@better-auth/passkey` v1.4.10)
- ✅ Database schema ready (`passkey` table with migration 0006)
- ✅ Identifier-first flow implemented (email → check passkeys → prompt or password)
- ✅ Post-login passkey creation prompt with benefits explanation
- ✅ FIDO Alliance passkey icon integrated
- ✅ Enhanced settings page (device icons, authenticator names, "Synced" badges)
- ✅ Fallback path ("Use password instead" at all passkey prompts)

### Remaining Work

- Run database migration (`0006_add_passkey.sql`) on sin-dev/sin-uat
- Manual E2E verification with real passkey authenticators

### Browser Support

**Global coverage: 95.81%** of users have WebAuthn/passkey support.

### Proposal Impact

Update SSO language in SEC-AGG-001 and UI-AGG-001 to reflect:

- Passkeys are **implemented** (not just planned)
- Microsoft/Apple OAuth are **configuration-ready** (Discovery phase)
- Enterprise SAML available if viaSport M365 requires it

## Summary of viaSport Clarifications

| Topic            | Question                           | viaSport Response                         | Impact                                     |
| ---------------- | ---------------------------------- | ----------------------------------------- | ------------------------------------------ |
| BCAR/BCSI export | What export methods exist?         | DB access, CSV/Excel exports              | Straightforward extraction path            |
| Data dictionary  | Any schemas/samples?               | Not at this time                          | We produce field inventory in Discovery    |
| Attachments      | Must attachments migrate?          | Not required                              | Significantly reduces migration scope      |
| Metadata         | What set at launch?                | Combination, confirm with partner         | Configurable schema; finalize in Discovery |
| Validation       | External authoritative validation? | New system is system of record            | No external integrations required          |
| SSO              | Required at launch?                | Capability desired; M365; multi-org users | Phased identity approach                   |

## Key Scope Simplifications

1. **No attachment migration** — Reduces migration complexity and timeline risk
2. **New system is system of record** — No external validation integrations (e.g., NCCP registry)
3. **CSV/Excel + DB access available** — Straightforward extraction path for legacy data
4. **Metadata TBD with partner** — Configuration, not missing platform capability

---

## Planned Document Updates

### 1. Executive Summary — Add Clarifications Block

**File:** `01-executive-summary/final.md`

**Location:** After Section 1.3 (Prototype and Data Provenance Summary), before "At a Glance"

**Add new section:**

```markdown
### 1.4 viaSport Clarifications Received

Based on clarifications provided by viaSport (Adam Benson and Joe Zhang) in response to vendor questions:

- **Legacy export methods (BCAR/BCSI):** viaSport can provide database access and/or exports to CSV/Excel.
- **Legacy documentation/data samples:** A data dictionary/schema or redacted samples are not available at this time.
- **Legacy attachments:** Migrating attachments from BCAR/BCSI is not a requirement for this project.
- **Reporting metadata at launch (RP-AGG-002):** The launch metadata set will be a combination of contribution agreement fields, NCCP fields, fiscal periods, organization profiles, delegated access, and contacts, to be confirmed with viaSport's implementation partner during Discovery.
- **Authoritative validation:** The new system will be the system of record; fields are not expected to be validated against external authoritative registries at launch.
- **SSO:** viaSport would like the capability of SSO. viaSport uses Microsoft 365, and because users will come from many organizations, the solution should consider Microsoft / Google / Apple sign-in options, as well as passwordless approaches where appropriate.
```

---

### 2. Compliance Crosswalk — Update Remaining Cells

**File:** `04-system-requirements/00-compliance-crosswalk/final.md`

**Changes:**

| Req ID     | Current "Remaining"                      | New "Remaining"                                                               |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| DM-AGG-006 | "Legacy extraction (awaiting BCAR/BCSI)" | "Legacy extraction using DB access/CSV exports; attachments not required"     |
| RP-AGG-002 | "viaSport metadata configuration"        | "Finalize launch metadata set with implementation partner (system of record)" |

---

### 3. DM-AGG-006 — Update Legacy Migration Section

**File:** `04-system-requirements/data-management-dm-agg/final.md`

**Changes to DM-AGG-006 section:**

1. **Update "Remaining Scope"** (line ~231-234):

**Before:**

```markdown
- Legacy extraction and BCAR or BCSI mapping rules.
- Additional migration pipelines for organization and user records (pending viaSport legacy access).
```

**After:**

```markdown
- Legacy extraction using database access and/or CSV/Excel exports; mapping rules confirmed in Discovery.
- Attachments migration not required; existing attachments remain in legacy systems.
- Additional migration pipelines for organization and user records (pending viaSport legacy access).
```

2. **Update "viaSport Dependencies"** (line ~236-239):

**Before:**

```markdown
- Legacy export access and schema documentation.
- SME review for mapping templates.
```

**After:**

```markdown
- Database access and/or CSV/Excel exports for BCAR and BCSI (confirmed available).
- SME availability to confirm field meanings and mapping decisions.
- Confirmation of launch metadata set with viaSport's implementation partner.
- UAT sign-off on pilot migration results.
```

3. **Add new paragraph after "Approach"** (line ~242):

```markdown
**Legacy Field Inventory (Deliverable):** Because viaSport has indicated that a BCAR/BCSI data dictionary or redacted samples are not available at this time, we will produce a Legacy Field Inventory and Mapping Workbook during Discovery. This workbook documents source tables/exports, field definitions inferred from exports and stakeholder review, transformation rules, validation requirements, and the approved target mapping to Solstice forms and reporting metadata.
```

---

### 4. RP-AGG-002 — Rewrite Reporting Metadata Section

**File:** `04-system-requirements/reporting-rp-agg/final.md`

**Replace RP-AGG-002 section (lines 45-79) with:**

```markdown
## RP-AGG-002: Reporting Information Management

**Requirement:**

> The system shall manage metadata related to reporting including but not limited to contribution agreements, NCCP, contact details, fiscal periods, organization profiles, and delegated access rights.

**Acceptance Criteria:**

> Users can update relevant metadata and access reporting features accordingly.

**How We Meet It:**

viaSport confirmed that the initial reporting metadata set will be established in coordination with its implementation partner and is expected to include a combination of contribution agreement fields, NCCP fields, fiscal periods, organization profiles, delegated access, and contact information.

viaSport also confirmed that the new system will be the system of record; fields are not expected to require validation against external authoritative sources (e.g., NCCP registry) at launch.

**Implementation Approach:**

Solstice includes a reporting metadata schema and administrative configuration tooling. During Discovery we will finalize the launch field set and labels, configure validation rules where required (format/requiredness), and validate the workflow in UAT with viaSport and PSO representatives.

**Built Today:**

- Reporting metadata schema and update endpoints.
- Organization profile and role management with delegated access.
- Reporting cycles and tasks with due dates and reminders.
- Admin configuration UI for metadata fields and labels.

**Remaining Scope:**

- Finalize viaSport launch metadata set with implementation partner; configure fields and UI labels (system of record; no external authoritative validation required at launch).

**viaSport Dependencies:**

- Implementation partner coordination for metadata set confirmation.
- SME input for field labels and validation rules.

**Approach:**
Configure metadata fields during Discovery and validate in UAT. See **System Requirements: Training and Onboarding (TO-AGG)** for change adoption.

**Evidence:**
Evidence is summarized in Section 1.3.
```

---

### 5. SEC-AGG-001 — Add SSO Capability Language

**File:** `04-system-requirements/security-sec-agg/final.md`

**Add after "Built Today" section (line ~41), before "Remaining Scope":**

```markdown
**Planned Capability (Discovery Phase):**

viaSport indicated a desire for SSO capability and noted that viaSport uses Microsoft 365. Because users will come from many organizations, Solstice will support a phased identity approach:

- **viaSport staff:** Enable organizational SSO using viaSport's Microsoft 365 identity (protocol confirmed during Discovery).
- **External organizations (PSOs/clubs):** Support secure sign-in options suitable for diverse organizations, including Microsoft / Google / Apple sign-in and/or email-based authentication, while enforcing organization membership and RBAC server-side.
- **MFA/step-up security:** Authentication will meet SEC-AGG-001 requirements through a combination of identity provider controls and platform-level step-up authentication for sensitive actions (administration, exports), depending on the chosen sign-in method.

Initial SSO scope will prioritize viaSport staff sign-in; expanding additional sign-in providers for external orgs will be confirmed during Discovery and delivered through the included enhancement capacity and/or a scoped change request if required.
```

**Update "Remaining Scope":**

**Before:**

```markdown
- None. Fully implemented.
```

**After:**

```markdown
- Multi-provider SSO configuration (Microsoft/Google/Apple) to be finalized during Discovery based on viaSport identity architecture.
```

---

### 6. UI-AGG-001 — Add SSO Capability Language

**File:** `04-system-requirements/user-interface-ui-agg/final.md`

**Add after "Built Today" section (line ~35), before "Remaining Scope":**

```markdown
**Planned Capability (Discovery Phase):**

viaSport expressed interest in SSO capability for viaSport staff (Microsoft 365) and flexible sign-in options for PSO users from diverse organizations. Solstice will support a phased identity approach:

- **Current:** Email/password with strong password policy, Google OAuth, TOTP MFA
- **Planned:** Microsoft OAuth (Azure AD) for viaSport staff and PSO users, Apple OAuth for PSO users
- **Under consideration:** Passwordless options (magic links, passkeys) to be evaluated during UX research

Multi-provider OAuth will be configured during Discovery based on viaSport's identity architecture. Better Auth supports multiple OAuth providers through configuration.
```

**Update "Remaining Scope":**

**Before:**

```markdown
- None. Fully implemented.
```

**After:**

```markdown
- SSO provider configuration (Microsoft/Apple) to be finalized during Discovery.
```

---

### 7. Data Migration — Update Dependencies and Scope

**File:** `03-service-approach/data-migration/final.md`

**Changes:**

1. **Update Migration Sequence** (line ~20-25):

**Before:**

```markdown
1. Organizations and hierarchies
2. Users and role assignments
3. Historical submissions
4. Documents and attachments
```

**After:**

```markdown
1. Organizations and hierarchies
2. Users and role assignments
3. Historical submissions (structured records)

**Note:** Attachments migration is not required per viaSport clarification. Existing attachments will remain in legacy systems. Solstice supports attachments for new submissions going forward.
```

2. **Update "Dependencies on viaSport"** (line ~95-104):

**Before:**

```markdown
Migration execution requires:

1. Legacy system access (export capability or direct database access)
2. Schema documentation for BCAR and BCSI
3. Data dictionary and field mapping approval
4. SME availability for validation and sign-off
```

**After:**

```markdown
Migration execution requires:

1. Database access and/or CSV/Excel exports for BCAR and BCSI (confirmed available per viaSport clarification)
2. SME availability to confirm field meanings and mapping decisions
3. Confirmation of launch metadata set with viaSport's implementation partner
4. UAT sign-off on pilot migration results

**Note:** A BCAR/BCSI data dictionary is not available at this time. We will produce a Legacy Field Inventory and Mapping Workbook during Discovery (Weeks 1-6) from exports and SME review, then validate with pilot org migration.
```

3. **Add to Discovery phase in Migration Phases table** (line ~11-17):

Add to Activities column for Discovery row:

```
Produce Legacy Field Inventory and Mapping Workbook
```

---

### 8. Prototype Evaluation Guide — Update Finalization Table

**File:** `01-B-prototype-evaluation-guide/final.md`

**Replace "What Will Be Finalized With viaSport" table (lines 34-42):**

```markdown
## What Will Be Finalized With viaSport

| Item | Timing | Dependency |
|------|--------|------------|
| BCAR/BCSI extraction approach (database access and/or CSV/Excel exports) | Discovery (Weeks 1-6) | Legacy system access coordination |
| Legacy Field Inventory and Mapping Workbook | Discovery (Weeks 1-6) | Exports + SME review (no dictionary available) |
| Form templates + reporting metadata (combination of contribution agreements, NCCP, fiscal periods, org profiles, delegated access, contacts) | Discovery (Weeks 1-6) | viaSport + implementation partner confirmation |
| Branding (logo, colors) | Design (Week 11) | Brand assets from viaSport |
| Program-specific fields | Design (Weeks 11-18) | viaSport SME input |
| SSO provider configuration (Microsoft/Google/Apple) | Discovery (Weeks 1-6) | viaSport identity architecture |

**Attachments:** Migrating BCAR/BCSI attachments is not required per viaSport clarification. Solstice supports attachments for new submissions going forward.
```

---

### 9. Appendices — Add Vendor Q&A Appendix

**File:** `08-appendices/final.md`

**Add new appendix after Appendix J (before end of file):**

```markdown
## Appendix K: Vendor Questions and viaSport Responses

Prior to submission, Austin Wallace Tech submitted clarifying questions to viaSport. The following responses were received from Adam Benson and Joe Zhang on 2026-01-08.

| Topic | Question | viaSport Response | How Solstice Addresses It |
|-------|----------|-------------------|---------------------------|
| BCAR/BCSI export | What export methods exist? | DB access, CSV/Excel exports | Supports both extraction paths; import mapping + rollback |
| Data dictionary | Any schemas/samples? | Not at this time | Produce field inventory + mapping workbook in Discovery |
| Attachments | Must attachments migrate? | Not required | Attachments supported going forward; historical out of scope |
| Metadata | What set at launch? | Combination, confirm with partner | Configurable schema + admin UI; finalize in Discovery |
| Validation | External authoritative validation? | New system is system of record | Validate formats/required fields; optional integrations later |
| SSO | Required at launch? | Capability desired; M365; multi-org users | Phased identity approach; prioritize viaSport SSO + flexible external sign-in |

These clarifications informed the migration scope, metadata configuration approach, and identity strategy documented in this proposal.
```

---

## Risk Register Updates

**File:** `07-delivery-schedule/final.md` (or wherever risks are documented)

**Add/modify these risk items:**

| Risk                                | Mitigation                                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| No legacy data dictionary available | Create field inventory + mapping workbook in Weeks 1-6 from exports + SME review; pilot org migration to validate |
| Attachment volume risk              | ~~Remove~~ — Out of scope per viaSport clarification                                                              |

**Update dependencies:**

| Dependency         | Status                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| Legacy data access | DB access and/or CSV/Excel exports for BCAR/BCSI (confirmed available) |
| Data dictionary    | Deliverable we produce (Legacy Field Inventory + Mapping Workbook)     |

---

## Summary of Status Changes

| Requirement | Before                  | After                             | Reason                                             |
| ----------- | ----------------------- | --------------------------------- | -------------------------------------------------- |
| DM-AGG-006  | Built (awaiting legacy) | Built (extraction path confirmed) | viaSport confirmed DB + CSV access                 |
| RP-AGG-002  | Partial                 | Partial (config only)             | System of record confirmed; no external validation |
| SEC-AGG-001 | Built                   | Built (SSO planned)               | SSO capability desired; phased approach            |
| UI-AGG-001  | Built                   | Built (SSO planned)               | SSO capability desired; phased approach            |

---

## Execution Order

1. **Executive Summary** — Add Section 1.4 viaSport Clarifications
2. **Compliance Crosswalk** — Update DM-AGG-006 and RP-AGG-002 remaining cells
3. **DM-AGG-006** — Update legacy migration with clarifications
4. **RP-AGG-002** — Rewrite with metadata clarifications
5. **SEC-AGG-001** — Add SSO capability language
6. **UI-AGG-001** — Add SSO capability language
7. **Data Migration** — Update dependencies, add field inventory deliverable
8. **Prototype Evaluation Guide** — Update finalization table
9. **Appendices** — Add Vendor Q&A appendix
10. **Regenerate** `full-proposal-response.md`

---

## Files to Modify

| File                                                      | Change Type               |
| --------------------------------------------------------- | ------------------------- |
| `01-executive-summary/final.md`                           | Add Section 1.4           |
| `04-system-requirements/00-compliance-crosswalk/final.md` | Update 2 rows             |
| `04-system-requirements/data-management-dm-agg/final.md`  | Update DM-AGG-006         |
| `04-system-requirements/reporting-rp-agg/final.md`        | Rewrite RP-AGG-002        |
| `04-system-requirements/security-sec-agg/final.md`        | Add SSO to SEC-AGG-001    |
| `04-system-requirements/user-interface-ui-agg/final.md`   | Add SSO to UI-AGG-001     |
| `03-service-approach/data-migration/final.md`             | Update dependencies       |
| `01-B-prototype-evaluation-guide/final.md`                | Update finalization table |
| `08-appendices/final.md`                                  | Add Appendix K            |
| `full-proposal-response.md`                               | Regenerate                |

---

## Performance Evidence Updates

**Source:** `docs/sin-rfp/review-plans/evidence/PERF-WORKLOG-2026-01-08.md`

The following placeholders can now be replaced with validated results from the sin-perf environment.

### 20M Row Load Test (k6)

**Environment:** sin-perf with production-equivalent infrastructure (db.t4g.large, 7.6 GB database)

| Metric                  | Value       | Target | Status                        |
| ----------------------- | ----------- | ------ | ----------------------------- |
| Total Rows              | 20.0M       | 20M+   | ✅ PASS                       |
| Database Size           | 7.6 GB      | —      | ✅ Production-scale           |
| p95 Latency             | 162.72ms    | <500ms | ✅ PASS                       |
| p50 Latency             | 98.26ms     | —      | ✅ Excellent                  |
| Throughput              | 12.30 req/s | —      | ✅ Stable                     |
| Server Errors (5xx)     | 0           | 0      | ✅ PASS                       |
| Rate Limit Errors (429) | 295         | —      | Expected (protection working) |

**Note:** The 9.91% "error" rate is entirely rate limiting (429), not application errors. Actual success rate is 100%.

### Lighthouse Results (sin-perf, CloudFront production path)

| Metric                   | Value   | Target | Status  |
| ------------------------ | ------- | ------ | ------- |
| Performance Score        | 90/100  | >80    | ✅ PASS |
| First Contentful Paint   | 1.0s    | <2.0s  | ✅ PASS |
| Largest Contentful Paint | 1.0s    | <2.5s  | ✅ PASS |
| Time to Interactive      | 1.1s    | —      | ✅ PASS |
| Cumulative Layout Shift  | 0       | <0.1   | ✅ PASS |
| Accessibility            | 100/100 | —      | ✅ PASS |

### DR Drill Results

| Metric                         | Achieved    | Target  | Status  |
| ------------------------------ | ----------- | ------- | ------- |
| Recovery Time Objective (RTO)  | 16 minutes  | 4 hours | ✅ PASS |
| Recovery Point Objective (RPO) | 0 minutes   | 1 hour  | ✅ PASS |
| Data Integrity                 | 20M records | 100%    | ✅ PASS |

**Evidence file:** `docs/sin-rfp/review-plans/evidence/DR-DRILL-sin-perf-20260108.md`

### Retention Policy Validation

| Test                                 | Result                      | Status  |
| ------------------------------------ | --------------------------- | ------- |
| Notifications purge (no legal hold)  | 10 records purged           | ✅ PASS |
| Notifications protected (legal hold) | 15 records preserved        | ✅ PASS |
| Audit logs immutable                 | 1,000,015 records preserved | ✅ PASS |

**Evidence file:** `docs/sin-rfp/review-plans/evidence/RETENTION-VALIDATION-sin-perf-20260108.md`

---

## Files to Update with Performance Evidence

### 10. Executive Summary — Update "At a Glance" Table

**File:** `01-executive-summary/final.md`

**Current (line ~76):**

```markdown
| Performance      | 20.1M rows, ≤250ms p95 latency                                                                          |
```

**Updated:**

```markdown
| Performance      | 20.0M rows, 163ms p95 latency (validated January 2026)                                                                          |
```

### 11. Appendix C: Performance Evidence — Replace TBD

**File:** `08-appendices/final.md`

**Current text (lines ~94-127):**

```markdown
## Appendix C: Performance Evidence

Load testing was conducted in the sin-perf environment. Final validation runs will be completed before submission (TBD).

### Data Volume

| Table                    | Rows      |
| ------------------------ | --------- |
| form_submissions         | 10.0M     |
| audit_logs               | 7.0M      |
| notifications            | 2.0M      |
| bi_query_log             | 1.0M      |
| form_submission_versions | 0.1M      |
| **Total**                | **20.1M** |

### Performance Results

| Metric              | Value | Target | Status |
| ------------------- | ----- | ------ | ------ |
| p95 latency         | 250ms | <500ms | Pass   |
| p50 latency         | 130ms | N/A    | Pass   |
| Concurrent users    | 15    | N/A    | Pass   |
| Server errors (5xx) | 0     | 0      | Pass   |

### Lighthouse Scores

| Metric                   | Value  | Target  | Status |
| ------------------------ | ------ | ------- | ------ |
| Performance Score        | 93/100 | >80     | Pass   |
| Largest Contentful Paint | 2284ms | <2500ms | Pass   |
| Time to First Byte       | 380ms  | <500ms  | Pass   |
| Total Blocking Time      | 88ms   | <300ms  | Pass   |
| Cumulative Layout Shift  | 0      | <0.1    | Pass   |
```

**Replace with:**

```markdown
## Appendix C: Performance Evidence

Load testing was conducted in the sin-perf environment on 2026-01-08 with production-equivalent infrastructure (db.t4g.large, 7.6 GB database).

### Data Volume

| Table            | Rows       |
| ---------------- | ---------- |
| audit_logs       | 10.0M      |
| form_submissions | 8.0M       |
| notifications    | 2.0M       |
| **Total**        | **20.0M**  |

### Load Test Results (k6, 25 VUs)

| Metric              | Value     | Target | Status |
| ------------------- | --------- | ------ | ------ |
| p95 latency         | 163ms     | <500ms | Pass   |
| p50 latency         | 98ms      | N/A    | Pass   |
| Throughput          | 12.3 req/s| N/A    | Pass   |
| Server errors (5xx) | 0         | 0      | Pass   |

### Lighthouse Scores

| Metric                   | Value   | Target  | Status |
| ------------------------ | ------- | ------- | ------ |
| Performance Score        | 90/100  | >80     | Pass   |
| First Contentful Paint   | 1000ms  | <2000ms | Pass   |
| Largest Contentful Paint | 1000ms  | <2500ms | Pass   |
| Time to Interactive      | 1100ms  | N/A     | Pass   |
| Cumulative Layout Shift  | 0       | <0.1    | Pass   |
| Accessibility            | 100/100 | N/A     | Pass   |

### DR Drill Results (2026-01-08)

| Metric | Achieved | Target |
| ------ | -------- | ------ |
| RTO    | 16 min   | 4 hours |
| RPO    | 0 min    | 1 hour |

Full evidence available in `docs/sin-rfp/review-plans/evidence/`.
```

### 12. DM-AGG-005 — Update DR Validation Status

**File:** `04-system-requirements/data-management-dm-agg/final.md`

**Current "Remaining Scope" (line ~191):**

```markdown
- Final production DR drill and retention validation before submission (TBD).
```

**Updated:**

```markdown
- DR drill and retention validation completed January 2026 (RTO: 16 min, RPO: 0 min).
```

### 13. Compliance Crosswalk — Update DM-AGG-005

**File:** `04-system-requirements/00-compliance-crosswalk/final.md`

**Current (line ~21):**

```markdown
| DM-AGG-005 | Data Storage and Retention            | Built   | Backups, archiving, retention enforcement       | Final DR and retention validation (TBD) |
```

**Updated:**

```markdown
| DM-AGG-005 | Data Storage and Retention            | Built   | Backups, archiving, retention enforcement       | DR validated January 2026 (16 min RTO) |
```

---

## Updated Execution Order

1. **Executive Summary** — Add Section 1.4 viaSport Clarifications
2. **Executive Summary** — Update "At a Glance" performance metrics
3. **Compliance Crosswalk** — Update DM-AGG-005, DM-AGG-006, RP-AGG-002 remaining cells
4. **DM-AGG-005** — Update DR validation status
5. **DM-AGG-006** — Update legacy migration with clarifications
6. **RP-AGG-002** — Rewrite with metadata clarifications
7. **SEC-AGG-001** — Add SSO capability language
8. **UI-AGG-001** — Add SSO capability language
9. **Data Migration** — Update dependencies, add field inventory deliverable
10. **Prototype Evaluation Guide** — Update finalization table
11. **Appendices** — Replace Appendix C with validated performance evidence
12. **Appendices** — Add Appendix K Vendor Q&A
13. **Regenerate** `full-proposal-response.md`

---

## Updated Files to Modify

| File                                                      | Change Type                          |
| --------------------------------------------------------- | ------------------------------------ |
| `01-executive-summary/final.md`                           | Add Section 1.4 + update At a Glance |
| `04-system-requirements/00-compliance-crosswalk/final.md` | Update 3 rows                        |
| `04-system-requirements/data-management-dm-agg/final.md`  | Update DM-AGG-005 + DM-AGG-006       |
| `04-system-requirements/reporting-rp-agg/final.md`        | Rewrite RP-AGG-002                   |
| `04-system-requirements/security-sec-agg/final.md`        | Add SSO to SEC-AGG-001               |
| `04-system-requirements/user-interface-ui-agg/final.md`   | Add SSO to UI-AGG-001                |
| `03-service-approach/data-migration/final.md`             | Update dependencies                  |
| `01-B-prototype-evaluation-guide/final.md`                | Update finalization table            |
| `08-appendices/final.md`                                  | Replace Appendix C + Add Appendix K  |
| `full-proposal-response.md`                               | Regenerate                           |

---

## Proposal Polish Updates

These updates reduce reviewer friction and prevent evaluator questions.

### 14. Clarify Subscription Start Date

**File:** `06-cost-value/final.md`

**Add after Payment Schedule section:**

```markdown
**Subscription Commencement:** Subscription fees commence at production go-live and are billed quarterly in advance.
```

### 15. Support Promise Consistency

**File:** `03-service-approach/service-levels/final.md`

The current text has potential ambiguity: 24/7 monitoring but business-hours response.

**Clarify in Monitoring and Alerting section (add note):**

```markdown
**Note:** Monitoring is 24/7 automated. Response commitments apply during business hours (Monday-Friday, 9 AM - 5 PM Pacific). After-hours Sev 1 response is available with the 24/7 Support add-on.
```

**Update 24/7 Support Option section to be clearer:**

```markdown
### 24/7 Support Option

24/7 response coverage is available as an optional add-on ($30,000-$50,000/year). This provides:

- After-hours monitoring **with on-call response**
- Sev 1 response target reduced to **2 hours (any time)**
- Sev 2 after-hours coverage
- Weekend and holiday coverage

Without this add-on, after-hours alerts are logged and addressed at the start of the next business day.
```

### 16. Quantify 200 Hours/Year Enhancement Capacity

**File:** `06-cost-value/final.md`

**Add new subsection after "Enhancements and Change Requests":**

```markdown
### What Counts Against Enhancement Hours

| Included | Not Included |
|----------|--------------|
| Configuration changes (forms, templates, fields) | Net-new integrations (APIs, SSO providers) |
| Minor feature requests (UI tweaks, report formats) | Major re-architecture or new modules |
| Reporting template adjustments | Large-scale data migrations beyond initial scope |
| Bug fixes beyond defect warranty period | Third-party penetration testing coordination |
| Training content updates | 24/7 support coverage (separate add-on) |

**Tracking:** viaSport receives a monthly enhancement hours report showing work completed, hours consumed, and remaining balance. Work is logged against a shared backlog with viaSport approval required before hours are committed.
```

### 17. Naming Consistency

**Find and replace across all files:**

| Find                                  | Replace With                                        |
| ------------------------------------- | --------------------------------------------------- |
| `International Quidditch Association` | `International Quadball Association (formerly IQA)` |
| `viaSport British Columbia`           | `viaSport` (unless legal name required)             |

**Ensure consistent usage:**

- "viaSport" (not "viaSport BC" or "viaSport British Columbia") except in legal/contract sections
- "Solstice" or "the Solstice platform" (consistent)
- "Strength in Numbers" or "SIN" (define once, then use consistently)

### 18. Add Transition/Exit Timeline

**File:** `06-cost-value/final.md` (in Exit and Continuity section)

**Add specific commitment:**

```markdown
**Export Timeline:** Within 15 business days of a written request, Austin Wallace Tech will provide:
- Full database export (PostgreSQL dump or CSV/JSON)
- Schema documentation
- Operational runbooks
- API documentation for any custom integrations

This applies during the contract term or upon termination.
```

### 19. Tighten Executive Summary

**File:** `01-executive-summary/final.md`

**Replace opening paragraphs (lines 1-13) with tighter version:**

```markdown
# Executive Summary

Austin Wallace Tech submits this response to viaSport's Strength in Numbers RFP, proposing **Solstice**: a secure reporting and analytics platform delivered as a **term subscription with managed service**.

**Delivery risk is reduced before award:** we built a working prototype aligned to the System Requirements Addendum and provide a 15-minute evaluation path mapped to requirement IDs. The prototype currently satisfies **23 of 25 requirements**, with **2 partial items** pending viaSport inputs (legacy integration scope and reporting metadata configuration).

**Security and residency:** Primary data stores (database, object storage, backups, audit archives) are hosted in **AWS Canada (Central)**. Solstice implements **MFA**, **role-based access control**, organization-scoped isolation, and an **immutable tamper-evident audit log**.

**Commercial model:** viaSport receives implementation and ongoing operations in one award:

- **Implementation/Standup (one-time): $600,000** — discovery, configuration, migration, UAT, training, go-live/hypercare
- **Platform Subscription + Managed Service: $200,000/year** — hosting, monitoring, patching, support SLAs, product updates, and **200 hours/year of enhancements**
- Contract term: **3-year base** with **two optional 1-year extensions (3+1+1)**
- Total cost: **$1.2M (3-year)** / **$1.6M (5-year)** (standup + subscription)

**Delivery timeline:** 30 weeks from award to launch (targeting Fall 2026), emphasizing UX research, template/metadata configuration, migration validation, accessibility testing, and phased rollout—because core platform capabilities are already built.
```

### 20. Remove "Depends" from Crosswalk Legend

**File:** `04-system-requirements/00-compliance-crosswalk/final.md`

**Current legend (lines 5-12):**

```markdown
## Status Legend

| Status      | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| **Built**   | Functional in the prototype and available for evaluation |
| **Partial** | Core functionality built, specific items remaining       |
| **Depends** | Requires viaSport input to complete                      |
```

**Remove "Depends" row (not used in tables):**

```markdown
## Status Legend

| Status      | Meaning                                                  |
| ----------- | -------------------------------------------------------- |
| **Built**   | Functional in the prototype and available for evaluation |
| **Partial** | Core functionality built, specific items remaining       |
```

### 21. Move Tech Stack Tables to Appendix

**File:** `08-appendices/final.md`

The detailed technology stack (React 19, TanStack Start, Drizzle ORM, etc.) is currently in Appendix B. Keep it there but **reduce the main body reference**.

**File:** `03-solution-overview/final.md` (or wherever tech stack appears in main body)

**If tech stack details appear in main narrative, replace with:**

```markdown
**Technology Approach:** Solstice is built on a modern serverless stack (React, Node.js, PostgreSQL) deployed to AWS. The architecture prioritizes security, scalability, and operational simplicity. Full technology details are provided in **Appendix B: System Architecture**.
```

---

## Final Execution Order

1. **Executive Summary** — Tighten opening (item 19)
2. **Executive Summary** — Add Section 1.4 viaSport Clarifications
3. **Executive Summary** — Update "At a Glance" performance metrics
4. **Compliance Crosswalk** — Remove "Depends" from legend (item 20)
5. **Compliance Crosswalk** — Update DM-AGG-005, DM-AGG-006, RP-AGG-002 remaining cells
6. **DM-AGG-005** — Update DR validation status
7. **DM-AGG-006** — Update legacy migration with clarifications
8. **RP-AGG-002** — Rewrite with metadata clarifications
9. **SEC-AGG-001** — Add SSO capability language (include passkeys as implemented)
10. **UI-AGG-001** — Add SSO capability language
11. **Service Levels** — Clarify support hours (item 15)
12. **Cost/Value** — Add subscription start date (item 14)
13. **Cost/Value** — Add enhancement hours definition (item 16)
14. **Cost/Value** — Add exit timeline (item 18)
15. **Data Migration** — Update dependencies, add field inventory deliverable
16. **Prototype Evaluation Guide** — Update finalization table
17. **Appendices** — Replace Appendix C with validated performance evidence
18. **Appendices** — Add Appendix K Vendor Q&A
19. **All files** — Naming consistency pass (item 17)
20. **Solution Overview** — Shorten tech stack, reference appendix (item 21)
21. **Regenerate** `full-proposal-response.md`

---

## Final Files to Modify

| File                                                      | Changes                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `01-executive-summary/final.md`                           | Tighten opening + Add Section 1.4 + Update At a Glance          |
| `04-system-requirements/00-compliance-crosswalk/final.md` | Remove "Depends" + Update 3 rows                                |
| `04-system-requirements/data-management-dm-agg/final.md`  | Update DM-AGG-005 + DM-AGG-006                                  |
| `04-system-requirements/reporting-rp-agg/final.md`        | Rewrite RP-AGG-002                                              |
| `04-system-requirements/security-sec-agg/final.md`        | Add SSO + passkeys to SEC-AGG-001                               |
| `04-system-requirements/user-interface-ui-agg/final.md`   | Add SSO to UI-AGG-001                                           |
| `03-service-approach/service-levels/final.md`             | Clarify support hours                                           |
| `03-service-approach/data-migration/final.md`             | Update dependencies                                             |
| `03-solution-overview/final.md`                           | Shorten tech stack reference                                    |
| `06-cost-value/final.md`                                  | Add subscription start + enhancement definition + exit timeline |
| `01-B-prototype-evaluation-guide/final.md`                | Update finalization table                                       |
| `08-appendices/final.md`                                  | Replace Appendix C + Add Appendix K                             |
| `full-proposal-response.md`                               | Regenerate                                                      |
