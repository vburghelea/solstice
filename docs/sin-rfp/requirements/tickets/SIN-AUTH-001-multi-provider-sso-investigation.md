# SIN-AUTH-001: Multi-Provider SSO and Passwordless Authentication Investigation

**Priority:** P2
**Effort:** Investigation (1-2 days), Implementation TBD
**Status:** Open
**Created:** 2026-01-08
**Source:** [viaSport Q&A 2026-01-08](../../source/VIASPORT-QA-2026-01-08.md)

---

## Background

In the 2026-01-08 Q&A exchange, viaSport clarified their identity and access requirements:

> "We would like the capability of SSO (ie viasport uses M365) however, users of the system will be from many organizations so supporting Google, Microsoft, Apple SSO is an option we will need to consider passwordless login and other methods as well."

This expands the authentication scope beyond the current implementation.

---

## Current State

| Feature                       | Status      |
| ----------------------------- | ----------- |
| Email/password authentication | Implemented |
| Google OAuth                  | Implemented |
| TOTP MFA                      | Implemented |
| Backup codes                  | Implemented |

---

## Requested Capabilities

### Confirmed Requirements

| Provider                  | Use Case       | Protocol                        |
| ------------------------- | -------------- | ------------------------------- |
| Microsoft/Azure AD (M365) | viaSport staff | OAuth 2.0 / OIDC                |
| Google                    | PSO users      | OAuth 2.0 (already implemented) |
| Microsoft (consumer)      | PSO users      | OAuth 2.0                       |
| Apple                     | PSO users      | OAuth 2.0                       |

### Under Consideration

| Feature            | Notes                            |
| ------------------ | -------------------------------- |
| Passwordless login | Magic links, passkeys (WebAuthn) |
| Other methods      | TBD with viaSport                |

---

## Implementation Assumptions (Working)

These assumptions reflect the current plan to move forward with development based on
viaSport's "uses M365" wording and the 2026-01-08 Q&A.

- **Enterprise OIDC first**: Implement Microsoft Entra ID OAuth (OIDC) with a tenant ID
  restriction where possible; assume SAML is not required for the MVP unless the IdP
  team requests it.
- **Multi-provider UX**: Expose Google + Microsoft + Apple buttons when configured;
  treat Apple as optional due to HTTPS-only constraints in local dev.
- **Account linking**: Auto-link trusted providers for Google and Microsoft; keep Apple
  manual until identity policy is confirmed.
- **Passkeys prioritized**: Implement WebAuthn passkeys as the primary passwordless
  option; defer magic links pending security review (email OTP is discouraged by
  ASVS 6.3.6).
- **Passkey implementation in progress**: Better Auth passkey plugin wired, schema
  and UI work underway; migrate DB before enabling in shared environments.

---

## Investigation Tasks

### 1. Better Auth Provider Support

- [x] Review Better Auth documentation for Microsoft OAuth support
- [x] Review Better Auth documentation for Apple OAuth support
- [x] Assess effort to add Microsoft (Azure AD) provider
- [x] Assess effort to add Apple provider
- [x] Document any limitations or configuration requirements

### 2. Enterprise SSO (SAML/OIDC)

- [ ] Determine if viaSport M365 requires enterprise SSO (SAML 2.0) vs consumer OAuth
- [x] Review Better Auth enterprise SSO capabilities
- [x] Assess complexity of SAML integration if required
- [ ] Document IdP configuration requirements viaSport would need to provide

### 3. Passwordless Options

- [x] Review Better Auth magic link support
- [x] Review WebAuthn/passkey support in Better Auth
- [x] Assess browser compatibility and UX implications
- [x] Estimate implementation effort

### 4. Multi-Provider UX

- [x] Design login flow with multiple provider options
- [x] Consider account linking (same email, different providers)
- [ ] Plan for organization-specific provider restrictions (e.g., viaSport staff must use M365)

---

## Proposal Impact

For the RFP submission, document the following in **SEC-AGG-001** and **Vendor Fit** sections:

### Current Capability

- MFA with TOTP and backup codes
- Google OAuth for social login
- Email/password with strong password policy

### Planned Capability (Discovery Phase)

- Microsoft OAuth (Azure AD) for viaSport staff and PSO users
- Apple OAuth for PSO users
- Passwordless login options (magic links, passkeys) to be evaluated during UX research

### Implementation Approach

Multi-provider OAuth will be configured during the Discovery phase based on viaSport's identity architecture. Better Auth supports multiple OAuth providers through configuration. Enterprise SSO (SAML) can be added if viaSport's M365 tenant requires it.

---

## Cost/Timeline Implications

| Scenario                                   | Effort       | Notes                                  |
| ------------------------------------------ | ------------ | -------------------------------------- |
| OAuth providers only (MS, Apple)           | 1-2 weeks    | Configuration + testing                |
| Enterprise SAML required                   | 3-4 weeks    | More complex integration               |
| Passwordless (magic links)                 | 1 week       | Better Auth supports this              |
| Passwordless (WebAuthn/passkeys) — Basic   | **1-2 days** | Plugin/schema ready, deploy migration  |
| Passwordless (WebAuthn/passkeys) — Full UX | **6-8 days** | Identifier-first flow, prompts, polish |

