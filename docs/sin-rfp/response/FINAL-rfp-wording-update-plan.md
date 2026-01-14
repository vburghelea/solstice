# RFP Wording Update Plan - Final Enhanced Version

This plan provides specific wording changes, organized by:

1. Global language standards
2. Critical cleanup items
3. Section-by-section wording fixes
4. Terminology consistency
5. Tone and voice alignment

---

## 1. Global Language Standards

### 1.1 Formatting Rules

| Rule               | Correct                   | Incorrect                   |
| ------------------ | ------------------------- | --------------------------- |
| Dashes             | Use commas or parentheses | Avoid em dashes (—)         |
| Sentence length    | Short, direct sentences   | Long compound sentences     |
| Evidence           | Always cite Figure/Video  | Generic "as shown"          |
| Section references | Use exact section titles  | Use folder names or numbers |

### 1.2 Standard Phrases to Adopt

**Data Residency (use verbatim):**

> "Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Authenticated content is configured to avoid edge caching. Email notifications are delivered to recipients and may traverse external networks."

**AWS Compliance (use verbatim):**

> "AWS compliance reports (SOC, ISO) are available via AWS Artifact upon request."

**Shared Responsibility (use verbatim):**

> "AWS secures the underlying cloud infrastructure and we implement and operate application-level controls, configuration, and monitoring."

**Prototype Data Provenance (use verbatim):**

> "No viaSport data was used in the evaluation environment. Synthetic data matches the scale described in the RFP."

### 1.3 Words to Replace Globally

| Replace                      | With                                     | Reason                                    |
| ---------------------------- | ---------------------------------------- | ----------------------------------------- |
| "perfect"                    | "strong fit" or "low-risk fit"           | Defensible in procurement                 |
| "best-in-class"              | "production-ready" or "tested"           | Verifiable                                |
| "world-class"                | specific metric (e.g., "99.5% uptime")   | Measurable                                |
| "robust"                     | "validated" or "tested at scale"         | Evidence-based                            |
| "out of the box"             | "working baseline"                       | Professional                              |
| "cutting-edge"               | "modern" or specific tech name           | Not marketing                             |
| "seamless"                   | "integrated" or specific mechanism       | Measurable                                |
| "comprehensive"              | specific scope (e.g., "25 requirements") | Quantifiable                              |
| "viaSat"                     | "viaSport"                               | Typo fix                                  |
| "guarantee"                  | "target" or "commitment"                 | Procurement readers allergic to absolutes |
| "always"                     | "by default" or "configurable"           | Absolutes require contract backing        |
| "solticeapp.ca"              | "solsticeapp.ca"                         | Critical typo fix                         |
| "One-time Implementation"    | "Implementation Cost"                    | Clearer term                              |
| "Jobs-to-be-Done"            | "user research interviews"               | Avoid jargon                              |
| "Transitions gate"           | "Launch Approval Gate"                   | Clearer term                              |
| "the most relevant evidence" | "evidence for this requirement"          | Avoid subjective framing                  |
| "unique perspective"         | "practical end-user perspective"         | More specific                             |

### 1.4 Commitment Language Standard

Use consistent language to signal certainty level. Evaluators read this as maturity:

| Phrase                           | Meaning                                      | Example                                       |
| -------------------------------- | -------------------------------------------- | --------------------------------------------- |
| "We provide" / "We will deliver" | Committed, in scope                          | "We provide TOTP-based MFA"                   |
| "We propose"                     | Our recommendation, subject to confirmation  | "We propose Microsoft SSO for viaSport staff" |
| "Assumption"                     | Dependency on viaSport / external constraint | "Assumption: Legacy data export is available" |
| "Finalization Scope"             | Requires viaSport input during Discovery     | "MFA policy is Finalization Scope"            |

**Rules:**

- Don't accidentally sound uncertain about core requirements (use "We provide")
- Use "We propose" for recommendations that need confirmation
- Use "Assumption" for external dependencies
- Use "Finalization Scope" for items needing viaSport decisions

### 1.5 Evidence Reference Pattern

Every claim should be followed by an evidence reference:

**Good:**

> "The platform supports MFA with TOTP and backup codes (see Figure SEC-1, Video 6)."

**Bad:**

