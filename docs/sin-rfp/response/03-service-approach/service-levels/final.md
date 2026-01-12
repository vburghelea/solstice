# Service Levels, Support, and Reliability

viaSport is procuring an SLA-backed managed service: a platform that performs reliably during reporting cycles, with clear operational ownership. This section defines the service level commitments included in the Platform Subscription + Managed Service.

## Availability and Uptime

| Metric                        | Target                                                                         |
| :---------------------------- | :----------------------------------------------------------------------------- |
| Monthly availability target   | 99.9% (excluding scheduled maintenance)                                        |
| Scheduled maintenance windows | Communicated 7 days in advance; typically during low-usage periods             |
| Emergency maintenance         | Critical security or stability issues only; immediate notification to viaSport |

Availability is measured as the percentage of time the production application is accessible and functional during each calendar month.

## Monitoring and Alerting

| Capability                | Implementation                                                                                                                      |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------- |
| Application monitoring    | 24/7 automated monitoring of application health, response times, and error rates                                                    |
| Infrastructure monitoring | AWS CloudWatch metrics for compute, database, storage, and network                                                                  |
| Security monitoring       | CloudTrail audit logging with Center for Internet Security (CIS) Benchmark alarms (root usage, IAM changes, security group changes) |
| Alerting                  | Automated alerts to service team for threshold breaches and anomalies                                                               |
| Status communication      | Proactive notification to viaSport for incidents affecting service                                                                  |

## Incident Response

### Severity Definitions

| Severity          | Definition                                                                 | Examples                                                                        |
| :---------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| Sev 1 \- Critical | System unavailable or major security incident; significant business impact | Production down, data breach, complete loss of core functionality               |
| Sev 2 \- High     | Major function impaired; workaround may exist but impacts productivity     | Reporting unavailable during deadline period, login failures for multiple users |
| Sev 3 \- Medium   | Issue affecting users but workaround available                             | Single feature not working, performance degradation, minor UI issues            |
| Sev 4 \- Low      | Minor issue or cosmetic defect; minimal business impact                    | Typo, minor styling issue, enhancement request                                  |

### Response and Resolution Targets

| Severity         | First Response | Target Resolution | Escalation                                                                                   |
| :--------------- | :------------- | :---------------- | :------------------------------------------------------------------------------------------- |
| Sev 1 - Critical | 60 minutes     | Same business day | Immediate escalation to delivery lead; updates to viaSport every 60 minutes until mitigation |
| Sev 2 \- High    | 8 hours        | 2 business days   | Escalation if no progress in 24 hours                                                        |
| Sev 3 \- Medium  | 24 hours       | 5 business days   | Standard workflow                                                                            |
| Sev 4 \- Low     | 48 hours       | 10 Business Days  | Standard workflow                                                                            |

**Business hours:** Monday to Friday, 9:00 AM to 5:00 PM Pacific Time, excluding BC statutory holidays.

**Note:** Resolution targets depend on issue complexity and may require additional time for root-cause analysis. viaSport will be kept informed of progress and revised estimates.

### 24/7 Support Option

24/7 response coverage is available as an optional add-on ($30,000-$50,000/year). This provides:

- After-hours monitoring with on-call response
- Sev 1 response target reduced to 2 hours
- Weekend and holiday coverage

## Support Channels

| Channel                                                         | Use Case                                    | Response                                             |
| :-------------------------------------------------------------- | :------------------------------------------ | :--------------------------------------------------- |
| In-app support requests                                         | General questions, how-to, feature requests | Ticket created with unique ID; tracked to resolution |
| Email ([support@solsticeapp.ca](mailto:support@solsticeapp.ca)) | Technical issues, bug reports, escalations  | Same ticketing workflow                              |
| Emergency contact                                               | Sev 1 incidents only                        | Direct phone/text to delivery lead                   |

### Support Workflow

1. User submits request (in-app or email)
2. Ticket created with unique ID and severity assignment
3. Acknowledgement sent to user
4. Service team triages and assigns
5. Response provided (in-app notification and email)
6. User can reply or mark resolved
7. Ticket closed with resolution summary

viaSport receives monthly support reports covering ticket volume, response times, resolution rates, and trends.

## Backup and Recovery

| Parameter                      | Commitment                                    |
| :----------------------------- | :-------------------------------------------- |
| Backup frequency               | Continuous (point-in-time recovery enabled)   |
| Backup retention               | 35 days in production                         |
| Recovery Point Objective (RPO) | 1 hour                                        |
| Recovery Time Objective (RTO)  | 4 hours                                       |
| DR drill frequency             | Quarterly                                     |
| DR drill reporting             | Results reported to viaSport after each drill |

### High Availability

Production environment uses Multi-AZ deployment for automatic failover. Database and application tiers are distributed across multiple availability zones within AWS Canada (Central).

## Security Operations

| Activity                     | Cadence                                                       |
| :--------------------------- | :------------------------------------------------------------ |
| Security patching (routine)  | Monthly, during scheduled maintenance windows                 |
| Security patching (critical) | Within 2 business days of vendor patch availability           |
| Dependency updates           | Monthly review; immediate for security-related updates        |
| Security reviews             | Quarterly review of access controls, configurations, and logs |
| Penetration testing          | Available as optional add-on (see Commercial Model)           |

## Release Management

| Aspect              | Approach                                                        |
| :------------------ | :-------------------------------------------------------------- |
| Release cadence     | Periodic releases based on roadmap; security patches as needed  |
| Release notes       | Provided to viaSport before each release                        |
| Staging validation  | All releases validated in staging environment before production |
| Rollback capability | Immediate rollback available if issues detected post-release    |
| Change log          | Maintained and accessible to viaSport administrators            |

## Reporting to viaSport

viaSport will receive regular operational reports:

| Report              | Frequency | Contents                                                |
| :------------------ | :-------- | :------------------------------------------------------ |
| Support summary     | Monthly   | Ticket volume, response times, resolution rates, trends |
| Availability report | Monthly   | Uptime percentage, incidents, maintenance windows       |
| Security summary    | Quarterly | Patching status, security reviews, any incidents        |
| DR drill results    | Quarterly | Drill execution, recovery times achieved, any issues    |

## Service Level Governance

### Review Cadence

- **Monthly:** Operational review (support metrics, availability, upcoming maintenance)
- **Quarterly:** Service review (SLA performance, security posture, roadmap alignment)
- **Annual:** Contract review (renewal terms, service level adjustments, pricing)

### Escalation Path

| Level   | Contact                        | Trigger                                        |
| :------ | :----------------------------- | :--------------------------------------------- |
| Level 1 | Support team                   | All tickets                                    |
| Level 2 | Technical lead (Will Siddall)  | Sev 1-2 incidents, complex technical issues    |
| Level 3 | Delivery lead (Austin Wallace) | Sev 1 incidents, escalations, service concerns |

### Service Credits

Service credits apply when the monthly availability target is missed. Credits are applied to the following quarter's invoice based on the schedule below:

| Monthly Availability | Credit                      |
| :------------------- | :-------------------------- |
| 99.0% \- 99.9%       | 5% of monthly subscription  |
| 95.0% \- 99.0%       | 10% of monthly subscription |
| Below 95.0%          | 25% of monthly subscription |

Credits are applied to the following quarter's invoice upon viaSport request with documented evidence of downtime.

---

_Full service level terms can be incorporated into a formal SLA schedule as part of the contract._

---
