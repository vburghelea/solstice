# Appendix: Exit and Portability Options

## Overview

Austin Wallace Tech is committed to viaSport's long-term success, whether that means a sustained partnership or a smooth transition to an alternative solution. This appendix describes the data ownership, portability, and continuity options available to viaSport.

## Data Ownership

**viaSport owns all of its data.** This includes:

- All form submissions and attachments
- User accounts and organization structures
- Configuration (forms, templates, reporting definitions)
- Audit logs and historical records
- Analytics queries and saved reports

Austin Wallace Tech has no claim to viaSport's data. Data ownership is not contingent on contract status.

## Baseline: Data Portability (Included)

Data portability is included in the base subscription at no additional cost.

### Export Capabilities

| Data Type                        | Export Formats          | Access                     |
| -------------------------------- | ----------------------- | -------------------------- |
| Form submissions                 | CSV, Excel, JSON        | Self-service via UI or API |
| Attachments and documents        | Original file formats   | Bulk download available    |
| User and organization data       | CSV, JSON               | Admin export function      |
| Audit logs                       | CSV, JSON               | Admin export function      |
| Analytics queries                | SQL export, CSV results | Self-service               |
| Configuration (forms, templates) | JSON schema export      | Admin export function      |

### Full Database Export

Upon request or at contract termination, viaSport can receive:

- Complete PostgreSQL database dump
- S3 bucket contents (all documents and attachments)
- Schema documentation and data dictionary
- Relationship diagrams and entity documentation

Export is provided within 30 days of request at no additional charge.

### Operational Documentation

The following documentation is provided to support continuity:

| Document              | Contents                                                   |
| --------------------- | ---------------------------------------------------------- |
| Schema documentation  | Database schema, relationships, field definitions          |
| API documentation     | Endpoint specifications, authentication, examples          |
| Operational runbooks  | Deployment procedures, monitoring setup, common operations |
| Architecture overview | System components, data flows, integration points          |

## Option 1: Source Code Escrow

Source code escrow provides viaSport with access to the platform source code under defined trigger conditions, without requiring ongoing access during normal operations.

### How It Works

1. Austin Wallace Tech deposits current source code with a neutral escrow agent
2. Code is updated with each major release (quarterly)
3. Escrow agent verifies deposits are complete and buildable
4. Code remains secured unless a release condition is triggered

### Release Conditions

The escrow is released to viaSport if any of the following occur:

| Condition          | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| Insolvency         | Austin Wallace Tech files for bankruptcy or ceases operations         |
| Failure to support | Material failure to meet SLA obligations for 90+ consecutive days     |
| Abandonment        | Austin Wallace Tech fails to respond to support requests for 60+ days |
| Mutual agreement   | Both parties agree to release                                         |

### What's Included in Escrow

- Complete application source code
- Infrastructure as Code (SST configuration)
- Build and deployment scripts
- Test suites
- Development environment setup instructions
- Third-party dependency manifest

### Escrow Agents

Austin Wallace Tech can work with viaSport's preferred escrow agent, or recommend:

- Iron Mountain Intellectual Property Management
- NCC Group Escrow
- Escrow London

### Escrow Pricing

Escrow setup and annual maintenance fees are typically $1,500-$3,000/year depending on the escrow agent. This can be:

- Paid directly by viaSport, or
- Included in the subscription at viaSport's request

## Option 2: Perpetual License to Customizations

At contract end, viaSport can receive a perpetual, royalty-free license to viaSport-specific customizations and configuration.

### What's Included

| Item                                  | Description                                                                |
| ------------------------------------- | -------------------------------------------------------------------------- |
| viaSport-specific forms and templates | All form definitions, validation rules, and templates created for viaSport |
| Configuration and metadata            | Organization structures, role definitions, workflow configurations         |
| viaSport branding assets              | As integrated into the platform                                            |
| Custom reports and analytics          | Saved queries, dashboard configurations, report definitions                |
| Integration code                      | Any viaSport-specific integrations developed during the engagement         |

### What's NOT Included

The perpetual license does **not** include:

- Core Solstice platform source code (available via escrow option)
- Third-party licensed components
- Hosting infrastructure or AWS resources
- Ongoing support or maintenance

### Use Rights

viaSport may use the licensed materials to:

- Operate internally or through a third-party contractor
- Migrate to an alternative platform
- Archive for reference

viaSport may **not** resell or sublicense the materials.

### Perpetual License Pricing

The perpetual license option is available at contract end for a one-time fee of **$50,000**, or can be negotiated as part of the initial contract.

## Option 3: Transition Support

If viaSport chooses not to renew, Austin Wallace Tech will provide transition support to minimize disruption.

### Transition Support Includes

| Activity              | Description                                                                                       | Duration                         |
| --------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------- |
| Knowledge transfer    | Sessions with viaSport or replacement vendor covering architecture, operations, and configuration | Up to 20 hours                   |
| Data extraction       | Complete data export in requested formats                                                         | Included                         |
| Parallel operation    | Maintain production system during transition period                                               | Up to 90 days after contract end |
| Documentation handoff | All operational documentation, runbooks, and schema documentation                                 | Included                         |
| Q&A support           | Email support for technical questions during transition                                           | Up to 90 days                    |

### Transition Support Pricing

- **Basic transition** (data export + documentation): Included at no charge
- **Extended transition** (knowledge transfer + parallel operation + Q&A): $25,000 flat fee or hourly at $175/hour

## Recommended Approach

For most organizations, we recommend:

1. **Baseline data portability** (included) - ensures viaSport always has access to its data
2. **Source code escrow** (optional) - provides insurance against vendor risk without ongoing complexity
3. **Transition support** (if needed) - ensures smooth handoff if viaSport changes direction

The perpetual license option is primarily valuable if viaSport intends to operate the platform internally or through another vendor after contract end.

## Summary of Options

| Option              | What You Get                            | Cost                                   |
| ------------------- | --------------------------------------- | -------------------------------------- |
| Data portability    | Full data export, documentation         | Included                               |
| Source code escrow  | Code access upon trigger conditions     | $1,500-$3,000/year (escrow agent fees) |
| Perpetual license   | License to viaSport customizations      | $50,000 one-time                       |
| Basic transition    | Data export + documentation handoff     | Included                               |
| Extended transition | Knowledge transfer + parallel ops + Q&A | $25,000 or hourly                      |

## Contract Language

Specific terms for data ownership, portability, escrow, and transition support can be incorporated into the master services agreement. Austin Wallace Tech is flexible on contract structure and welcomes discussion of viaSport's specific requirements.

---

_For questions about exit and portability options, contact: austin@solsticeapp.ca_
