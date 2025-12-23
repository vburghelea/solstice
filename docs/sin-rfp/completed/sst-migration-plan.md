# SST Migration Plan - COMPLETE ✅

> **Status**: Migration complete as of December 2024. SST is now the production deployment platform.

## Production Deployment

- **URL**: https://d200ljtib0dq8n.cloudfront.net
- **Region**: `ca-central-1` (Canada) for PIPEDA compliance
- **AWS Account**: 596976295870 (production)
- **AWS Profile**: `techprod`

## Deployment Commands

```bash
# Login to AWS SSO
aws sso login --profile techprod

# Deploy to production
AWS_PROFILE=techprod npx sst deploy --stage production

# Set secrets
AWS_PROFILE=techprod npx sst secret set <SecretName> "<value>" --stage production

# List secrets
AWS_PROFILE=techprod npx sst secret list --stage production
```

## SST Secrets Configuration

Required secrets for production:

| Secret                      | Description                             |
| --------------------------- | --------------------------------------- |
| `DatabaseUrl`               | PostgreSQL connection string (Neon)     |
| `BetterAuthSecret`          | Auth session secret                     |
| `GoogleClientId`            | Google OAuth client ID                  |
| `GoogleClientSecret`        | Google OAuth client secret              |
| `BaseUrl`                   | Production URL (CloudFront)             |
| `SquareEnv`                 | Square environment (sandbox/production) |
| `SquareApplicationId`       | Square app ID                           |
| `SquareAccessToken`         | Square access token                     |
| `SquareLocationId`          | Square location ID                      |
| `SquareWebhookSignatureKey` | Square webhook signature                |
| `SendgridApiKey`            | SendGrid API key                        |
| `SendgridFromEmail`         | From email address                      |

## AWS Resources Created

SST deploys the following resources:

- **Lambda Function**: TanStack Start app with streaming response
- **CloudFront Distribution**: CDN with edge caching
- **S3 Bucket**: Static assets
- **Secrets Manager**: Application secrets
- **CloudWatch Logs**: Lambda execution logs
- **IAM Roles**: Lambda execution role with minimal permissions

## Known Issues and Workarounds

### Pulumi Error Formatting Bug

When deployment errors occur, Node.js may show `RangeError: Invalid string length` instead of the actual error. This is caused by `util.inspect` failing on large AWS SDK error objects.

**Workaround**: The Pulumi error handler at `.sst/platform/node_modules/@pulumi/pulumi/cmd/run/error.js` has been patched to return error stacks directly instead of using `util.inspect`. This patch may need to be reapplied after SST updates.

### Lambda Function URL Permissions

SST uses a `$transform` to ensure Lambda Function URL permissions are correctly configured:

```ts
// sst.config.ts
$transform(aws.lambda.FunctionUrl, (args, _opts, name) => {
  new awsnative.lambda.Permission(`${name}InvokePermission`, {
    action: "lambda:InvokeFunction",
    functionName: args.functionName,
    principal: "*",
    invokedViaFunctionUrl: true,
  });
});
```

## Migration History

### Phase 0: Pre-migration ✅

- Region: `ca-central-1` selected for PIPEDA compliance
- Database: Neon PostgreSQL (to migrate to RDS in future)
- Domain: Using CloudFront distribution URL

### Phase 1: Infrastructure ✅

- Created `sst.config.ts` with TanStack Start component
- Updated `vite.config.ts` with Nitro for `aws-lambda` preset
- Added `aws-native` provider for Lambda permissions workaround

### Phase 2: Environment Parity ✅

- Environment variables configured via SST secrets
- Database connections work correctly with Lambda
- Security headers moved to app-level middleware

### Phase 3: Staged Deployment ✅

- Deployed to production stage
- Auth flows verified (login, signup, email verification)
- Database connectivity confirmed

### Phase 4: Production Cutover ✅

- SST is now the production platform
- Netlify configuration removed
- AWS Organization with IAM Identity Center in `ca-central-1`

## Future Work

1. **RDS Migration**: Move from Neon to AWS RDS PostgreSQL in `ca-central-1` for full data residency
2. **Custom Domain**: Configure custom domain with Route 53 and ACM certificate
3. **SES Migration**: Replace SendGrid with AWS SES for email
4. **CI/CD Pipeline**: Set up GitHub Actions for automated deployments

## References

- [SST TanStack Start Documentation](https://sst.dev/docs/start)
- [SST Secrets Documentation](https://sst.dev/docs/reference/cli#secret)
- [AWS ca-central-1 Region](https://docs.aws.amazon.com/general/latest/gr/rande.html#regional-endpoints)
