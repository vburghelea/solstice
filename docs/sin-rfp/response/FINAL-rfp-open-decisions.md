# Open Decisions for RFP Finalization

These items require your decision or external inputs. They are organized by priority and blocking status.

**Note:** Austin's decisions are marked with ✅ and shown in bold.

---

## Priority 1: Blocking for Final Assembly

### 1.1 Company Name and Legal Details ✅ DECIDED

**Decision:**

- Legal name: **Austin Wallace Tech Corporation** (first use: "Austin Wallace Tech Corporation (Austin Wallace Tech)")
- After first use: "Austin Wallace Tech" in prose

**Contact Details (for cover page):**

- Address: **1403-728 Yates Street, Victoria, BC V8W 0C8**
- Email: **austin@solsticeapp.ca**
- Phone: **604-603-8668**

**Format:**

- No cover letter (not required)
- Visual cover page (Austin creating in Canva)
- Contact box on cover page instead of separate authorized contacts page

**Impact:** Appears on cover page, footer

---

### 1.2 Pricing Figures ✅ DECIDED

**Decision:**
| Line Item | Amount |
|-----------|--------|
| Implementation fee (one-time) | **$600,000** |
| Annual subscription (recurring) | **$200,000** |
| 3-year total | **$1,200,000** |
| 5-year total | **$1,600,000** |

**Math verification:**

- 3-year: $600k + ($200k × 3) = $1.2M ✓
- 5-year: $600k + ($200k × 5) = $1.6M ✓

**Additional decisions:**

- Pricing can appear anywhere in the document (not confidential)
- Include optional add-ons with prices: **Yes**
- Include in-kind contributions: **Yes** (clearly labeled as credits/offsets)

**Impact:** Executive Summary "At a Glance" table, Commercial Model section

---

### 1.3 Authorized Contacts ✅ DECIDED

**Decision:** No separate authorized contacts page (single-principal vendor, contact info on cover page is sufficient)

**Impact:** N/A - removed from document structure

---

### 1.4 Demo Credentials Handling ✅ DECIDED

**Decision:**

- Credentials included directly in **Appendix A**
- Clear "demo-only / not production" disclaimer
- Environment available for the entire review period

**Final sin-uat credentials:**

| User                      | Password        | Platform Role  | Org Membership                 | MFA | Access Scope                       |
| ------------------------- | --------------- | -------------- | ------------------------------ | --- | ---------------------------------- |
| `global-admin@demo.com`   | demopassword123 | Solstice Admin | **None**                       | Yes | Platform admin pages only          |
| `viasport-staff@demo.com` | testpassword123 | viaSport Admin | viaSport BC: **owner**         | Yes | **Everything** including Analytics |
| `pso-admin@demo.com`      | testpassword123 | None           | BC Hockey: **admin**           | No  | BC Hockey org features, Analytics  |
| `club-reporter@demo.com`  | testpassword123 | None           | North Shore Club: **reporter** | No  | Club reporting, Analytics          |
| `member@demo.com`         | testpassword123 | None           | Vancouver Minor: **viewer**    | No  | View-only access, NO Analytics     |

**Rate limiting approach:**

