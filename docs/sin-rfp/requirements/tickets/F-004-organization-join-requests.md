# F-004: Organization Join Requests & Self-Service Access

**Priority:** P2  
**Effort:** 1-2 weeks  
**Extends:** F-001 (Organization & Tenancy Model)  
**Status:** Proposed

---

## Problem Statement

When new users sign up, they land on `/dashboard/select-org` with "No organizations available" - a dead end with no actionable next steps. The current invitation-only model requires:

1. User signs up → sees empty org list
2. Admin must know user exists and invite them
3. Admin must approve the invitation
4. User can finally access SIN features

This creates friction for legitimate users and provides no self-service path.

---

## Proposed Solution (Three Components)

### Component A: Improved Empty State (Quick Win)

- Show helpful messaging when no organizations available
- Explain the invitation model
- Provide contact information or support link
- Link to request-to-join flow if enabled

### Component B: Organization Join Request Flow

- Users can browse discoverable organizations
- Users can request to join an organization
- Admins receive notification of pending requests
- Admins can approve/deny with reason
- Users notified of decision

### Component C: Shareable Invitation Links

- Admins can generate time-limited invite links
- Links can be role-specific (e.g., "Join as Reporter")
- New users signing up via link are auto-assigned to org (pending or active based on config)
- Links can have usage limits (single-use or multi-use)

---

## Database Schema

```sql
-- Organization join requests (Component B)
CREATE TABLE organization_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),

  -- Request details
  message TEXT, -- Optional message from requester
  requested_role TEXT NOT NULL DEFAULT 'member'
    CHECK (requested_role IN ('reporter', 'viewer', 'member')),

  -- Resolution
  resolved_by TEXT REFERENCES "user"(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, organization_id, status) -- One pending request per user/org
);

-- Shareable invitation links (Component C)
CREATE TABLE organization_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Link configuration
  token TEXT UNIQUE NOT NULL, -- Secure random token for URL
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('reporter', 'viewer', 'member')),
  auto_approve BOOLEAN NOT NULL DEFAULT false, -- Skip admin approval

  -- Limits
  max_uses INTEGER, -- NULL = unlimited
  use_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,

  -- Audit
  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT REFERENCES "user"(id)
);

-- Track invite link usage
CREATE TABLE organization_invite_link_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES organization_invite_links(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(link_id, user_id)
);

-- Organization discoverability settings
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  is_discoverable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  join_requests_enabled BOOLEAN NOT NULL DEFAULT false;

-- Indices
CREATE INDEX idx_join_requests_user ON organization_join_requests(user_id, status);
CREATE INDEX idx_join_requests_org ON organization_join_requests(organization_id, status);
CREATE INDEX idx_invite_links_token ON organization_invite_links(token) WHERE revoked_at IS NULL;
CREATE INDEX idx_invite_links_org ON organization_invite_links(organization_id) WHERE revoked_at IS NULL;
```

---

## Implementation Checklist

### Component A: Improved Empty State

- [ ] Update `src/routes/dashboard/select-org.tsx` with helpful empty state
- [ ] Add explanation of invitation model
- [ ] Add contact/support link
- [ ] Add "Request to Join" CTA if join requests enabled

### Component B: Join Request Flow

- [ ] Create `src/db/schema/organization-requests.schema.ts`
- [ ] Create `src/features/organizations/join-requests/` module
- [ ] Add `listDiscoverableOrganizations` query (filtered by `is_discoverable`)
- [ ] Add `createJoinRequest` mutation with rate limiting
- [ ] Add `resolveJoinRequest` mutation (admin only)
- [ ] Create organization browse/search UI for users
- [ ] Create pending requests panel for org admins
- [ ] Add notification triggers for new requests and resolutions
- [ ] Audit log all join request actions

### Component C: Invitation Links

