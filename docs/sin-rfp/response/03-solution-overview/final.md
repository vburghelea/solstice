# Solution Overview

## Workflow Summary

The Solstice platform supports the full reporting lifecycle from PSO submission
to viaSport oversight and analytics.

1. PSOs submit data through forms, file uploads, or imports.
2. Validation rules check required fields and formatting on submission.
3. Reporting status is tracked with reminders and resubmission workflows.
4. Analytics and dashboards surface trends with role-based access controls.
5. Audit logs capture data changes, exports, and admin actions.

## Multi-Tenant Model

Each organization has isolated data and role-based permissions. viaSport admins
can view cross-organization reporting and analytics, while PSOs only access
their own records.

## viaSport Administrator Capabilities

- Configure forms and reporting cycles
- Manage organization access and delegated roles
- Monitor submission status and compliance
- Review audit logs and security events
- Set retention policies and legal holds
- Export analytics with audit logging

## PSO Capabilities

- Submit reports and supporting files
- Track submission status and deadlines
- Correct validation errors and resubmit
- View organization-level dashboards
- Export approved datasets within role permissions

## Migration Summary

Legacy data is extracted, mapped, validated, and imported with an auditable
trail and rollback support. See **Service Approach: Data Migration** for the
detailed migration plan and cutover steps.