**Validated estimate (2026-01-08):** Passkey implementation is further along than
originally estimated. Basic functionality can ship quickly; full UX polish is
optional enhancement.

---

## Dependencies

- Better Auth provider documentation
- viaSport M365 tenant configuration details (Discovery phase)
- UX research on passwordless preferences (Discovery phase)

---

## Acceptance Criteria

### Investigation Complete

- [x] All OAuth providers assessed for Better Auth compatibility
- [ ] Enterprise SSO requirements clarified (awaiting viaSport input)
- [x] Passwordless options documented with effort estimates
- [ ] Proposal sections updated with accurate capability statements
- [ ] Implementation backlog item created if work is approved

---

## Notes from Investigation

### OAuth Providers

- Microsoft OAuth: Better Auth supports Entra ID with optional tenant ID, authority,
  and prompt configuration; redirect URL uses `/api/auth/callback/microsoft`.
- Apple OAuth: Supported but requires HTTPS and `https://appleid.apple.com` in
  `trustedOrigins`; no localhost support.
- SSO plugin: Supports OIDC and SAML; SAML is marked as in active development.

### Passkeys: Browser Compatibility

**Global coverage: 95.81%** of users have WebAuthn/passkey support.

| Browser          | Desktop Support             | Mobile Support                 |
| ---------------- | --------------------------- | ------------------------------ |
| Chrome           | v67+ (fully supported)      | Android v143+                  |
| Safari           | v13+                        | iOS v14.5+ (partial 13.3-14.0) |
| Firefox          | v60+ (partial - no TouchID) | v146 (partial)                 |
| Edge             | v18+                        | —                              |
| Opera            | v54+                        | Mobile v80+                    |
| Samsung Internet | —                           | v17+                           |
| IE               | ❌ Not supported            | —                              |

**Key limitations:**

- Firefox lacks TouchID support on macOS
- iOS Safari requires v14.5+ for full functionality
- Internet Explorer has zero support (irrelevant for viaSport target audience)

### Passkeys: UX Implications

**Adoption patterns (FIDO Alliance research):**

- Identifier-first flow (email → check for passkey) achieves higher adoption than
  separate "Sign in with Passkey" buttons
- Conditional UI via browser autofill (`autocomplete="username webauthn"`) creates
  seamless one-tap login experience
- Users need explicit prompts explaining passkey benefits at key moments: after sign-in,
  in settings, after account recovery

**Implementation status (Phase 2 complete - 2026-01-08):**

- ✅ Passkey plugin installed (`@better-auth/passkey` v1.4.10)
- ✅ Database schema ready (`passkey` table with migration 0006)
- ✅ Server config in place (`rpID`, `rpName`, `origin` configured)
- ✅ Browser support detection (`window.PublicKeyCredential`)
- ✅ **Identifier-first flow implemented** - email → check passkeys → prompt or password
- ✅ **Post-login passkey creation prompt** with benefits, "Don't show again" option
- ✅ **FIDO Alliance passkey icon** added and used consistently
- ✅ **Enhanced settings page** - device icons, authenticator names, "Synced" badges
- ✅ **Fallback path** - "Use password instead" option at all passkey prompts
- ✅ Unit tests updated for identifier-first flow

### Passkeys: Effort Estimate (Revised)

| Task                               | Status      | Notes                                            |
| ---------------------------------- | ----------- | ------------------------------------------------ |
| Plugin, schema, basic UI           | ✅ Done     | `@better-auth/passkey` installed                 |
| Database migration to shared envs  | **Pending** | Run `0006_add_passkey.sql` on sin-dev/sin-uat    |
| Identifier-first UX flow           | ✅ Done     | Login refactored with email → passkey check      |
| Post-login passkey creation prompt | ✅ Done     | Modal in AppLayout                               |
| Passkey icon integration           | ✅ Done     | FIDO Alliance icon added                         |
| Settings page enhancements         | ✅ Done     | Device icons, authenticator names, badges        |
| E2E testing                        | **Pending** | WebAuthn hard to automate; manual testing needed |

**Remaining work:**

- Run database migration (`0006_add_passkey.sql`) on shared environments
- Manual E2E verification with real passkey authenticators
- Update proposal sections to reflect implemented capability

---

## Related Documents

- [viaSport Q&A 2026-01-08](../../source/VIASPORT-QA-2026-01-08.md)
- [Full Proposal Response](../../response/full-proposal-response-combined.md)
- [SEC-AGG-001 Requirements](../../requirements/SIN-REQUIREMENTS.md)

---

## Document History

| Version | Date       | Changes                                                                                                              |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| v1.0    | 2026-01-08 | Initial ticket creation from viaSport Q&A                                                                            |
| v1.1    | 2026-01-08 | Added passkey browser compatibility matrix, UX implications, revised effort estimates                                |
| v1.2    | 2026-01-08 | **Passkey Phase 2 implementation complete** - identifier-first flow, post-login prompt, FIDO icon, enhanced settings |