> "The platform supports robust multi-factor authentication capabilities."

---

## 2. Critical Cleanup in Combined File

### File: `docs/sin-rfp/response/full-proposal-response-combined.md`

#### 2.1 Delete These Lines Entirely

| Line Range | Content to Delete                                |
| ---------- | ------------------------------------------------ |
| 15-17      | `<<<^new Summary written by kyle...` placeholder |
| 18-37      | All Kyle conversation notes                      |
| 38         | `v old summmary>>>`                              |
| 42-160     | Entire old Executive Summary section             |

#### 2.2 Typo Fixes

| Location | Fix                                |
| -------- | ---------------------------------- |
| Line 12  | "the its" → "its"                  |
| Line 13  | "viaSat" → "viaSport"              |
| Multiple | Remove double spaces after periods |

#### 2.3 Placeholder Removal

Search for and remove:

- `TBD` - Replace with specific content or "[To be confirmed during Discovery]"
- `TODO` - Complete or remove
- `<<<` and `>>>` - Delete marker lines
- `[placeholder]` - Replace with real content

---

## 3. Executive Summary Wording

### 3.1 First Paragraph Rewrite

**Current (Kyle draft):**

> "viaSport seeks a new foundational digital layer for sport in British Columbia. Austin Wallace Tech Corporation, a proudly local digital solutions provider, has developed the perfect solution in Solstice."

**Recommended:**

> "viaSport seeks a new foundational digital layer for sport in British Columbia. Austin Wallace Tech Corporation, a Victoria-based digital solutions provider, proposes Solstice, a managed information platform built for sport organizations to collect, validate, manage, and report program data."

**Rationale:**

- Remove "perfect solution" (procurement risk)
- Remove "proudly local" (less professional)
- Add specific value proposition

### 3.2 Second Paragraph Rewrite

**Current:**

> "Solstice is a modern information management platform designed for league and event management..."

**Recommended:**

> "Solstice is a modern information management platform designed for data collection, reporting, and analytics. The technology makes day-to-day operations like membership reporting, submission tracking, and compliance oversight powerful yet intuitive."

**Rationale:**

- Change "league and event management" to match RFP scope
- viaSport is buying data collection + reporting, not event management

### 3.3 Add Explicit RFP Alignment Statement

**Add after Kyle narrative:**

> "This response follows the RFP evaluation criteria in order. A Prototype Evaluation Guide and Requirements Compliance Crosswalk are included for efficient validation."

### 3.4 Add Proof Statement

**Add near the top:**

> "Solstice is available today for evaluation and implements all 25 requirements in the System Requirements Addendum. This means viaSport is procuring rollout and adoption, not a risky build-from-scratch project."

---

## 4. Section-by-Section Wording Changes

### 4.1 Vendor Fit Section

#### Team Description Rewrite

**Current:**

> "1 principal plus contracted specialists"

**Recommended:**

> "Core delivery pod of 7 specialists: 1 principal delivery lead, 1 UX/accessibility lead, 1 sport operations advisor, 1 technical advisor, and 3 security/compliance advisors"

#### Operating Model Rewrite

**Current:**

> "We operate with a single accountable delivery lead and a small core product team, augmented by specialist advisors..."

**Recommended:**

> "Delivery is led by the platform's architect from proposal through operations. This eliminates knowledge transfer risk common in vendor handoffs. The team includes UX research, sport sector operations, and security expertise as named advisory partners."

#### Title Consistency

| Role          | Consistent Title                               |
| ------------- | ---------------------------------------------- |
| Will Siddall  | Technical Advisor (Architecture & Integration) |
| Ruslan Hétu   | UX and Accessibility Lead                      |
| Soleil Heaney | Sport Operations Advisor                       |

**Note:** Will Siddall's title should clarify his technical domain. "Technical Advisor" alone is too vague.

#### Section Title Clarifications

Review and consider renaming confusing section titles:

| Current Title            | Issue                                            | Suggested Alternative                             |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------- |
| "Oversight Mechanisms"   | Unclear who is overseeing what                   | "Workflow Automation" or "Process Tracking"       |
| "Continuity of Services" | Doesn't clearly relate to IaC, testing, runbooks | "Operational Continuity" or "Service Reliability" |

#### Sport Sector Connection (Cultural Fit)

