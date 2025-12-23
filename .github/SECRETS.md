# GitHub Actions Secrets Configuration

This document outlines the required secrets for GitHub Actions workflows.

## Required Secrets

### Core Application Secrets

| Secret Name          | Description                               | Example                                  |
| -------------------- | ----------------------------------------- | ---------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string              | `postgresql://user:pass@host:5432/db`    |
| `BETTER_AUTH_SECRET` | Authentication secret key for Better Auth | Generate with `pnpm auth:secret` locally |

### OAuth Provider Secrets

| Secret Name            | Description                    | How to Obtain                                                                                                                                                                 |
| ---------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth 2.0 client ID     | 1. Go to [Google Cloud Console](https://console.cloud.google.com/)<br>2. Create/select project<br>3. Go to "APIs & Services" > "Credentials"<br>4. Create OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | From the same OAuth 2.0 credentials page                                                                                                                                      |

### Optional Secrets

| Secret Name     | Description          | Required For                                       |
| --------------- | -------------------- | -------------------------------------------------- |
| `CODECOV_TOKEN` | Codecov upload token | Code coverage reporting (optional but recommended) |

## Setting Up Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with its corresponding value

## Production Secrets (SST/AWS)

Production secrets are managed via SST and stored in AWS Secrets Manager. They are NOT configured in GitHub Actions.

Set SST secrets using:

```bash
AWS_PROFILE=techprod npx sst secret set <SecretName> "<value>" --stage production
```

See [SST Migration Plan](../docs/sin-rfp/sst-migration-plan.md) for the full list of required production secrets.

## Security Best Practices

- Never commit secrets to the repository
- Rotate secrets regularly
- Use least-privilege access for all tokens
- Review and audit secret usage periodically
- Remove unused secrets promptly

## Local Development

For local development, create a `.env` file in the project root with the same variables. The `.env` file is gitignored and should never be committed.

Example `.env` file:

```env
DATABASE_URL=postgresql://localhost:5432/solstice_dev
VITE_BASE_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_dev_client_id
GOOGLE_CLIENT_SECRET=your_dev_client_secret
BETTER_AUTH_SECRET=your_dev_secret
```
