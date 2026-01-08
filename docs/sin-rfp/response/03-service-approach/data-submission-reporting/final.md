# Service Approach: Data Submission and Reporting Web Portal

## UX Strategy and Approach

The Solstice portal is designed to make data submission efficient for non-technical administrators. The UX approach is role-based, task-focused, and aligned to reporting deadlines.

| User Group              | Primary Tasks                           | UX Focus                                                 |
| ----------------------- | --------------------------------------- | -------------------------------------------------------- |
| viaSport Administrators | Oversight, analytics, compliance review | Cross-org dashboards, audit access, admin tools          |
| PSO Reporters           | Data submission, report tracking        | Streamlined forms, progress tracking, deadline awareness |
| Data Stewards           | Data quality, imports                   | Validation tools, error resolution, bulk operations      |

### Role-Based Portal Design

Each user sees a personalized dashboard based on role and organization. The dashboard surfaces relevant actions, pending tasks, and submission status without requiring deep navigation.

### Navigation and Workflow

- **Dashboard-led navigation:** Cards and summaries link directly to forms, reporting tasks, analytics, and support.
- **Command palette:** Keyboard navigation (Cmd or Ctrl plus K) to jump to pages, forms, and records.
- **Contextual links:** Templates, guides, and support appear alongside relevant tasks.

### Responsive Design

The interface adapts to desktop, tablet, and mobile viewports. Core workflows remain available on mobile for reviewers and administrators on the go.

### Accessibility

The interface is built on Radix UI primitives and shadcn/ui components, which
provide keyboard navigation and ARIA defaults. Accessibility evidence is
summarized in Section 1.3.

### UX Refinement Process

During Planning and Discovery we will:

- Validate navigation structure against real viaSport workflows
- Identify friction points from legacy system usage
- Refine dashboard widgets to surface the most relevant information
- Apply viaSport branding and terminology

Detailed functional compliance for forms, submissions, and reporting lives in **System Requirements Compliance Crosswalk** (DM-AGG-001 and RP-AGG-003).

## Technology Stack and Benefits

### Frontend

| Technology     | Purpose                    | Benefit                                                         |
| -------------- | -------------------------- | --------------------------------------------------------------- |
| TanStack Start | Full-stack React framework | Type-safe end-to-end, server-side rendering, file-based routing |
| React 19       | UI library                 | Performance optimizations and modern suspense support           |
| TypeScript     | Type system                | Compile-time error detection and maintainability                |
| Tailwind CSS   | Styling                    | Consistent design system, rapid iteration                       |
| shadcn/ui      | Component library          | Accessible components with full customization control           |

### Backend and Middleware

| Technology                      | Purpose         | Benefit                                                    |
| ------------------------------- | --------------- | ---------------------------------------------------------- |
| TanStack Start Server Functions | API layer       | Co-located with UI, type-safe, no separate backend service |
| Drizzle ORM                     | Database access | Lightweight, predictable, typed schema mapping             |
| Better Auth                     | Authentication  | MFA support, session management, OAuth integration         |

### Database

| Technology            | Purpose            | Benefit                                         |
| --------------------- | ------------------ | ----------------------------------------------- |
| PostgreSQL on AWS RDS | Primary data store | Proven enterprise database, tested at 20M+ rows |

### Hosting

| Technology     | Purpose          | Benefit                               |
| -------------- | ---------------- | ------------------------------------- |
| AWS Lambda     | Application tier | Serverless, auto-scaling, pay-per-use |
| AWS CloudFront | CDN              | Edge caching, fast delivery           |
| AWS S3         | Object storage   | Documents, imports, artifacts         |
| AWS SQS        | Message queues   | Reliable notification delivery        |
| AWS SES        | Email            | Transactional email delivery          |

### Analytics

| Technology         | Purpose                | Benefit                                          |
| ------------------ | ---------------------- | ------------------------------------------------ |
| Native BI Platform | Self-service analytics | Built-in tenancy enforcement and audited exports |
| ECharts            | Charting               | Interactive visualizations                       |
| TanStack Table     | Data grids             | Sortable, filterable pivot tables with export    |

### Performance Evidence

Lighthouse and load tests were run in the prototype environment. Final validation runs will be completed before submission (TBD).

| Metric                   | Score or Value | Target  | Status |
| ------------------------ | -------------- | ------- | ------ |
| Performance Score        | 93/100         | >80     | Pass   |
| Largest Contentful Paint | 2284ms         | <2500ms | Pass   |
| Time to First Byte       | 380ms          | <500ms  | Pass   |
| Total Blocking Time      | 88ms           | <300ms  | Pass   |
| Cumulative Layout Shift  | 0              | <0.1    | Pass   |

See Section 1.3 for performance evidence and planned final runs.