- [ ] Create `src/features/organizations/invite-links/` module
- [ ] Add `createInviteLink` mutation (org admin only)
- [ ] Add `listInviteLinks` query (org admin only)
- [ ] Add `revokeInviteLink` mutation
- [ ] Add `useInviteLink` mutation (validates and creates membership)
- [ ] Create `/join/:token` route for link redemption
- [ ] Create admin UI for link management (create, copy, revoke)
- [ ] Handle new user signup via invite link flow
- [ ] Audit log link creation, usage, and revocation

---

## Acceptance Criteria

### Empty State (A)

- [ ] Users without orgs see helpful messaging, not just "No organizations available"
- [ ] Clear explanation of how to get access
- [ ] Contact/support information visible

### Join Requests (B)

- [ ] Users can browse discoverable organizations
- [ ] Users can submit join request with optional message
- [ ] Org admins see pending requests in their dashboard
- [ ] Admins can approve/deny with optional notes
- [ ] Users notified of approval/denial
- [ ] Rate limiting prevents request spam
- [ ] All actions audit logged

### Invite Links (C)

- [ ] Org admins can create shareable invite links
- [ ] Links can have expiration and usage limits
- [ ] Links can specify role assignment
- [ ] Links can auto-approve or require admin approval
- [ ] New users via link are associated with org on signup
- [ ] Existing users via link are added to org
- [ ] Admins can view and revoke active links
- [ ] All link actions audit logged

---

## Feature Flags

| Flag                       | Description                                  |
| -------------------------- | -------------------------------------------- |
| `org_join_requests`        | Enable/disable join request flow             |
| `org_invite_links`         | Enable/disable shareable links               |
| `org_discoverable_default` | Whether new orgs are discoverable by default |

---

## Security Considerations

- Join requests rate-limited per user (prevent enumeration/spam)
- Invite link tokens use cryptographically secure random generation (e.g., `crypto.randomBytes(32).toString('hex')`)
- Expired/revoked links return generic error (no info leakage)
- Only org admins/owners can approve requests or manage links
- Global admins can manage all orgs' settings
- All actions create audit log entries
- Discoverable org list shows minimal info (name, type) - no member counts or sensitive data

---

## UX Flows

### Flow A: Empty State → Request to Join

```
User signs up
    ↓
Redirected to /dashboard/select-org
    ↓
Sees "No organizations available"
    + Explanation text
    + "Browse Organizations" button (if join_requests enabled)
    + "Contact Support" link
    ↓
Clicks "Browse Organizations"
    ↓
Sees list of discoverable orgs with search
    ↓
Clicks "Request to Join" on an org
    ↓
Enters optional message, submits
    ↓
Sees "Request Pending" confirmation
    ↓
[Admin approves]
    ↓
User receives notification
    ↓
User can now select the organization
```

### Flow B: Invite Link (Existing User)

```
Admin creates invite link for "Reporter" role
    ↓
Admin shares link: https://app.example.com/join/abc123
    ↓
Existing user clicks link
    ↓
If auto_approve: Added to org immediately
If !auto_approve: Added as pending, admin notified
    ↓
User redirected to /dashboard/select-org
    ↓
User can select the new organization
```

### Flow C: Invite Link (New User)

```
Admin shares invite link
    ↓
New user clicks link
    ↓
Redirected to /auth/signup?invite=abc123
    ↓
User completes signup
    ↓
On signup success, invite link is redeemed
    ↓
User associated with org (pending or active)
    ↓
User proceeds to onboarding → dashboard
```

---

## Related Decisions

- **D0.9 (Org Creation Policy):** This ticket respects the decision that org creation is admin-only. Join requests and invite links only add users to _existing_ organizations.
- **D0.10 (Member Directory):** Discoverable org list shows minimal public info only, consistent with the decision to keep member details admin-only.

---

## Document History

| Version | Date       | Changes                 |
| ------- | ---------- | ----------------------- |
| v1.0    | 2025-12-27 | Initial ticket creation |
