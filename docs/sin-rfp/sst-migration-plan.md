# SST Migration Plan (Netlify -> SST on AWS)

This plan focuses on a controlled migration with staged deployments from a dedicated branch until parity and stability are proven. It references SST TanStack Start guidance and components from the local SST repo.

## References (SST)

- TanStack Start on AWS guide: `/Users/austin/dev/sst/www/src/content/docs/docs/start/aws/tanstack.mdx`
- TanStack Start component implementation: `/Users/austin/dev/sst/platform/src/components/aws/tan-stack-start.ts`
- Example SST config (TanStack Start): `/Users/austin/dev/sst/examples/aws-tanstack-start/sst.config.ts`
- TanStack Start template config: `/Users/austin/dev/sst/platform/templates/tanstack-start/files/sst.config.ts`

## Goals

- Maintain current Netlify production while validating AWS parity.
- Deploy SST from a migration branch and stage environment until feature parity is reached.
- Preserve compliance requirements (data residency, audit logging, backups, retention) while improving long-term scalability.

## Phase 0: Pre-migration Decisions (1-2 days)

**Outcomes**

- Choose AWS region (recommend `ca-central-1`).
- Confirm database hosting and residency (Neon/managed Postgres in CA).
- Define RTO/RPO targets and log retention windows.
- Decide on domain strategy for SST staging (for example `sst-staging.<domain>`).

## Phase 1: Infrastructure Skeleton (2-3 days)

**Branch strategy**

- Create a long-lived branch, for example `sst-migration`.
- Netlify remains bound to `main` for production. SST is deployed from the branch only.

**SST app configuration**

- Add `sst.config.ts` to the repo root based on:
  - `/Users/austin/dev/sst/examples/aws-tanstack-start/sst.config.ts`
  - `/Users/austin/dev/sst/platform/templates/tanstack-start/files/sst.config.ts`
- Use `new sst.aws.TanStackStart("Web", { ... })` with:
  - `buildCommand: "pnpm build"`
  - `dev: { command: "pnpm dev" }` (optional but recommended)
  - `environment` values for non-secret runtime configuration
  - `link` to AWS resources as needed (see `tan-stack-start.ts` for link notes)

**Vite config for Nitro**

- Replace the Netlify plugin with Nitro per:
  - `/Users/austin/dev/sst/www/src/content/docs/docs/start/aws/tanstack.mdx`
- Add `nitro()` plugin and set:
  - `nitro: { preset: "aws-lambda", awsLambda: { streaming: true } }`

**Expected output**

- Ensure `pnpm build` produces `.output/` with `nitro.json`. The SST TanStack Start component reads this (`tan-stack-start.ts`).

**Known SST issue: Lambda Function URL invoke permissions**

- Recent AWS changes require both `lambda:InvokeFunctionUrl` and `lambda:InvokeFunction` on Function URLs. New SST deployments can return:
  - `Forbidden. For troubleshooting Function URL authorization issues...`
- See SST issue discussion: `https://github.com/sst/sst/issues/6198#issuecomment-3455222837`
- Workaround (from SST maintainers) is to add a global transform before defining the site:

```ts
// sst.config.ts (place before TanStackStart/Nextjs definitions)
// Requires: `sst add aws-native`
$transform(aws.lambda.FunctionUrl, (args, _opts, name) => {
  new awsnative.lambda.Permission(`${name}InvokePermission`, {
    action: "lambda:InvokeFunction",
    functionName: args.functionName,
    principal: "*",
    invokedViaFunctionUrl: true,
  });
});
```

## Phase 2: Environment and Runtime Parity (3-5 days)

**Environment variables**

- Update `src/lib/env.server.ts` to include AWS runtime signals and remove Netlify-only assumptions.
  - Extend `isServerless()` to detect AWS Lambda (for example `AWS_LAMBDA_FUNCTION_NAME` or `AWS_EXECUTION_ENV`).
- Ensure `getBaseUrl()` has a staging base URL path for SST.

**Database connections**

- Confirm pooled/unpooled behavior is correct for Lambda. If not, switch to pooled for `isServerless()` on AWS.

**Headers and CSP**

- Netlify edge function currently injects CSP nonce and security headers.
- CloudFront Functions cannot mutate HTML; plan to move nonce injection into server rendering.
- Add Start middleware or response hooks for CSP in the app layer.

**Assets and caching**

- Replicate `netlify.toml` no-store rules for sensitive routes using app-level headers or response middleware.
- Validate PWA caching rules do not serve stale authenticated content.

## Phase 3: Staged Deployment (1-2 weeks)

**Stage deployment**

- Deploy SST from `sst-migration` using:
  - `sst deploy --stage sst-staging`
- Use a staging subdomain and keep Netlify production unchanged.

**Parity checklist**

- Auth flows (login, OAuth, password reset).
- Server functions and API routes.
- Payment callbacks and webhooks.
- Email delivery (SendGrid) and scheduled tasks.
- CSP + headers (no inline script violations).
- Performance under typical workloads.

**Observability**

- Add CloudWatch alarms for error rates and latency.
- Capture audit logs and verify hash chain integrity.

## Phase 4: Gradual Cutover (1-2 weeks)

**Soft launch**

- Move a small set of users to SST staging.
- Monitor error budgets and fix regressions.

**Production cutover**

- Swap DNS to the SST CloudFront distribution.
- Keep Netlify deployment available for rollback for 1-2 weeks.

## Risks and Mitigations

- **CSP nonce injection**: implement server-side nonce generation and script tag injection to avoid CloudFront limitations.
- **Base URL differences**: explicit staging and production base URLs.
- **Long-running workloads**: use Step Functions or Batch for large imports.
- **Cold starts**: adjust Lambda memory and enable warming if needed.

## Deliverables

- `sst.config.ts` with TanStack Start component.
- Updated `vite.config.ts` with Nitro for AWS Lambda.
- Updated server env detection and base URL logic.
- Staging deployment workflow and parity checklist.
- Production cutover plan with rollback steps.
