# Bundle 1: Security, Auth & Access Control

> **Your Task:** Implement or enhance the 6 requirements below for the viaSport Strength in Numbers (SIN) system.

---

## Requirements You Must Address

### SEC-AGG-001: Authentication & Access Control

**Description:** The system shall enforce multi-factor authentication, support secure password recovery, restrict access based on user roles and affiliations, and allow organizational leaders to manage user admission.

**Acceptance Criteria:** Users log in securely; only authorized individuals gain access based on role and affiliation.

**Current Status:** 75% complete

- Better Auth with email/password + OAuth (GitHub, Google)
- Password validation with strength requirements
- Role-based guards exist

**Gaps to Implement:**

- [ ] Add TOTP/SMS multi-factor authentication
- [ ] Organizational leader user admission management
- [ ] Affiliation-based access restrictions

---

### SEC-AGG-002: Monitoring & Threat Detection

**Description:** The system shall detect and flag suspicious activities such as unusual login patterns or behavior anomalies and automatically lock accounts where appropriate.

**Acceptance Criteria:** Security anomalies are flagged, logged, and result in appropriate account safeguards.

**Current Status:** 30% complete

- Rate limiting via Pacer exists
- No anomaly detection

**Gaps to Implement:**

- [ ] Track login patterns (location, time, device)
- [ ] Detect unusual behavior (failed attempts, rapid requests)
- [ ] Auto-lock accounts after suspicious activity
- [ ] Alert administrators of security events

---

### SEC-AGG-003: Privacy & Regulatory Compliance

**Description:** The system shall comply with relevant data protection laws (e.g., PIPEDA) to ensure secure handling, storage, and access to personal information.

**Acceptance Criteria:** All sensitive data is encrypted and stored securely.

**Current Status:** 50% complete

- HTTPS enforced
- Secure cookies with HttpOnly, SameSite
- Database connections encrypted

**Gaps to Implement:**

- [ ] Privacy consent collection and management
- [ ] Data retention policy enforcement
- [ ] Right to erasure (data deletion) workflow
- [ ] Privacy policy acceptance tracking

---

### SEC-AGG-004: Audit Trail & Data Lineage

**Description:** The system shall maintain an immutable audit log of user actions, data changes, authentication events, and administrative configurations, supporting forensic review and regulatory reporting.

**Acceptance Criteria:** Auditors can filter logs by user or record ID and export results; tamper-evident hashing verifies integrity of log entries.

**Current Status:** 25% complete

- `createdAt`/`updatedAt` timestamps exist on records
- No comprehensive audit log table

**Gaps to Implement:**

- [ ] Create `audit_logs` table with immutable entries
- [ ] Log all authentication events (login, logout, failed attempts)
- [ ] Log data changes (create, update, delete) with before/after
- [ ] Log administrative actions (role changes, user management)
- [ ] Add filtering/export for audit logs
- [ ] Implement tamper-evident hashing

---

### DM-AGG-003: Data Governance & Access Control

**Description:** The system shall enforce role-based access to data and provide administrators with secure database access, along with data cataloging and indexing capabilities for discoverability.

**Acceptance Criteria:** Users can only access data based on permission.

**Current Status:** 70% complete

- Role-based access control exists
- Team-based permissions implemented
- Membership tiers with different access levels

**Gaps to Implement:**

- [ ] Field-level access control (hide sensitive fields by role)
- [ ] Data cataloging/indexing for discoverability
- [ ] Admin database access portal (read-only queries)

---

### UI-AGG-001: User Access & Account Control

**Description:** The system shall support secure login/logout (MFA), individual and organizational account registration, account recovery, and system administrator account management with role-based access.

**Acceptance Criteria:** Users and system admin can perform account-related tasks securely.

**Current Status:** 85% complete

- Full auth flow (login, signup, logout)
- OAuth providers (GitHub, Google)
- Profile management
- Role-based admin access

**Gaps to Implement:**

- [ ] MFA enrollment UI
- [ ] Organizational account registration (team signup flow)
- [ ] Enhanced account recovery (security questions, backup codes)

---

## Context: viaSport SIN Project

viaSport BC is replacing legacy systems (BC Activity Reporter and BC Sport Information System) with a modern, secure, scalable platform for B.C. amateur sport data management.

**Key Context:**

- Historical data: 20+ million rows
- Compliance required: PIPA/PIPEDA, SOC II / ISO 27001
- Users: Sport organizations, administrators, provincial staff
