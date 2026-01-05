# Service Approach: Data Submission and Reporting Web Portal

## UX Strategy and Approach

The Solstice platform is designed with a single guiding principle: make data submission intuitive and efficient for non-technical administrators. The platform serves three primary user groups, each with distinct needs:

| User Group              | Primary Tasks                           | UX Focus                                                 |
| ----------------------- | --------------------------------------- | -------------------------------------------------------- |
| viaSport Administrators | Oversight, analytics, compliance review | Cross-org dashboards, audit access, admin tools          |
| PSO Reporters           | Data submission, report tracking        | Streamlined forms, progress tracking, deadline awareness |
| Data Stewards           | Data quality, corrections, imports      | Validation tools, error resolution, bulk operations      |

### Role-Based Portal Design

Each user sees a personalized dashboard based on their role and organizational affiliation. The dashboard surfaces relevant actions, pending tasks, and submission status without requiring navigation through menus.

**Dashboard Elements by Role:**

- **Administrators:** Overdue submissions across organizations, pending access requests, system health indicators, analytics summaries.
- **Reporters:** Current submission status, upcoming deadlines, changes requested, recent activity.
- **Data Stewards:** Validation queues, import progress, data quality exceptions, bulk operations.

### Navigation and Workflow

The platform uses dashboard-led navigation with quick access cards for common tasks. Users can locate information through:

- **Command palette:** Keyboard-accessible search (Cmd/Ctrl+K) for instant navigation to any page, form, or record.
- **Contextual links:** Related actions appear alongside relevant data, reducing clicks to complete tasks.

### Responsive Design

The interface adapts to desktop, tablet, and mobile viewports. All core functionality is accessible on mobile devices, enabling PSO administrators to review and approve submissions while away from their desks.

### Accessibility

The interface is built on Radix UI primitives, which provide WCAG-compliant accessibility by default. This includes:

- Screen reader compatibility
- Keyboard navigation for all interactive elements
- Sufficient color contrast ratios
- Focus indicators for interactive elements

Preliminary Lighthouse accessibility checks indicate strong compliance. A formal WCAG audit is available on request.

### UX Refinement Process

The current prototype provides a solid foundation. During the Planning phase, we will conduct UX interviews with viaSport stakeholders to:

- Validate navigation structure against actual workflows
- Identify pain points from legacy system usage
- Refine dashboard widgets to surface the most relevant information
- Apply viaSport branding and visual preferences

## Technology Stack and Benefits

### Frontend

| Technology     | Purpose                    | Benefit                                                                     |
| -------------- | -------------------------- | --------------------------------------------------------------------------- |
| TanStack Start | Full-stack React framework | Type-safe end-to-end, server-side rendering, file-based routing             |
| React 19       | UI library                 | Latest performance optimizations, Server Components, improved Suspense      |
| TypeScript     | Type system                | Compile-time error detection, improved maintainability                      |
| Tailwind CSS   | Styling                    | Consistent design system, rapid development                                 |
| shadcn/ui      | Component library          | Accessible components built on Radix primitives, full customization control |

### Backend and Middleware

| Technology                      | Purpose         | Benefit                                                                  |
| ------------------------------- | --------------- | ------------------------------------------------------------------------ |
| TanStack Start Server Functions | API layer       | Co-located with UI, type-safe, no separate backend service               |
| Drizzle ORM                     | Database access | Lightweight, predictable, generates TypeScript types from schema         |
| Better Auth                     | Authentication  | MFA support (TOTP + backup codes), session management, OAuth integration |

### Database

| Technology            | Purpose            | Benefit                                                            |
| --------------------- | ------------------ | ------------------------------------------------------------------ |
| PostgreSQL on AWS RDS | Primary data store | Proven enterprise database, tested at 20M+ rows, real-time queries |

### Hosting

| Technology     | Purpose          | Benefit                               |
| -------------- | ---------------- | ------------------------------------- |
| AWS Lambda     | Application tier | Serverless, auto-scaling, pay-per-use |
| AWS CloudFront | CDN              | Edge caching, fast global delivery    |
| AWS S3         | Object storage   | Documents, imports, artifacts         |
| AWS SQS        | Message queues   | Reliable notification delivery        |
| AWS SES        | Email            | Transactional emails, notifications   |

### Analytics

| Technology         | Purpose                | Benefit                                                                   |
| ------------------ | ---------------------- | ------------------------------------------------------------------------- |
| Native BI Platform | Self-service analytics | Built-in tenancy enforcement, audited exports, no third-party integration |
| ECharts            | Charting               | Interactive visualizations, wide chart type support                       |
| TanStack Table     | Data grids             | Sortable, filterable pivot tables with export                             |

### Why This Stack

This technology combination delivers specific benefits for viaSport:

1. **Type safety everywhere:** Errors caught at compile time, not in production.
2. **Serverless architecture:** No servers to manage, automatic scaling during peak periods.
3. **Accessible by default:** WCAG compliance built into component primitives.
4. **Single codebase:** Frontend and backend in one repository, simpler maintenance.
5. **Canadian data residency:** All AWS services deployed in ca-central-1.
6. **Modern but stable:** 2025 best practices with production-proven technologies.

### Performance Evidence

Lighthouse audit results (latest prototype run; date TBD):

| Metric                   | Score/Value | Target  | Status |
| ------------------------ | ----------- | ------- | ------ |
| Performance Score        | 93/100      | >80     | Pass   |
| Largest Contentful Paint | 2284ms      | <2500ms | Pass   |
| Time to First Byte       | 380ms       | <500ms  | Pass   |
| Total Blocking Time      | 88ms        | <300ms  | Pass   |
| Cumulative Layout Shift  | 0           | <0.1    | Pass   |
