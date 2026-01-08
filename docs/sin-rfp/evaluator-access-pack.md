# Solstice Platform - Evaluator Access Pack

**CONFIDENTIAL - For viaSport RFP Evaluation Team Only**

---

## Overview

This document contains credentials for accessing the Solstice prototype for the Strength in Numbers RFP evaluation. Please keep these credentials secure and do not share outside the evaluation team.

## Environment Details

| Item            | Value                                            |
| --------------- | ------------------------------------------------ |
| **Demo URL**    | https://sin-uat.solstice.viasport.ca             |
| **Environment** | `sin-uat` (User Acceptance Testing)              |
| **Data**        | Synthetic test data only - no real viaSport data |
| **Monitoring**  | Environment is monitored via CloudTrail          |

## Test Accounts

### viaSport Staff (Full Admin Access)

| Field        | Value                                                |
| ------------ | ---------------------------------------------------- |
| Email        | `viasport-staff@example.com`                         |
| Password     | `testpassword123`                                    |
| Access Level | viaSport administrator with full organization access |
| MFA          | Enabled (TOTP)                                       |

**MFA Setup:** This account has multi-factor authentication enabled to demonstrate the security controls. When prompted for MFA:

- Use any TOTP authenticator app (Google Authenticator, Authy, 1Password, etc.)
- TOTP Secret: `JBSWY3DPEHPK3PXP`
- Or contact austin@austinwallace.tech for a one-time bypass code

### PSO Admin

| Field        | Value                                |
| ------------ | ------------------------------------ |
| Email        | `pso-admin@example.com`              |
| Password     | `testpassword123`                    |
| Access Level | BC Hockey organization administrator |
| MFA          | Disabled for evaluation convenience  |

### Club Reporter

| Field        | Value                                         |
| ------------ | --------------------------------------------- |
| Email        | `club-reporter@example.com`                   |
| Password     | `testpassword123`                             |
| Access Level | North Shore Club reporter (submission access) |
| MFA          | Disabled for evaluation convenience           |

### Viewer (Read-Only)

| Field        | Value                                     |
| ------------ | ----------------------------------------- |
| Email        | `member@example.com`                      |
| Password     | `testpassword123`                         |
| Access Level | View-only access to assigned organization |
| MFA          | Disabled for evaluation convenience       |

## Suggested Evaluation Walkthrough

We recommend starting with the **viaSport Staff** account to see the full platform capabilities:

1. **Login** at the demo URL using viaSport Staff credentials
2. **Dashboard** - Explore the role-based admin dashboard
3. **Form Builder** - Create a test form to see the configuration options
4. **Data Submission** - Submit sample data using the form
5. **Analytics** - View the submission in the analytics platform
6. **Reporting** - Build a pivot table and export to CSV
7. **Audit Trail** - Review audit logs for recent actions
8. **Security Dashboard** - Review security events and account lockouts
9. **Retention Controls** - View retention policies and legal hold capabilities
10. **Help Center** - Explore guided walkthroughs and documentation

Then try the **PSO Admin** and **Club Reporter** accounts to see the role-based access controls in action.

## Quick Reference: Requirement Validation

For a requirement-by-requirement walkthrough tied to the System Requirements Addendum, see the **Prototype Evaluation Guide** in the main proposal document.

## Support During Evaluation

If you encounter any issues during evaluation:

- **Email:** austin@austinwallace.tech
- **Response time:** Within 4 business hours

We're happy to schedule a live walkthrough or screen share if helpful.

## Credential Rotation

These credentials will be:

- Rotated after the evaluation period concludes
- Disabled if the evaluation team notifies us they are complete

---

**Austin Wallace Tech**
Victoria, British Columbia
austin@austinwallace.tech