While avoiding overly casual "proudly local" language, do include sport sector credibility:

- Soleil Heaney's direct sport sector experience (national team athlete, PSO familiarity)
- Austin's Quadball Canada board experience
- Understanding of PSO reporting challenges from firsthand experience

**Frame as:** "Our team includes practitioners who understand sport organization operations firsthand."

This addresses evaluator concerns about cultural fit without sounding unprofessional.

### 4.2 Security Section Wording

#### Remove Unverifiable Claims

**Current (if present):**

> "We use industry-leading threat detection tools..."

**Recommended:**

> "Anomaly detection monitors authentication patterns. Automatic account lockout activates after repeated failed attempts. Security events are logged and filterable by administrators."

#### Add Shared Responsibility Statement

**Add to Security Model section:**

> "This deployment follows the AWS shared responsibility model: AWS secures the underlying cloud infrastructure (physical security, network isolation, hypervisor), and Austin Wallace Tech implements and operates application-level controls (access management, encryption, monitoring, audit logging)."

#### Add SSO Finalization Scope (Important - from viaSport Q&A)

viaSport signaled preferences in their Q&A:

- Staff use M365
- PSOs may want Google/Microsoft/Apple
- Passwordless is under consideration

**Add to SEC-AGG-001 (or auth section) as explicit Finalization Scope:**

> "**SSO and Identity Providers (Finalization Scope)**
>
> **What exists now:**
>
> - Email/password authentication
> - Google OAuth
> - TOTP-based MFA with backup codes
>
> **What will be finalized during Discovery:**
>
> - Which IdPs to enable at launch
> - Policy for MFA requirement (required vs. optional by org)
>
> **Proposed approach:**
>
> - Phase 1 (launch): Microsoft SSO for viaSport staff
> - Phase 2 (post-launch): Social logins (Google, Apple) for PSOs
> - Passwordless: Evaluate based on viaSport's timeline
>
> This phased approach reduces launch risk while keeping options open."

### 4.3 Data Residency Section

#### Clarify Email Boundary

**Current (if present):**

> "All data stays in Canada..."

**Recommended:**

> "Primary data stores (RDS PostgreSQL, S3 object storage, backups, and audit archives) are hosted in AWS Canada (Central) (ca-central-1). Email notifications are sent via AWS SES from ca-central-1. Once delivered to recipients, messages may transit or be stored by external email providers outside AWS infrastructure."

### 4.4 Migration Section

#### Add Cutover Language

**Add new subsection:**

> "### Cutover and Change Management
>
> A successful migration requires coordinated transition for viaSport staff and PSOs.
>
> | Step                  | Description                                                                |
> | --------------------- | -------------------------------------------------------------------------- |
> | Data freeze window    | 2 business days read-only period on legacy systems                         |
> | Final delta migration | Import changes since last full migration                                   |
> | Go-live               | Solstice becomes system of record (target: Fall 2026)                      |
> | Hypercare             | Elevated support and daily check-ins from UAT through 1 month post go-live |
> | Rollback criteria     | Predefined conditions that trigger rollback plan                           |
>
> **Note:** No parallel run period required. Solstice becomes the system of record at go-live."

#### PSO Champion Sourcing

When referencing "PSO champions" in the timeline or risk sections, clarify the source:

**Current (if present):**

> "PSO champions will support rollout..."

**Recommended:**

> "PSO champions will be identified during Discovery in collaboration with viaSport staff who have existing PSO relationships."

This answers "from where?" and shows we're not assuming access we don't have.

### 4.5 Capabilities Section

#### AI and Automation Statement

**Add:**

> "Where AI and automation are used, we follow responsible practices aligned with viaSport's guidance: transparency about what is automated, privacy protection for personal information, bias mitigation through diverse testing, and human review for high-impact decisions."

### 4.6 Pricing Section

#### Plain Language Rewrite

**Current (if present):**

> "Solstice offers a comprehensive, best-in-class subscription model..."

**Recommended:**

> "Solstice is offered as a term subscription with implementation and managed service bundled. Pricing includes hosting, monitoring, security patching, support, ongoing product updates, and 200 hours per year of enhancement capacity."

---

## 5. Cross-Reference Standardization

### 5.1 Replace Folder References

