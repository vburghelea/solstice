## **Tier 0**

### **A) Identity, user admission, and cross-org sharing (SEC‑AGG‑001 \+ real-world tenancy)**

1. **SSO at launch?**  
   “Is federated login required at launch? If yes: which identity provider(s) (Azure AD, Google Workspace, BC Services Card, other) and protocol (SAML / OIDC)?”  
   **Why it matters:** SSO can be 1–6+ weeks depending on complexity and stakeholder coordination.
2. **MFA enforcement policy**  
   “Should MFA be mandatory for _all_ users, or only admins/viaSport staff? Any exceptions (e.g., service accounts)?”  
   **Why:** changes onboarding UX, support volume, and security controls.
3. **User admission model**  
   “Is access invite-only, request-to-join, or self-registration allowed? Who approves (viaSport, PSO admin, both)?”  
   **Why:** determines workflows, permissions, and audit trails.
4. **Cross-organization data sharing**  
   “Should any data be visible across organizations (e.g., PSOs seeing each other’s data, sector benchmarking, public dashboards), or is everything private except viaSport admins?”  
   **Why:** this is a _major_ architecture and permissioning decision. It’s also aligned with the RFP’s “break down silos / information sharing” language.

---

### **B) Reporting metadata that drives RP‑AGG‑002 (your biggest “partial”)**

5. **Mandatory metadata fields (MVP list)**  
   “For RP‑AGG‑002, what is the minimum set of required fields at launch (contribution agreements, NCCP, contact details, fiscal periods, org profiles, delegated access)?”  
   **Why:** defines database schema \+ UI screens \+ validation.
6. **Authoritative source & validation rules**  
   “Are any RP‑AGG‑002 fields sourced from an authoritative system (e.g., official NCCP registry), or is Solstice the system of record? Any required validation rules (formats, enumerations)?”  
   **Why:** changes whether you build validation-only vs integration.

---

### **C) Legacy extraction \+ migration reality (DM‑AGG‑006 \+ DM‑AGG‑002)**

7. **BCAR/BCSI extraction method (what’s actually possible)**  
   “What export methods exist today for BCAR and BCSI: database access, API, CSV export, vendor-managed export? Who controls access?”  
   **Why:** determines migration approach and risk.
8. **Sample exports \+ data dictionary availability**  
   “Can viaSport provide (a) a representative export (redacted if needed), and (b) any schema docs / field definitions for BCAR and BCSI?”  
   **Why:** without this, your migration plan is a guess.
9. **Attachment/document migration scope**  
   “Do BCAR/BCSI contain attachments that must be migrated? If yes: approximate count, typical size, and any special handling (retention/legal holds)?”  
   **Why:** file migration complexity and cost can spike fast.

---

### **D) Retention, legal hold, and DR acceptance criteria (DM‑AGG‑005 \+ SEC‑AGG‑004)**

10. **Retention schedule by data type**  
    “What are the required retention periods for: submissions, metadata, attachments, audit logs, and support tickets?”  
    **Why:** you can’t finalize retention engine rules without it.
11. **Legal hold triggers and authority**  
    “Who can place a legal hold, what triggers it, and should holds apply at user/org/record level?”  
    **Why:** defines admin workflows and enforcement.
12. **RPO/RTO targets that the business will sign off on**  
    “Confirm required RPO/RTO targets for production and whether they are constrained by cyber insurance or funder expectations.”  
    **Why:** determines Multi‑AZ, backup strategy, DR drills, and cost.

---

### **E) Accessibility sign-off criteria (UI‑AGG‑003)**

13. **WCAG level \+ testing method**  
    “Confirm required WCAG version/level (e.g., 2.1 AA / 2.2 AA). Is automated testing sufficient, or is manual testing with assistive tech required for sign-off?”  
    **Why:** changes cost and timeline; it’s also easy to scope clearly.

---

### **F) Integrations required at launch (DM‑AGG‑002)**

14. **Named systems \+ must-have cadence**  
    “What external systems are required at launch for import/export/integration? For each: data objects \+ cadence (real-time, nightly, quarterly) \+ format.”  
    **Why:** integration scope is the most common hidden scope-creep area.
15. **API expectation vs export-only**  
    “Is a public partner API required for launch, or is CSV/Excel export sufficient until a later phase?”  
    **Why:** API hardening, auth, rate limits, and documentation add real work.

If you only ask 10–15 questions total, ask **these**.

---

## **Tier 1 — Discovery Week 1–2 questions that convert “requirements” into specs**

These are still impactful, but you can survive submission without them.

### **1\) Data model and org structure (DM‑AGG‑003 \+ RP workflows)**

16. “What is the required org hierarchy (viaSport → PSO → club → team/region)? Is ‘club’ a first-class entity or just a field?”
17. “Do users belong to multiple orgs? If yes, how should permissions work?”
18. “Are there auditor/read-only roles outside viaSport? Who grants that access?”

### **2\) Notification rules (UI‑AGG‑004 \+ RP‑AGG‑003)**

19. “Which reminder types are required (upcoming due date, overdue, resubmission requested, approval needed)? What cadence is expected?”
20. “Any restrictions on email content (PII allowed/not allowed), sender domain/from-name, and logging/audit expectations?”
21. “Is SMS required or explicitly out of scope?”

### **3\) File handling specifics (DM‑AGG‑001, RP‑AGG‑004)**

22. “Is multi-file upload required in any single field? Max file size and allowed types?”
23. “Who can delete/replace a file after submission (reporter, PSO admin, viaSport only)?”
24. “Do you require malware scanning for uploads?” (This is a big cost/architecture fork — ask early.)

### **4\) Templates and approval workflow (TO‑AGG‑001)**

25. “Which templates must be pre-seeded at launch (import templates, reporting templates, form templates)?”
26. “What is the approval process for template updates (who approves, how often, versioning expectations)?”

### **5\) Data quality metrics (DM‑AGG‑004)**

27. “Which data quality metrics matter most (missing fields, invalid values, outliers, duplicates)? Any thresholds you already use?”
28. “Who receives data quality alerts (viaSport admins only, PSO admins, both)?”

### **6\) Search scope (UI‑AGG‑005)**

29. “Which entities must be searchable globally (forms, submissions, orgs, people, templates, audit logs)?”
30. “Should search results respect role \+ org scope strictly, or do admins get cross-org results?”

### **7\) Support workflow integration (UI‑AGG‑006, TO‑AGG‑003)**

31. “Do you want support handled fully inside Solstice, or integrated with an existing tool (Jira Service Management, Zendesk, Freshdesk, etc.)?”
32. “Confirm SLA expectations and escalation path (who is on-call, what counts as critical).”

---

## **Tier 2 — Optional / “don’t block MVP” questions**

These are good questions, but they don’t need to be answered to build the core system.

33. **SOC 2 / ISO 27001**  
    “Do you require the vendor to be certified (SOC 2 Type II / ISO 27001), or is alignment with controls acceptable?”  
    (Keep it simple; certification is a _commercial_ requirement as much as technical.)
34. **AI governance**  
    “If AI features are prioritized, what governance is required (human review, transparency labeling, bias testing, data usage restrictions)?”  
    This is roadmap — don’t let it contaminate MVP scope.
35. **Community participation / research expectations**  
    “What is the expected breadth of community participation (PSOs, clubs, athletes) in UX research and design validation?”  
    Important, but it’s a delivery planning question, not a system blocker.
