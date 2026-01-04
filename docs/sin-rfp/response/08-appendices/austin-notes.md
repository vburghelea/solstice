# Austin's Notes - Appendices

## Planned Appendix Contents

### A. Live Demo Access

**Environment:** sin-uat (to be created - stable demo environment)

| Persona        | Email                      | Password        | Access Level                             |
| -------------- | -------------------------- | --------------- | ---------------------------------------- |
| Platform Admin | admin@example.com          | testpassword123 | Full platform admin (MFA enabled)        |
| viaSport Staff | viasport-staff@example.com | testpassword123 | viaSport admin + org owner (MFA enabled) |
| PSO Admin      | pso-admin@example.com      | testpassword123 | BC Hockey org admin                      |
| Club Reporter  | club-reporter@example.com  | testpassword123 | North Shore Club reporter                |
| Regular Member | member@example.com         | testpassword123 | View-only access                         |

**Demo URL:** TBD (sin-uat.solstice... or similar)

**MFA for admin accounts:** TOTP secret `JJBFGV2ZGNCFARKIKBFTGUCYKA`

### B. Screenshots

Capture key screens showing:

- Dashboard (role-specific views)
- Form builder
- Reporting submission workflow
- Analytics/BI platform (pivot builder, charts)
- Import wizard with validation
- Admin console (audit logs, security dashboard)
- Help center and tutorials
- Support request workflow

### C. Technical Architecture Diagrams

Ticket created: `/docs/sin-rfp/tickets/ARCHITECTURE-DIAGRAMS.md`

1. High-level system architecture (AWS services)
2. Data flow diagram
3. Security architecture
4. Multi-tenant architecture

### D. Persona Definitions Matrix

From `/docs/sin-rfp/requirements/sin-dual-portal-considerations.md`:

| Persona        | Portal Access              | Key Capabilities                            |
| -------------- | -------------------------- | ------------------------------------------- |
| viaSport Admin | SIN Portal + Admin Console | Full admin, analytics, reporting oversight  |
| PSO Admin      | SIN Portal                 | Org management, reporting, analytics        |
| PSO Reporter   | SIN Portal                 | Form submission, imports, limited analytics |
| Club Reporter  | SIN Portal (delegated)     | Data submission for their org               |
| Viewer/Member  | SIN Portal (limited)       | View-only access                            |
| Auditor        | Admin Console (read-only)  | Audit log access, compliance review         |

### E. Team Bios

#### Austin Wallace - Project Lead / Data Engineer

- 9+ years data engineering (Clio, NJ Devils, Teck Resources)
- Chair of International Quidditch Association (30+ national governing bodies)
- UBC B.Sc. in Analytical Sports Management
- Built Qdrill (coaching app used by Team Canada)
- Sole developer of working prototype

#### Will Siddal - Full Stack Developer

- (Add bio when available)

#### Security Expert - TBD

- (Add when confirmed)

#### UX Designer - TBD

- (Add when confirmed)

### F. Load Test Results

From `/performance/reports/20260102-sin-perf-summary.md`:

| Metric              | Value      | Target | Status          |
| ------------------- | ---------- | ------ | --------------- |
| Data volume         | 20.1M rows | -      | Realistic scale |
| p95 latency         | 250ms      | <500ms | ✅ PASS         |
| p50 latency         | 130ms      | -      | ✅              |
| Concurrent users    | 15         | -      | ✅              |
| Server errors (5xx) | 0          | -      | ✅              |

**Key takeaway:** System handles 20M+ rows with sub-250ms response times and zero errors.

### G. Security & Compliance Summary

One-pager covering:

- Data residency: AWS ca-central-1 (Canada)
- Encryption: TLS 1.2+ in transit, KMS at rest
- Authentication: MFA (TOTP + backup codes), session management
- Authorization: Org-scoped RBAC with field-level permissions
- Audit: Immutable logs with tamper-evident hash chain, 7-year retention
- Compliance: PIPEDA-aligned, AWS DPA in place

### H. Lighthouse Performance Scores

From `/docs/tickets/PERF-001-performance-optimizations.md`:

| Metric            | Score/Value | Status       |
| ----------------- | ----------- | ------------ |
| Performance Score | 93/100      | ✅           |
| LCP               | 2284ms      | ✅ (<2500ms) |
| TTFB              | 380ms       | ✅ (<500ms)  |
| TBT               | 88ms        | ✅ (<300ms)  |
| CLS               | 0           | ✅ (<0.1)    |

Built on Radix UI primitives for WCAG accessibility compliance.

## Action Items

- [ ] Create sin-uat stage for stable demo
- [ ] Generate architecture diagrams (ticket created)
- [ ] Capture screenshots from sin-uat
- [ ] Finalize team bios (Will, security expert, UX)
- [ ] Create security one-pager