| Current            | Replace With                                        |
| ------------------ | --------------------------------------------------- |
| "See Section 01-B" | "See Prototype Evaluation Guide"                    |
| "See Section 04"   | "See System Requirements Compliance Crosswalk"      |
| "See Section 07"   | "See Project Plan, Timeline, and Delivery Schedule" |
| "See Section 06"   | "See Commercial Model and Pricing"                  |
| "See Appendix D"   | "See Appendix D: Security Architecture Summary"     |

### 5.2 Consistent Section Titles

Use these exact titles throughout:

| Section | Exact Title                                                |
| ------- | ---------------------------------------------------------- |
| 1       | Executive Summary                                          |
| 2       | Prototype Evaluation Guide                                 |
| 3       | Evaluator Navigation Map                                   |
| 4       | Vendor Fit to viaSport's Needs                             |
| 5       | Solution Overview                                          |
| 6.1     | Service Approach: Data Submission and Reporting Web Portal |
| 6.2     | Service Approach: Data Warehousing                         |
| 6.3     | Service Approach: Data Migration                           |
| 6.4     | Service Approach: Platform Design and Customization        |
| 6.5     | Service Approach: Testing and Quality Assurance            |
| 6.6     | Service Approach: Training and Onboarding                  |
| 7       | Service Levels, Support, and Reliability                   |
| 8       | System Requirements Compliance Crosswalk                   |
| 9       | System Requirements: Data Management (DM-AGG)              |
| 10      | System Requirements: Reporting (RP-AGG)                    |
| 11      | System Requirements: Security (SEC-AGG)                    |
| 12      | System Requirements: Training and Onboarding (TO-AGG)      |
| 13      | System Requirements: User Interface (UI-AGG)               |
| 14      | Capabilities and Experience                                |
| 15      | Commercial Model and Pricing                               |
| 16      | Project Plan, Timeline, and Delivery Schedule              |

---

## 6. RFP Language Alignment

### 6.1 Use Exact RFP Terms

| viaSport RFP Term                          | Use This (not)                |
| ------------------------------------------ | ----------------------------- |
| "Data Submission and Reporting Web Portal" | (not "Portal" or "Web App")   |
| "Data Warehousing"                         | (not "Database" or "Storage") |
| "Data Migration"                           | (not "Import" or "Transfer")  |
| "Platform Design and Customization"        | (not "Configuration" only)    |
| "Testing and Quality Assurance"            | (not "QA" only)               |
| "Training and Onboarding"                  | (not "Documentation" only)    |

### 6.2 Map to RFP Sub-Questions

Each Service Approach section should explicitly reference the RFP sub-question:

**Example for Data Submission:**

> "viaSport's RFP asks: 'What is your UX strategy and approach for the Data Submission and Reporting Web Portal?'
>
> Our approach includes role-based portal design, responsive layout, and accessibility compliance..."

---

## 7. Tone and Voice Guidelines

### 7.1 Kyle-Style Voice Characteristics

1. **Direct, confident, short sentences**
2. **Local and specific** (Victoria-based, BC experience)
3. **Claims backed by proof** (screenshot, video, metric)
4. **No buzzwords** (replace with specifics)

### 7.2 Sentence Pattern to Follow

**Pattern:** Claim → Evidence → Benefit

**Example:**

> "The platform implements MFA with TOTP and backup codes (Figure SEC-1). Evaluators can test the complete authentication flow in the sin-uat environment (Video 6). This reduces unauthorized access risk during reporting cycles."

### 7.3 Paragraph Template

For each major claim:

```
[What viaSport asked for - 1 sentence]
[What Solstice delivers - 1 sentence]
[Evidence reference - parenthetical]
[How it works - 2-4 bullets max]
[What will be finalized with viaSport - 1 sentence]
```

**Example:**

> viaSport needs secure authentication with multi-factor verification. Solstice implements TOTP-based MFA with backup codes and session management (Figure SEC-1, Video 6).
>
> Key capabilities:
>
> - TOTP app support (Google Authenticator, Authy)
> - Backup codes for account recovery
> - Active session management with revocation
> - Account lockout after failed attempts
>
> MFA policy configuration (required vs. optional) will be finalized with viaSport during Discovery.

---

