# Service Approach: Platform Design and Customization

## Cloud Provider Services

### AWS Services

The platform is built entirely on Amazon Web Services, deployed in the ca-central-1 (Montreal) region for Canadian data residency.

| Service             | Purpose                                                                     |
| ------------------- | --------------------------------------------------------------------------- |
| **CloudFront**      | Content delivery network for static assets and edge caching                 |
| **Lambda**          | Serverless application compute                                              |
| **RDS PostgreSQL**  | Managed relational database                                                 |
| **S3**              | Object storage for documents, imports, and audit archives                   |
| **SQS**             | Message queues for asynchronous notification processing                     |
| **SES**             | Transactional email delivery                                                |
| **EventBridge**     | Cron scheduling for automated jobs (retention, notifications, data quality) |
| **CloudWatch**      | Metrics, logs, and alarms                                                   |
| **CloudTrail**      | API audit logging                                                           |
| **GuardDuty**       | Threat detection                                                            |
| **Secrets Manager** | Credential storage with rotation                                            |
| **KMS**             | Encryption key management                                                   |

### Why AWS

| Factor           | Rationale                                            |
| ---------------- | ---------------------------------------------------- |
| Canadian region  | ca-central-1 provides data residency compliance      |
| Serverless-first | Reduces operational burden, no server patching       |
| Mature services  | Battle-tested, well-documented, strong SLAs          |
| SST integration  | Infrastructure as Code tooling purpose-built for AWS |

### Why Serverless

The serverless architecture provides specific benefits for viaSport:

1. **No infrastructure management:** AWS handles server provisioning, patching, and scaling.
2. **Automatic scaling:** Application scales up during peak periods (reporting deadlines) and scales down during quiet periods.
3. **Cost efficiency:** Pay only for actual compute time, not idle capacity.
4. **High availability:** Lambda automatically distributes across multiple Availability Zones.

### Infrastructure as Code

All infrastructure is defined in TypeScript using SST (Serverless Stack). This approach provides:

| Benefit            | Description                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| Reproducibility    | Any environment can be recreated from code                                    |
| Version control    | Infrastructure changes tracked in git alongside application code              |
| Audit trail        | Full history of what changed, when, and by whom                               |
| Disaster recovery  | Entire stack can be rebuilt from code if needed                               |
| Environment parity | Development, performance testing, and production use identical configurations |

## Development and Customization Process

### Environment Strategy

| Environment | Purpose                           | Infrastructure Tier                               |
| ----------- | --------------------------------- | ------------------------------------------------- |
| sin-dev     | Development and testing           | Minimal (t4g.micro, single-AZ)                    |
| sin-perf    | Performance testing, load testing | Production-like (t4g.large, 200GB)                |
| sin-prod    | Production                        | Full (t4g.large, 200GB, Multi-AZ, 35-day backups) |

Each environment is fully isolated with its own:

- Database instance
- S3 buckets
- Lambda functions
- Secrets
- Domain/URL

### Development Workflow

```
Developer writes code
        ↓
Pre-commit hooks run (lint, type check, format)
        ↓
Automated tests run
        ↓
Code review and merge
        ↓
Deploy to sin-dev (automatic)
        ↓
Deploy to sin-perf (manual, for load testing)
        ↓
Deploy to sin-prod (manual, after UAT sign-off)
```

### Quality Gates

Code cannot be deployed without passing:

| Gate          | Tool           | Purpose                        |
| ------------- | -------------- | ------------------------------ |
| Linting       | oxlint, ESLint | Code style and error detection |
| Type checking | TypeScript     | Compile-time error detection   |
| Formatting    | oxfmt          | Consistent code style          |
| Unit tests    | Vitest         | Component and function testing |
| E2E tests     | Playwright     | Full user flow testing         |

### Deployment Process

Deployments are executed using SST:

```
npx sst deploy --stage sin-prod
```

This single command:

1. Builds the application
2. Synthesizes infrastructure changes
3. Deploys Lambda functions
4. Updates database schema (if needed)
5. Invalidates CDN cache
6. Reports deployment status

### Rollback

If issues are discovered after deployment:

- Previous Lambda versions remain available for instant rollback
- Database migrations include down migrations for schema rollback
- SST maintains deployment history for reference

### Customization Capabilities

The platform supports customization without code changes:

| Customization         | Method                                     |
| --------------------- | ------------------------------------------ |
| Branding              | Tenant configuration (logo, colors, name)  |
| Forms                 | Form builder UI for custom data collection |
| Roles and permissions | Admin UI for role management               |
| Notifications         | Configurable notification templates        |
| Retention policies    | Admin-configurable retention periods       |

### Change Management

Changes to the production environment follow a defined process:

1. Change request submitted (by viaSport or development team)
2. Impact assessment (scope, risk, timeline)
3. Development and testing in sin-dev
4. Performance validation in sin-perf (if applicable)
5. UAT in sin-perf
6. Deployment to sin-prod
7. Post-deployment verification

Emergency changes (security patches, critical bug fixes) follow an expedited process with retrospective documentation.
