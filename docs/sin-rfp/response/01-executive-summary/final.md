# Executive Summary

Austin Wallace Tech is pleased to respond to viaSport British Columbia's Request for Proposal for the Strength in Numbers Project: B.C. Amateur Sport Information Management System Replacement. We believe that British Columbia's amateur sport sector deserves a modern, secure, and purpose-built information management platform that enables informed decision-making, reduces administrative burden, and sets a robust digital foundation for the province's next decade of sport development. That is why we have invested in building a working prototype specifically designed to meet viaSport's requirements.

Replacing legacy systems that have served the sector for over 15 years presents both an opportunity and a risk. The opportunity is to create a foundational digital layer for amateur sport in B.C.: a shared data and information platform that transforms how participation, funding, equity, and impact are understood. The risk is that new system development often encounters delays, cost overruns, and gaps between design and delivery. We have addressed this risk directly by building a functional prototype that already satisfies the majority of system requirements and has been load-tested at production scale with 20.1 million rows of data. This approach significantly de-risks viaSport's decision and demonstrates our commitment to delivering a proven solution, not a promise.

The key highlights of our response are as follows:

**De-Risked Delivery:** We are not proposing to build a system from scratch. A working prototype already exists, purpose-built for viaSport's Strength in Numbers requirements. This prototype has been load-tested with 20.1 million rows of historical data, achieving sub-250 millisecond response times (p95) with zero server errors. The prototype implements the majority of the System Requirements Addendum items today, with the remaining items scoped and scheduled for delivery. This level of pre-existing development significantly reduces delivery risk and accelerates the path to production.

A live prototype environment is available upon request; access details are provided in Appendix A (placeholders until final deployment).

**Domain Expertise:** Austin Wallace, Project Lead, brings a unique combination of enterprise data engineering experience and deep understanding of amateur sport governance. As Chair of the International Quidditch Association, he led data and technology strategy for 30+ national governing bodies worldwide. At the New Jersey Devils (NHL), he served as sole Data Developer, building an end-to-end data platform processing 10 million rows per game of NHL tracking data to support multi-million dollar player decisions. At Clio, he owns 10+ Databricks pipelines and unlocked over $1 million in value through responsible AI enablement. His B.Sc. from UBC in Analytical Sports Management, a custom degree combining business, statistics, and machine learning, was designed specifically for this intersection of sport and data.

Will Siddal, Senior Developer, brings 2+ years of full-stack development experience at Teck Resources, one of Canada's largest mining companies. At Teck, he built mission-critical reporting pipelines processing billions of rows annually, developed internal tools using React and TypeScript, and managed cloud infrastructure on AWS using Terraform. His experience spans the full stack: Python, PostgreSQL, Snowflake, and modern frontend frameworks. Will holds a degree from Simon Fraser University and is based in British Columbia.

**Canadian Data Residency & Compliance:** All data is hosted exclusively in AWS ca-central-1 (Montreal), ensuring compliance with Canadian privacy statutes including PIPEDA. The platform implements encryption at rest (AWS KMS) and in transit (TLS 1.2+), multi-factor authentication with TOTP and backup codes, role-based access control with organization-scoped permissions, and immutable audit logging with tamper-evident hash chains. Audit logs are retained for 7 years with archival to S3 Glacier Deep Archive. AWS maintains a Data Processing Addendum covering all services including SES for email delivery.

**Modern, Sustainable Architecture:** The platform is built on a serverless architecture using AWS Lambda, RDS PostgreSQL, S3, SQS, SES, and CloudFront. This approach eliminates server management overhead, scales automatically to handle peak loads (such as reporting deadline periods), and optimizes costs by charging only for actual usage. Infrastructure is defined as code using SST (infrastructure as code), enabling reproducible deployments, disaster recovery, and full audit trails of infrastructure changes. The technology stack (TanStack Start, React 19, TypeScript, Drizzle ORM, and shadcn/ui) represents 2025 best practices for longevity, maintainability, and performance.

**Our Proposed Solution:**

The Solstice platform delivers a comprehensive information management system designed specifically for viaSport's requirements:

_Data Submission & Reporting Portal:_ A secure, responsive web portal with role-based dashboards for viaSport administrators, PSO reporters, and data stewards. The portal includes a customizable form builder, file upload capabilities, real-time submission tracking, and automated notifications. The interface is built on accessible Radix UI primitives and is tested for performance and usability (Lighthouse metrics available on request).

_Native Analytics Platform:_ Rather than integrating third-party tools such as Metabase or Superset, we built analytics directly into the platform to ensure every query respects tenancy boundaries, every export is audited, and every field-level permission is enforced. Users can build ad-hoc pivot tables and charts, export to CSV, Excel, or JSON, and access self-service analytics without developer intervention.

_Data Warehousing:_ PostgreSQL on AWS RDS provides the analytical backbone, with capacity tested at 20+ million rows and headroom to scale 10x or more. The architecture supports real-time data freshness without ETL delays, multi-AZ failover for high availability, and 35-day backup retention with quarterly disaster recovery drills.

_Migration Tooling:_ Production-ready import infrastructure handles CSV/Excel imports with configurable field mapping, validation rules, preview before commit, and rollback capabilities. Batch processing via AWS ECS Fargate supports large-scale imports with checkpointing for resumability. Migration methodology will be finalized collaboratively based on BCAR/BCSI system capabilities.

_Training & Onboarding:_ In-app guided walkthroughs, a searchable help center with categorized guides and FAQs, a centralized templates hub, and an integrated support request system with status tracking. All training content will be refined through UX interviews with viaSport stakeholders to ensure relevance to actual workflows.

**Proposed Timeline:**

We propose an 18-week implementation timeline from contract signing to full rollout:

| Phase                   | Duration | Milestone             |
| ----------------------- | -------- | --------------------- |
| Planning & Discovery    | 2 weeks  | Requirements sign-off |
| Development & Migration | 6 weeks  | Code complete         |
| User Acceptance Testing | 4 weeks  | UAT sign-off          |
| viaSport Training       | 2 weeks  | Soft launch           |
| PSO Rollout             | 4 weeks  | Full rollout          |

This accelerated timeline is possible because of the extensive prototyping work already completed. Remaining work is refinement, migration, and production hardening, not greenfield development. We acknowledge inherent project risks and commit to early, transparent communication if timeline adjustments become necessary.

**Team:**

| Role                         | Team Member       |
| ---------------------------- | ----------------- |
| Project Lead / Data Engineer | Austin Wallace    |
| Senior Developer             | Will Siddal       |
| Security Expert              | TBD (in progress) |
| UX Designer                  | TBD (in progress) |

Austin Wallace, the architect and sole developer of the working prototype, will lead delivery directly. This principal-led approach ensures continuity from prototype through production, eliminates hand-off risk, and provides viaSport with direct access to the person who understands the system most deeply.

---

Austin Wallace Tech welcomes the opportunity to present the working prototype to viaSport and discuss how this solution can serve as the foundation for B.C. amateur sport's next decade of data-driven decision-making. We are prepared to participate in a virtual presentation and demonstration at viaSport's convenience.