## 8. File-by-File Change Matrix

### 8.1 `docs/sin-rfp/response/full-proposal-response-combined.md`

| Change                            | Priority |
| --------------------------------- | -------- |
| Delete lines 15-37 (Kyle notes)   | Critical |
| Delete lines 42-160 (old summary) | Critical |
| Fix "the its" → "its"             | High     |
| Fix "viaSat" → "viaSport"         | High     |
| Remove double spaces              | Medium   |
| Replace "perfect solution"        | High     |
| Add evidence references           | High     |

### 8.2 `docs/sin-rfp/response/01-executive-summary/final.md`

| Change                                | Priority |
| ------------------------------------- | -------- |
| Add At a Glance table                 | High     |
| Add RFP alignment bullets             | High     |
| Add video index                       | Medium   |
| Remove team bios (move to Appendix F) | High     |

### 8.3 `docs/sin-rfp/response/02-vendor-fit/final.md`

| Change                                 | Priority |
| -------------------------------------- | -------- |
| Standardize Will Siddall title         | Medium   |
| Remove full bios (keep role summaries) | High     |
| Add shared responsibility statement    | High     |

### 8.4 `docs/sin-rfp/response/03-service-approach/data-migration/final.md`

| Change                         | Priority |
| ------------------------------ | -------- |
| Add Cutover subsection         | Critical |
| Add data freeze window details | High     |
| Add rollback criteria          | High     |

### 8.5 `docs/sin-rfp/response/04-system-requirements/security-sec-agg/final.md`

| Change                                 | Priority |
| -------------------------------------- | -------- |
| Add SEC-AGG-002 proof points           | High     |
| Add SEC-AGG-003 proof points           | High     |
| Align with shared responsibility model | Medium   |

### 8.6 `docs/sin-rfp/response/05-capabilities-experience/final.md`

| Change                       | Priority |
| ---------------------------- | -------- |
| Add responsible AI statement | High     |
| Convert to case study format | Medium   |
| Remove duplicate bios        | High     |

### 8.7 `docs/sin-rfp/response/08-appendices/final.md`

| Change                  | Priority |
| ----------------------- | -------- |
| Add complete team bios  | High     |
| Remove TBD placeholders | Medium   |
| Add evidence pack index | Medium   |

---

## 9. Environment and Stage Naming

### 9.1 Consistent Stage Names

| Stage    | Purpose                 | Use This                              |
| -------- | ----------------------- | ------------------------------------- |
| sin-dev  | Development             | "development environment"             |
| sin-perf | Performance testing     | "performance testing environment"     |
| sin-uat  | User Acceptance Testing | "evaluation environment" or "sin-uat" |
| sin-prod | Production              | "production environment"              |

### 9.2 Remove Confusing References

- Don't mix stage names with general terms
- "Prototype" = sin-uat specifically
- "Performance testing" = sin-perf specifically

---

## 10. Final Wording Checklist

Before submitting, verify:

- [ ] No instances of "perfect," "best-in-class," "world-class," "robust"
- [ ] No instances of "viaSat" (all replaced with "viaSport")
- [ ] No instances of "guarantee" or "always" (replace with "target"/"commitment" or "by default"/"configurable")
- [ ] No instances of "solticeapp.ca" (all replaced with "solsticeapp.ca") - CRITICAL TYPO
- [ ] No em dashes (all replaced with commas or parentheses)
- [ ] No TBD or TODO placeholders
- [ ] No folder path references (all replaced with section titles)
- [ ] Every claim has an evidence reference
- [ ] All section titles match the TOC
- [ ] Team bios appear only in Appendix F
- [ ] Shared responsibility model statement included
- [ ] Data residency statement is accurate (includes email caveat)
- [ ] SSO/IdP section included with phased approach
- [ ] Cutover plan is complete (2 business days freeze, no parallel run, hypercare through 1 month post go-live)
- [ ] All 25 requirements have explicit evidence references
- [ ] Section titles reviewed for clarity (no "Oversight Mechanisms" or "Continuity of Services" without context)
- [ ] PSO champion sourcing clarified (identified during Discovery with viaSport)
- [ ] Sport sector credibility mentioned (Soleil's experience, QC board connection)
- [ ] All tables left-aligned (not centered)
