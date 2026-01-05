# Service Approach: Platform Design and Customization

## Cloud Provider Services

The platform is built on Amazon Web Services in the ca-central-1 (Montreal) region.

| Service         | Purpose                                    |
| --------------- | ------------------------------------------ |
| CloudFront      | CDN for static assets and edge caching     |
| Lambda          | Serverless application compute             |
| RDS PostgreSQL  | Managed relational database                |
| S3              | Object storage for documents and imports   |
| SQS             | Message queues for notifications           |
| SES             | Transactional email delivery               |
| EventBridge     | Scheduled jobs for retention and reminders |
| CloudWatch      | Metrics, logs, alarms                      |
| CloudTrail      | API audit logging                          |
| GuardDuty       | Threat detection                           |
| Secrets Manager | Credential storage with rotation           |
| KMS             | Encryption key management                  |

### Why AWS

| Factor           | Rationale                      |
| ---------------- | ------------------------------ |
| Canadian region  | Data residency compliance      |
| Serverless-first | Reduced operational burden     |
| Mature services  | Strong SLAs and documentation  |
| SST integration  | Infrastructure as code for AWS |

### Why Serverless

Serverless provides:

1. No server management or patching
2. Automatic scaling during peak reporting periods
3. Pay-per-use cost efficiency
4. High availability across availability zones

### Infrastructure as Code

Infrastructure is defined in TypeScript using SST. This provides:

- Reproducible environments
- Version control for infrastructure changes
- Disaster recovery from code
- Environment parity across dev, perf, and prod

## Development and Customization Process

### Environment Strategy

| Environment | Purpose                 | Infrastructure Tier                         |
| ----------- | ----------------------- | ------------------------------------------- |
| sin-dev     | Development and testing | t4g.micro, 50 GB, single-AZ                 |
| sin-perf    | Performance testing     | t4g.large, 200 GB, single-AZ                |
| sin-prod    | Production              | t4g.large, 200 GB, Multi-AZ, 35-day backups |

Each environment is isolated with its own database, storage, and credentials.

### Development Workflow

```
Developer writes code
        |
        v
Pre-commit checks (lint, type check, format)
        |
        v
Automated tests
        |
        v
Code review and merge
        |
        v
Deploy to sin-dev (automatic)
        |
        v
Deploy to sin-perf (manual, for load testing)
        |
        v
Deploy to sin-prod (manual, after UAT sign-off)
```

### Quality Gates

| Gate          | Tooling           | Purpose                        |
| ------------- | ----------------- | ------------------------------ |
| Linting       | oxlint and ESLint | Code quality                   |
| Type checking | TypeScript        | Compile-time validation        |
| Formatting    | oxfmt             | Consistent style               |
| Unit tests    | Vitest            | Component and function testing |
| E2E tests     | Playwright        | Full user flow testing         |

### Deployment Process

Deployments are executed with SST:

```
npx sst deploy --stage sin-prod
```

This builds the application, deploys infrastructure, and updates application services. Database schema changes are applied through versioned migrations when required.

### Rollback

- Previous Lambda versions remain available for quick rollback.
- Database migrations include rollback plans when needed.
- SST maintains deployment history for audit and recovery.

### Customization Capabilities

The platform supports configuration without code changes:

| Customization         | Method                                        |
| --------------------- | --------------------------------------------- |
| Branding              | Tenant configuration (logo, colors, name)     |
| Forms                 | Form builder UI for custom data collection    |
| Roles and permissions | Admin UI for role management                  |
| Notifications         | Configurable templates and reminder schedules |
| Retention policies    | Admin-configurable retention periods          |

### Change Management

Changes to production follow a defined process:

1. Change request submitted
2. Impact assessment (scope, risk, timeline)
3. Development and testing in sin-dev
4. Performance validation in sin-perf
5. UAT sign-off
6. Deployment to sin-prod
7. Post-deployment verification

Emergency changes follow an expedited process with retrospective documentation.
