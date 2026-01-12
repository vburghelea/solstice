# viaSport Q&A Responses (2026-01-08)

Email exchange with Adam Benson and Joe Zhang clarifying RFP questions prior to submission.

---

## Context

- **Date:** 2026-01-08
- **Participants:** Austin Wallace, Adam Benson, Joe Zhang
- **Purpose:** Clarify technical questions before Friday submission deadline

---

## Questions and Answers

### Legacy Migration (BCAR/BCSI)

**Q1: What export methods are available for BCAR and BCSI (database access, API, built-in exports, etc.)?**

> **A:** Database access, exports to CSV/Excel

**Q2: Are you able to share any existing data dictionary or schema documents, or even better, redacted data samples?**

> **A:** Not at this time

**Q3: Do BCAR/BCSI contain attachments that must be migrated?**

> **A:** Not a requirement

---

### RP-AGG-002 (Aggregation & Metadata)

**Q4: What is the expected metadata set at launch (e.g., contribution agreements, NCCP fields, fiscal periods, org profiles, delegated access, contacts)?**

> **A:** Initially we will work with our partner to confirm but it will be a combination of these examples

**Q5: Are any fields validated against authoritative sources (e.g., NCCP registry), or will the new system be the system of record?**

> **A:** New system will be the system of record

---

### Identity & Access

**Q6: Is single sign-on required at launch? If yes, which identity provider(s) and protocol (SAML/OIDC)?**

> **A:** We would like the capability of SSO (ie viasport uses M365) however, users of the system will be from many organizations so supporting Google, Microsoft, Apple SSO is an option we will need to consider passwordless login and other methods as well.

---

## Key Takeaways

### Scope Simplifications

| Area                                | Impact                                                             |
| ----------------------------------- | ------------------------------------------------------------------ |
| **No attachment migration**         | Significantly reduces migration complexity and timeline risk       |
| **New system is system of record**  | No external validation integrations required (e.g., NCCP registry) |
| **CSV/Excel + DB access available** | Straightforward extraction path for legacy data                    |

### Assumptions to Document

| Area                | Assumption                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Data schema**     | Will be defined during Discovery; no samples available pre-award                                                       |
| **Metadata fields** | Combination of contribution agreements, NCCP, fiscal periods, org profiles, delegated access, contacts - exact set TBD |

### Expanded Scope (Identity)

viaSport's SSO requirements are broader than initially asked:

- **viaSport staff:** M365 (Azure AD)
- **PSO users (multi-org):** Google, Microsoft, Apple OAuth
- **Additional methods:** Passwordless login under consideration

This expands the authentication strategy beyond the current Google OAuth + email/password implementation.

---

## Impact on Proposal

These answers should inform:

1. **Migration section:** Emphasize CSV/Excel + database access extraction; no attachment handling needed
2. **RP-AGG-002 section:** Note metadata set will be confirmed during Discovery; new system is authoritative
3. **Authentication section:** Acknowledge multi-provider SSO capability as desired feature; note implementation approach

---

## Related Documents

- [Full Proposal Response](../response/full-proposal-response-combined.md)
- [System Requirements Addendum](./VIASPORT-PROVIDED-system-requirements-addendum.md)
- [Email Draft](../response/email-reply-2026-01-08.txt)
