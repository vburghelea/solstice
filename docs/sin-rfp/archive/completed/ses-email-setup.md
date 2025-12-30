# SES Email Setup Instructions

This document provides step-by-step instructions for setting up Amazon SES email delivery for Solstice.

## Overview

Solstice uses Amazon SES (Simple Email Service) for transactional emails including:

- Notification emails
- DSAR request notifications
- Digest emails
- Password reset emails

## Environments

| Environment | Domain/Email                  | Purpose             |
| ----------- | ----------------------------- | ------------------- |
| sin-dev     | `austinwallacetech@gmail.com` | Development testing |
| sin-prod    | `quadballcanada.com`          | Production          |
| qc-dev      | TBD                           | QC development      |
| qc-prod     | `quadballcanada.com`          | QC production       |

---

## Quick Setup: Individual Email (Development)

For development environments, you can verify a personal email address:

```bash
# 1. Create email identity (sends verification email to your inbox)
AWS_PROFILE=techdev aws sesv2 create-email-identity \
  --email-identity austinwallacetech@gmail.com \
  --region ca-central-1

# 2. Check your inbox and click the verification link from AWS

# 3. Confirm verification status
AWS_PROFILE=techdev aws sesv2 get-email-identity \
  --email-identity austinwallacetech@gmail.com \
  --region ca-central-1

# 4. Update the SST secret
AWS_PROFILE=techdev npx sst secret set SinNotificationsFromEmail "austinwallacetech@gmail.com" --stage sin-dev

# 5. Redeploy
AWS_PROFILE=techdev npx sst deploy --stage sin-dev
```

---

## Production Setup: Domain Verification

For production, verify the entire domain to send from any address.

### Step 1: Create Domain Identity

```bash
# Create domain identity
AWS_PROFILE=techprod aws sesv2 create-email-identity \
  --email-identity quadballcanada.com \
  --region ca-central-1

# Get DKIM tokens
AWS_PROFILE=techprod aws sesv2 get-email-identity \
  --email-identity quadballcanada.com \
  --region ca-central-1 \
  --query 'DkimAttributes'
```

The output will include 3 DKIM tokens like:

```json
{
  "Tokens": ["abc123...", "def456...", "ghi789..."],
  "SigningEnabled": true,
  "Status": "PENDING"
}
```

### Step 2: Add DNS Records

Add these records to your domain's DNS (via registrar or Route 53):

#### DKIM Records (3 CNAME records)

| Type  | Name                                     | Value                         |
| ----- | ---------------------------------------- | ----------------------------- |
| CNAME | `<token1>._domainkey.quadballcanada.com` | `<token1>.dkim.amazonses.com` |
| CNAME | `<token2>._domainkey.quadballcanada.com` | `<token2>.dkim.amazonses.com` |
| CNAME | `<token3>._domainkey.quadballcanada.com` | `<token3>.dkim.amazonses.com` |

Replace `<token1>`, `<token2>`, `<token3>` with the actual tokens from the AWS response.

#### SPF Record (TXT)

| Type | Name                 | Value                               |
| ---- | -------------------- | ----------------------------------- |
| TXT  | `quadballcanada.com` | `v=spf1 include:amazonses.com ~all` |

**Note**: If an SPF record already exists, add `include:amazonses.com` to it:

```
v=spf1 include:_spf.google.com include:amazonses.com ~all
```

#### DMARC Record (TXT)

| Type | Name                        | Value                                                         |
| ---- | --------------------------- | ------------------------------------------------------------- |
| TXT  | `_dmarc.quadballcanada.com` | `v=DMARC1; p=quarantine; rua=mailto:admin@quadballcanada.com` |

### Step 3: Wait for Verification

DNS propagation can take up to 72 hours. Check status:

```bash
# Check DKIM status
AWS_PROFILE=techprod aws sesv2 get-email-identity \
  --email-identity quadballcanada.com \
  --region ca-central-1 \
  --query 'DkimAttributes.Status'

# Expected output when verified: "SUCCESS"
```

### Step 4: Request Production Access (If in Sandbox)

New SES accounts are in "sandbox mode" which limits sending. Request production access:

```bash
AWS_PROFILE=techprod aws sesv2 put-account-details \
  --mail-type TRANSACTIONAL \
  --website-url "https://quadballcanada.com" \
  --use-case-description "Transactional emails for Solstice sports league management platform: notifications, password resets, DSAR request updates, and digest emails." \
  --region ca-central-1
```

Or request via AWS Console:

1. Go to SES Console > Account dashboard
2. Click "Request production access"
3. Fill out the form with use case details

### Step 5: Update SST Secrets

```bash
# Set FROM email
AWS_PROFILE=techprod npx sst secret set SinNotificationsFromEmail "notifications@quadballcanada.com" --stage sin-prod

# Set Reply-To email (optional)
AWS_PROFILE=techprod npx sst secret set SinNotificationsReplyToEmail "support@quadballcanada.com" --stage sin-prod

# Deploy
AWS_PROFILE=techprod npx sst deploy --stage sin-prod
```

---

## Verification Commands

### Check Identity Status

```bash
# List all verified identities
AWS_PROFILE=techprod aws sesv2 list-email-identities --region ca-central-1

# Get details for specific identity
AWS_PROFILE=techprod aws sesv2 get-email-identity \
  --email-identity quadballcanada.com \
  --region ca-central-1
```

### Test Send Email

```bash
# Send test email (requires verified recipient in sandbox mode)
AWS_PROFILE=techprod aws ses send-email \
  --from notifications@quadballcanada.com \
  --to your-test@email.com \
  --subject "SES Test Email" \
  --text "This is a test email from Solstice via Amazon SES." \
  --region ca-central-1
```

### Check DNS Records

```bash
# Check SPF
dig TXT quadballcanada.com +short

# Check DMARC
dig TXT _dmarc.quadballcanada.com +short

# Check DKIM (replace token with actual)
dig CNAME abc123._domainkey.quadballcanada.com +short
```

---

## Troubleshooting

### "Email address is not verified"

- In sandbox mode, both sender AND recipient must be verified
- Request production access to send to any recipient

### DKIM Status "PENDING"

- DNS propagation can take up to 72 hours
- Verify CNAME records are correctly configured
- Check for typos in record names/values

### Emails Going to Spam

1. Ensure DKIM is verified (Status: SUCCESS)
2. Add SPF record with `include:amazonses.com`
3. Add DMARC record
4. Use consistent FROM address
5. Avoid spam trigger words in subject/body

### Bounce/Complaint Handling

SES tracks bounces and complaints. High rates can suspend sending:

```bash
# Check account reputation
AWS_PROFILE=techprod aws sesv2 get-account \
  --region ca-central-1 \
  --query 'SendingEnabled'
```

---

## Related Documentation

- [AWS SES Developer Guide](https://docs.aws.amazon.com/ses/latest/dg/Welcome.html)
- [ADR D0.14: Email Provider Policy](decisions/ADR-2025-12-26-d0-14-email-provider-policy.md)
- [SIN Implementation Technical Debt](SIN-IMPLEMENTATION-TECHNICAL-DEBT.md)