- **Do NOT fully disable rate limiting** (it's part of the security story)
- **Raise thresholds** to be evaluator-friendly:
  - Allow ~30 login attempts per 15 minutes per account/IP before throttling
  - Account lockout after repeated failures still exists
- **Add unlock support line in appendix:**
  > "If you get locked out, email `support@solsticeapp.ca` for immediate unlock."
- **Add "Reset demo data" capability** (manual process) to restore baseline if evaluators change settings

**Credential Security:**

- **Credentials will be rotated** after the review period ends
- Access is monitored; abuse triggers IP blocks
- Add note to Appendix A: "Credentials valid during evaluation period only"

**Impact:** Prototype Evaluation Guide, Appendix A

---

## Priority 2: Important for Quality

### 2.1 Video Delivery Method ✅ DECIDED

**Decision:**

- **Primary:** Unlisted YouTube links (youtu.be shortened links)
- **Backup:** MP4 files in submission ZIP (`/videos/` folder)
- **No QR codes** (use text links instead)

**Video index (with durations - TBD to be measured):**

| ID  | Title                | File                                            | Duration |
| --- | -------------------- | ----------------------------------------------- | -------- |
| V1  | Authentication & MFA | `SEC-AGG-001-auth-mfa-login-flow-FINAL.mp4`     | TBD      |
| V2  | Form Submission      | `DM-AGG-001-form-submission-flow-FINAL.mp4`     | TBD      |
| V3  | Data Import          | `DM-AGG-006-import-wizard-flow-FINAL.mp4`       | TBD      |
| V4  | Reporting Cycles     | `RP-AGG-003-reporting-workflow-flow-FINAL.mp4`  | TBD      |
| V5  | Analytics & Export   | `RP-AGG-005-analytics-export-flow-FINAL.mp4`    | TBD      |
| V6  | Audit Logs           | `SEC-AGG-004-audit-verification-flow-FINAL.mp4` | TBD      |

**Fallback note (add everywhere videos are referenced):**

> "If YouTube is blocked, see `/videos/` in the submission ZIP."

**Note:** Videos may be re-recorded for better flow, but content and filenames remain the same.

**Impact:** Executive Summary video index, evidence delivery

---

### 2.2 Cover Letter Inclusion ✅ DECIDED

**Decision:** No cover letter (start directly with Executive Summary)

**Impact:** N/A - removed from document structure

---

### 2.3 SLA Targets ✅ DECIDED

**Decision:**
| Metric | Target |
|--------|--------|
| Availability | **99.5%** |
| Severity 1 response | **60 minutes** |
| Severity 2 response | **4 hours** |
| RPO (Recovery Point Objective) | **1 hour** |
| RTO (Recovery Time Objective) | **4 hours** |

**Additional decisions:**

- Penalty/credit language: **No** (not included)
- Hypercare period: **UAT through 1 month post go-live**

**Impact:** Service Levels section, Executive Summary

---

### 2.4 Case Studies and References ✅ DECIDED

**Decision:**

- Include case studies with **named** clients (not full case study format, brief mentions)
  - **Teck Resources:** Named, include
  - **New Jersey Devils:** Named, include
  - **Clio:** Named, include
- Client references: **No** (not including contact information)

**Impact:** Capabilities and Experience section

---

### 2.5 Team Bios ✅ DECIDED

**Current status:** All bios complete and accurate

- Austin Wallace: Bio exists ✓
- Ruslan Hétu: Bio exists ✓
- Soleil Heaney: Bio exists ✓
- Will Siddall: Bio exists ✓
- Parul Kharub: Bio exists ✓
- Michael Casinha: Bio exists ✓
- Tyler Piller: Bio exists ✓

**Decision:**

- All bios confirmed accurate
- **Include headshots** (GridMatrix-style format, see page 14 of GridMatrix sample)
- Bios appear **only in Appendix F** (no duplication in main body)

**Impact:** Appendix F

---

## Priority 3: Nice to Have

### 3.1 Branding and Visual Identity ✅ DECIDED & IMPLEMENTED

**Decision:**

- Color palette: **viaSport palette** (implemented in application, see `docs/tickets/VIASPORT-BRANDING-UPDATE.md`)
  - Primary: Dark Teal `#003B4D` for headers, navigation, text emphasis
  - Secondary: Teal `#00675B` for CTAs, buttons, interactive elements
  - Backgrounds: Light Mint `#DCF6EC`, Light Sage `#ACDECB` for callouts/cards
  - Success: Bright Green `#00BC70` for success states
  - All combinations WCAG AAA compliant (10.5:1 for text, 5.2:1+ for UI)
  - Grayscale printing verified
- Solstice logo: **No** (not available)
- Cover page hero image: Austin creating separately in Canva
- **Application branding:** Implemented January 2026 - sin-uat and all SIN environments now use viaSport brand colors

**Impact:** Visual presentation throughout, screenshots now show viaSport-branded interface

---

### 3.2 AI and Automation Positioning ✅ DECIDED

**Decision:**

- AI emphasis: **Moderate** (mention AI potential with responsible AI framing)
- Reference underlying AI framework as implemented
- See `docs/sin-rfp/tickets/AI-FEATURE-OPTIONS.md` for feature details

**Impact:** Capabilities section, Executive Summary

---

### 3.3 Timeline Assumptions ✅ DECIDED

**Decision:**
| Item | Decision |
|------|----------|
| Target go-live | **Fall 2026** |
| Data freeze window | **2 business days** |
| Hypercare period | **UAT through 1 month post go-live** |
| Parallel run | **No** (not required) |

**Note:** Remove "Downtime and Continuity Expectations" section since no parallel run.

**Impact:** Project Plan section, Migration section

---

### 3.4 Exceptions or Contract Deviations ✅ DECIDED

**Decision:** No exceptions section (we don't have viaSport's contract terms yet)

**Impact:** N/A - omitted from document structure

---

### 3.5 Third-Party Assessments ✅ DECIDED

**Decision:**

- No third-party assessments currently scheduled
- Present as **optional add-on**, priced at-cost of mutually selected third-party providers

**Impact:** Security section (mention as optional add-on)

---

### 3.6 Evidence Pack Scope ✅ DECIDED

**Decision:**

- Include **curated images** in evidence pack (`docs/sin-rfp/response/evidence-pack/`)
- Curated from full requirement-by-requirement evidence folder
- Raw logs (DR drills, encryption status) can be included if helpful

**Impact:** Appendix I, submission ZIP size

---

### 3.7 Compliance Crosswalk Format ✅ DECIDED

**Decision:**

- Current format is correct:
  - Req ID
  - Title
  - Status
  - Evaluation Environment (Jan 2026)
  - Finalization Scope
- Adding Evidence column would be good but may make table too wide
- **Recommendation:** Keep current format, add Evidence column if space allows

**Impact:** System Requirements Compliance Crosswalk section

---

## Evidence Status Summary

**Note:** Most requirements have existing evidence from the Dec 28 and Jan 10 capture sessions.

**Screenshot retake plan:** May retake all evidence screenshots for consistency (same viewport, zoom, seed data, naming convention tied to figure IDs). This should be tracked as a ticket.

### Evidence Confirmed (23 of 25 requirements)

- DM-AGG-001, DM-AGG-002, DM-AGG-003, DM-AGG-004, DM-AGG-005, DM-AGG-006
- RP-AGG-001, RP-AGG-002, RP-AGG-003, RP-AGG-004, RP-AGG-005
- SEC-AGG-001, SEC-AGG-002, SEC-AGG-003, SEC-AGG-004
- TO-AGG-001, TO-AGG-003
- UI-AGG-001, UI-AGG-002, UI-AGG-003, UI-AGG-004, UI-AGG-006, UI-AGG-007

### Missing Screenshots to Capture (2 items)

| Requirement | Missing Screenshot | Description                        | Notes                                           |
| ----------- | ------------------ | ---------------------------------- | ----------------------------------------------- |
| TO-AGG-002  | Walkthroughs       | Guided onboarding overlay          | Feature may need scoping for Finalization phase |
| UI-AGG-005  | Search/filter      | Content navigation, search results | Could use analytics filter as partial evidence  |

**Resolved:**
| UI-AGG-007 | Design consistency | ✅ viaSport branding implemented | Screenshots now show consistent brand styling |

#### Recommended Handling for Missing Items

**TO-AGG-002 (Guided onboarding walkthrough):**

| Option                  | Approach                                                                                     | Effort |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------ |
| **Path A (Best)**       | Implement minimal onboarding: "Getting Started" checklist panel + first-login guided overlay | Medium |
| **Path B (Acceptable)** | Explicit Finalization Scope with design approach, delivery timing, acceptance criteria       | Low    |

If Path B:

- Proposed design approach: Step-by-step overlay with role-specific guidance
- Delivery timing: Training & Onboarding phase (weeks 12-14)
- viaSport input needed: Content, roles, sequence
- Definition of done: Completion tracking visible in analytics

**UI-AGG-005 (Search/filter navigation):**

If global search isn't implemented, satisfy the spirit with:

1. Screenshot showing filter controls in a list view (e.g., submissions, orgs)
2. Screenshot showing filtered results state
3. (Optional) Screenshot of saved filter/view if available

Evidence options:

- Analytics filter panel
- Reporting list with search
- Organization list with filter

**Action needed:** Capture remaining screenshots before final assembly, or document as "Finalization Scope" with specific acceptance criteria.

---

## Questions for viaSport (If Clarification Needed)

See `docs/sin-rfp/source/VIASPORT-QA-2026-01-08.md` for full Q&A context.

These questions have been addressed with assumptions (documented in "Assumptions, Dependencies, and Finalization Scope" section):

| Question                          | Our Assumption                                            |
| --------------------------------- | --------------------------------------------------------- |
| Legacy system access (BCAR, BCSI) | Direct export available, credentials provided by viaSport |
| Data freeze tolerance             | 2 business days                                           |
| Parallel run requirement          | Not required                                              |
| Retention policy defaults         | 7-year default, configurable per type                     |
| MFA policy                        | Configurable by viaSport                                  |

---

## Decision Tracking

| Decision            | Status         | Choice Made                          | Date     |
| ------------------- | -------------- | ------------------------------------ | -------- |
| Company name        | ✅ Decided     | Austin Wallace Tech Corporation      | Jan 2026 |
| Pricing figures     | ✅ Decided     | $600k impl / $200k annual            | Jan 2026 |
| Authorized contacts | ✅ Decided     | No separate page                     | Jan 2026 |
| Demo credentials    | ✅ Decided     | In Appendix A                        | Jan 2026 |
| Video delivery      | ✅ Decided     | YouTube + ZIP backup                 | Jan 2026 |
| Cover letter        | ✅ Decided     | No cover letter                      | Jan 2026 |
| SLA targets         | ✅ Decided     | 99.5% / 60min / 4hr                  | Jan 2026 |
| Case studies        | ✅ Decided     | Named (Teck, Devils, Clio)           | Jan 2026 |
| Branding            | ✅ Implemented | viaSport palette (Dark Teal #003B4D) | Jan 2026 |
| AI positioning      | ✅ Decided     | Moderate                             | Jan 2026 |
| Timeline            | ✅ Decided     | Fall 2026 / 2-day freeze             | Jan 2026 |
| Exceptions          | ✅ Decided     | Omit section                         | Jan 2026 |
| Evidence scope      | ✅ Decided     | Curated pack                         | Jan 2026 |
| Crosswalk format    | ✅ Decided     | Current format                       | Jan 2026 |

---

## Next Steps

All Priority 1 decisions are now made. Next steps:

1. **Finalize Executive Summary** with confirmed pricing and team info
2. **Set up demo access** with credentials and rate limiting adjustments
3. **Assemble submission package** with video delivery (YouTube + ZIP)
4. **Final proofread** for consistency:
   - Company name formatting
   - No typos (especially `solticeapp.ca` → `solsticeapp.ca`)
   - Figure/video numbering consistency
5. **Generate PDF** with all confirmed details
6. **Create submission ZIP** with evidence pack and videos

---

## Action Items (from GPT-5.2-pro Feedback)

### Must-do (quality / scoring / risk)

1. ✅ Fix all domain/email typos (`solticeapp.ca` vs `solsticeapp.ca`)
2. [ ] Standardize figure + video IDs (DM-1, V1-V6)
3. [ ] Add evaluator-path lines to evidence callouts
4. [ ] Implement or explicitly scope 2 missing items:
   - TO-AGG-002 onboarding walkthrough
   - UI-AGG-005 search/filter
   - ~~UI-AGG-007 design consistency montage / theming proof~~ ✅ viaSport branding implemented

### Strongly recommended (makes eval smoother)

5. [ ] Retake screenshots in controlled setup (same viewport, zoom, seed data)
6. [ ] Add "Assumptions / Dependencies / Finalization Scope" table (added to structure plan)
7. [ ] Add video durations + fallback note ("see ZIP if blocked")
