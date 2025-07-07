# GitHub Actions Secrets Configuration

This document outlines the required secrets for GitHub Actions workflows.

## Required Secrets

### Core Application Secrets

| Secret Name          | Description                               | Example                                  |
| -------------------- | ----------------------------------------- | ---------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string              | `postgresql://user:pass@host:5432/db`    |
| `VITE_BASE_URL`      | Application base URL                      | `https://solstice.example.com`           |
| `BETTER_AUTH_SECRET` | Authentication secret key for Better Auth | Generate with `pnpm auth:secret` locally |

### Netlify Deployment Secrets

| Secret Name          | Description                       | How to Obtain                                                                                                                                                           |
| -------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NETLIFY_AUTH_TOKEN` | Personal access token for Netlify | 1. Go to [User Settings > Applications](https://app.netlify.com/user/applications)<br>2. Click "New access token"<br>3. Give it a descriptive name<br>4. Copy the token |
| `NETLIFY_SITE_ID`    | Your Netlify site ID              | 1. Go to your site dashboard on Netlify<br>2. Go to "Site configuration"<br>3. Copy the "Site ID"                                                                       |

### OAuth Provider Secrets

| Secret Name            | Description                    | How to Obtain                                                                                                                                                                 |
| ---------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_CLIENT_ID`     | GitHub OAuth App client ID     | 1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)<br>2. Click "New OAuth App" or select existing<br>3. Copy the Client ID  |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | From the same OAuth App page, generate/copy the Client Secret                                                                                                                 |
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
VITE_BASE_URL=http://localhost:3000
GITHUB_CLIENT_ID=your_dev_client_id
GITHUB_CLIENT_SECRET=your_dev_client_secret
GOOGLE_CLIENT_ID=your_dev_client_id
GOOGLE_CLIENT_SECRET=your_dev_client_secret
```
