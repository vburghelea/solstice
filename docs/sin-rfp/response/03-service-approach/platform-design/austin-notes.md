# Austin's Notes - Platform Design & Customization

## Status: Strong - well documented

## What's Already Documented

### AWS Services Used

| Service         | Purpose                                        |
| --------------- | ---------------------------------------------- |
| CloudFront      | CDN, edge caching                              |
| Lambda          | Serverless application tier                    |
| RDS PostgreSQL  | Primary database                               |
| S3              | Object storage (documents, imports, artifacts) |
| SQS             | Message queues (notifications)                 |
| EventBridge     | Cron scheduling                                |
| SES             | Email sending                                  |
| CloudWatch      | Metrics, logs, alarms                          |
| CloudTrail      | API audit logging                              |
| GuardDuty       | Threat detection                               |
| Secrets Manager | Credential storage                             |
| KMS             | Encryption key management                      |

### Why AWS?

- **Canadian region** (ca-central-1) for PIPEDA compliance
- **Serverless-first** reduces ops burden
- **Mature, battle-tested** services
- **SST integration** for Infrastructure as Code

### Environment Strategy

| Stage    | Purpose                           |
| -------- | --------------------------------- |
| sin-dev  | Development, testing              |
| sin-perf | Performance testing, load testing |
| sin-prod | Production                        |

Each environment is fully isolated with its own:

- Database instance
- S3 buckets
- Lambda functions
- Secrets

### CI/CD Pipeline

1. Developer pushes code
2. Pre-commit hooks run: lint, type check, format
3. Tests run automatically
4. Manual promotion to perf/prod via `sst deploy --stage <stage>`
5. No direct production access - all changes go through pipeline

### Infrastructure as Code

- **SST (Serverless Stack)**: Entire infrastructure defined in TypeScript
- Version controlled alongside application code
- Repeatable deploys - can recreate any environment
- Audit trail of infrastructure changes

## Questions for Austin

1. Anything to add about the platform design approach?
2. Do you want to emphasize the IaC/DevOps maturity?
3. Any customization capabilities to highlight?

## Potential Talking Points

### Why Serverless?

- No servers to patch or maintain
- Auto-scales to handle load spikes (e.g., reporting deadline days)
- Cost-efficient: pay only for actual usage
- High availability built-in

### Why Infrastructure as Code?

- Reproducible environments
- No "works on my machine" issues
- Audit trail of all infrastructure changes
- Disaster recovery: can rebuild entire stack from code

### Customization Capabilities

- Tenant-specific feature flags
- Configurable branding (logo, colors)
- Form builder for custom data collection
- Flexible role-based permissions
