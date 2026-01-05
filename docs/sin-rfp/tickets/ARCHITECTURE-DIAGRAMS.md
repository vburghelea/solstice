# Ticket: Generate Architecture Diagrams for RFP Appendix

## Summary

Create technical architecture diagrams for the RFP response appendix. These should be clear, professional, and demonstrate the platform's technical foundation.

## Diagrams Needed

### 1. High-Level System Architecture

- AWS services layout (CloudFront, Lambda, RDS, S3, SQS, SES, EventBridge)
- Data flow from user → CDN → Lambda → RDS
- Show ca-central-1 region for data residency
- Include security boundaries (VPC, WAF if applicable)

### 2. Data Flow Diagram

- User submission flow: Browser → API → Validation → Database → Audit Log
- Reporting flow: Query → Access Control → Aggregation → Export
- Notification flow: Event → Queue → Worker → Email/In-App

### 3. Security Architecture

- Authentication flow (Better Auth, MFA, sessions)
- Authorization layers (RBAC, org-scoped access)
- Encryption (TLS in transit, KMS at rest)
- Audit logging with hash chain

### 4. Multi-Tenant Architecture

- Tenant isolation model
- Organization hierarchy (viaSport → PSOs → clubs)
- Role-based access control per org level

## Format

- SVG or PNG (high resolution)
- Clean, professional style
- Consistent color scheme
- Legend for symbols/colors
- viaSport brand colors if available (otherwise neutral)

## Tools Options

- Mermaid diagrams (can render from markdown)
- draw.io / diagrams.net
- Excalidraw
- AWS Architecture Icons

## Output Location

`/docs/sin-rfp/response/08-appendices/diagrams/`

## Deliverables

- `docs/sin-rfp/response/08-appendices/diagrams/high-level-system-architecture.mmd`
- `docs/sin-rfp/response/08-appendices/diagrams/high-level-system-architecture.svg`
- `docs/sin-rfp/response/08-appendices/diagrams/high-level-system-architecture.png`
- `docs/sin-rfp/response/08-appendices/diagrams/data-flow-diagram.mmd`
- `docs/sin-rfp/response/08-appendices/diagrams/data-flow-diagram.svg`
- `docs/sin-rfp/response/08-appendices/diagrams/data-flow-diagram.png`
- `docs/sin-rfp/response/08-appendices/diagrams/security-architecture.mmd`
- `docs/sin-rfp/response/08-appendices/diagrams/security-architecture.svg`
- `docs/sin-rfp/response/08-appendices/diagrams/security-architecture.png`
- `docs/sin-rfp/response/08-appendices/diagrams/multi-tenant-architecture.mmd`
- `docs/sin-rfp/response/08-appendices/diagrams/multi-tenant-architecture.svg`
- `docs/sin-rfp/response/08-appendices/diagrams/multi-tenant-architecture.png`

## Priority

High - needed for RFP submission (Jan 9)

## Acceptance Criteria

- [x] High-level system architecture diagram
- [x] Data flow diagram
- [x] Security architecture diagram
- [x] Multi-tenant architecture diagram
- [x] All diagrams exported as PNG/SVG
- [ ] Diagrams reviewed for accuracy
