/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./.sst/platform/config.d.ts" />

type StageEnvClass = "dev" | "perf" | "uat" | "prod";
type StageTenantKey = "qc" | "viasport";

type StageInfo = {
  stage: string;
  stageEnv: StageEnvClass;
  stageTenant?: StageTenantKey;
  isCanonical: boolean;
};

const CANONICAL_STAGE_PATTERN = /^(qc|sin)-(dev|perf|uat|prod)$/;
const CANONICAL_STAGE_LIST = [
  "qc-dev",
  "sin-dev",
  "qc-perf",
  "sin-perf",
  "qc-uat",
  "sin-uat",
  "qc-prod",
  "sin-prod",
] as const;

const parseTenantKey = (value: string | undefined, label: string) => {
  if (!value) return undefined;
  if (value === "qc" || value === "viasport") return value;
  throw new Error(`Invalid ${label}: expected "qc" | "viasport", got "${value}"`);
};

const resolveStageInfo = (rawStage: string | undefined): StageInfo => {
  const stage = rawStage ?? "dev";

  const canonicalMatch = CANONICAL_STAGE_PATTERN.exec(stage);
  if (canonicalMatch) {
    const prefix = canonicalMatch[1] as "qc" | "sin";
    const stageEnv = canonicalMatch[2] as StageEnvClass;
    const stageTenant: StageTenantKey = prefix === "qc" ? "qc" : "viasport";
    return { stage, stageEnv, stageTenant, isCanonical: true };
  }

  if (stage.startsWith("qc-") || stage.startsWith("sin-")) {
    throw new Error(
      `Invalid canonical stage "${stage}". Expected one of: ${CANONICAL_STAGE_LIST.join(
        ", ",
      )}`,
    );
  }

  const lower = stage.toLowerCase();
  const stageEnv: StageEnvClass =
    lower === "production" || lower === "prod" || lower.endsWith("-prod")
      ? "prod"
      : lower === "perf" || lower.endsWith("-perf")
        ? "perf"
        : "dev";

  return { stage, stageEnv, isCanonical: false };
};

const resolveTenantEnv = (info: StageInfo) => {
  const envTenantKey = parseTenantKey(process.env["TENANT_KEY"], "TENANT_KEY");
  const envViteTenantKey = parseTenantKey(
    process.env["VITE_TENANT_KEY"],
    "VITE_TENANT_KEY",
  );

  if (envTenantKey && envViteTenantKey && envTenantKey !== envViteTenantKey) {
    throw new Error(
      `Tenant key mismatch: TENANT_KEY=${envTenantKey} VITE_TENANT_KEY=${envViteTenantKey}`,
    );
  }

  if (info.isCanonical) {
    const expected = info.stageTenant!;
    if (envTenantKey && envTenantKey !== expected) {
      throw new Error(
        `Stage "${info.stage}" maps to tenant "${expected}" but TENANT_KEY="${envTenantKey}" was provided.`,
      );
    }
    if (envViteTenantKey && envViteTenantKey !== expected) {
      throw new Error(
        `Stage "${info.stage}" maps to tenant "${expected}" but VITE_TENANT_KEY="${envViteTenantKey}" was provided.`,
      );
    }
    return { tenantKey: expected, viteTenantKey: expected };
  }

  const lowerStage = info.stage.toLowerCase();
  const heuristicTenant: StageTenantKey =
    lowerStage.includes("sin") || lowerStage.includes("viasport") ? "viasport" : "qc";
  const tenantKey = envTenantKey ?? heuristicTenant;
  const viteTenantKey = envViteTenantKey ?? tenantKey;
  return { tenantKey, viteTenantKey };
};

/**
 * SST Configuration for Solstice (Quadball Canada)
 *
 * Deploys TanStack Start app to AWS Lambda with CloudFront CDN.
 * Core data-plane resources deploy to ca-central-1 for PIPEDA/Canadian
 * data residency. Global edge services (CloudFront/WAF) use us-east-1.
 *
 * Known issue workaround: Lambda Function URL permissions require $transform.
 * See: https://github.com/sst/sst/issues/6198
 */

export default $config({
  app(input) {
    const stageInfo = resolveStageInfo(input?.stage);
    const isProd = stageInfo.stageEnv === "prod";

    return {
      name: "solstice",
      removal: isProd ? "retain" : "remove",
      protect: isProd,
      home: "aws",
      providers: {
        aws: {
          region: "ca-central-1",
        },
        "aws-native": {
          region: "ca-central-1",
        },
      },
    };
  },
  async run() {
    const stageInfo = resolveStageInfo($app.stage ?? "dev");
    const stage = stageInfo.stage;
    const isProd = stageInfo.stageEnv === "prod";
    const isPerf = stageInfo.stageEnv === "perf";
    const isUat = stage.toLowerCase().includes("uat");

    // GUARD: Prevent `sst dev` on non-local stages to avoid state corruption
    // See: docs/issues/SIN-UAT-INTERMITTENT-OUTAGES.md
    // When `sst dev` runs, it creates placeholder resources that corrupt the state
    // and prevent proper CloudFront/CDN creation on subsequent deploys.
    const protectedStages = [
      "sin-dev",
      "sin-uat",
      "sin-prod",
      "qc-prod",
      "sin-perf",
      "qc-perf",
    ];
    if ($dev && protectedStages.includes(stage.toLowerCase())) {
      throw new Error(
        `BLOCKED: Cannot run 'sst dev' on protected stage "${stage}".\n` +
          `This would corrupt the deployment state and cause intermittent outages.\n` +
          `Use 'sst deploy --stage ${stage}' for deployments.\n` +
          `For local development, use 'sst dev --stage sin-austin' or 'sst dev --stage qc-austin'.`,
      );
    }

    // Custom domain mapping for solsticeapp.ca subdomains
    // Route53 hosted zones (one per AWS account):
    //   techdev: Z08572962E2ART44DDU47
    //   techprod: Z05949293SV56QAGUR6E2
    // For cross-account to work, GoDaddy must point to the correct account's nameservers
    const solsticeAppZoneId = isProd
      ? "Z05949293SV56QAGUR6E2" // techprod
      : "Z08572962E2ART44DDU47"; // techdev
    const domainMap: Record<string, string> = {
      "sin-dev": "sindev.solsticeapp.ca",
      "sin-uat": "sinuat.solsticeapp.ca",
      "sin-prod": "sin.solsticeapp.ca",
      "qc-dev": "qcdev.solsticeapp.ca",
      "qc-prod": "qc.solsticeapp.ca",
    };
    const customDomainName = domainMap[stage.toLowerCase()];
    const customDomain = customDomainName
      ? {
          name: customDomainName,
          dns: sst.aws.dns({ zone: solsticeAppZoneId }),
        }
      : undefined;

    const cloudfrontProvider = new aws.Provider("CloudFrontProvider", {
      region: "us-east-1",
    });

    const dbVersion = "16.11";
    const dbConfig = isProd
      ? {
          instance: "t4g.large",
          storage: "200 GB",
          multiAz: true,
          backupRetentionDays: 35,
          deletionProtection: true,
          forceSsl: true,
        }
      : isPerf
        ? {
            instance: "t4g.large",
            storage: "200 GB",
            multiAz: false,
            backupRetentionDays: 7,
            deletionProtection: false,
            forceSsl: true,
          }
        : {
            instance: "t4g.micro",
            storage: "50 GB",
            multiAz: false,
            backupRetentionDays: 7,
            deletionProtection: false,
            forceSsl: true,
          };

    // Workaround for Lambda Function URL invoke permissions
    // See: https://github.com/sst/sst/issues/6198
    // Documented fix from sst-migration-plan.md
    $transform(aws.lambda.FunctionUrl, (args, _opts, name) => {
      new awsnative.lambda.Permission(`${name}InvokePermission`, {
        action: "lambda:InvokeFunction",
        functionName: args.functionName,
        principal: "*",
        invokedViaFunctionUrl: true,
      });
    });

    const vpc = new sst.aws.Vpc("Vpc", {
      bastion: true,
      nat: "ec2",
    });

    const database = new sst.aws.Postgres("Database", {
      vpc,
      version: dbVersion,
      instance: dbConfig.instance,
      storage: dbConfig.storage,
      multiAz: dbConfig.multiAz,
      proxy: true,
      transform: {
        parameterGroup: (args) => ({
          ...args,
          parameters: [
            {
              name: "rds.force_ssl",
              value: dbConfig.forceSsl ? "1" : "0",
            },
            {
              name: "rds.logical_replication",
              value: "1",
              applyMethod: "pending-reboot",
            },
          ],
        }),
        instance: (args) => ({
          ...args,
          backupRetentionPeriod: dbConfig.backupRetentionDays,
          deletionProtection: dbConfig.deletionProtection,
        }),
      },
    });

    const redisConfig = isProd
      ? {
          instance: "t4g.small",
          numCacheClusters: 2,
          multiAzEnabled: true,
        }
      : isPerf
        ? {
            instance: "t4g.small",
            numCacheClusters: 2,
            multiAzEnabled: false,
          }
        : {
            instance: "t4g.micro",
            numCacheClusters: 1,
            multiAzEnabled: false,
          };

    const redis = new sst.aws.Redis("Redis", {
      vpc,
      cluster: false,
      instance: redisConfig.instance,
      transform: {
        cluster: (args) => ({
          ...args,
          numCacheClusters: redisConfig.numCacheClusters,
          automaticFailoverEnabled: redisConfig.multiAzEnabled,
          multiAzEnabled: redisConfig.multiAzEnabled,
        }),
      },
    });

    // DSAR exports bucket with Object Lock for compliance retention
    // Object Lock provides WORM (Write Once Read Many) protection for DSAR exports
    // per ADR D0.13 (14-day DSAR retention).
    //
    // NOTE: Object Lock must be enabled at bucket creation time.
    const sinArtifacts = new sst.aws.Bucket("SinArtifacts", {
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: ["GET", "PUT", "HEAD"],
          allowedOrigins: [
            "http://localhost:5173",
            "http://localhost:3001",
            "http://localhost:8888",
            "http://localhost:5174",
          ],
          maxAge: "1 day",
        },
      ],
      versioning: true, // Required for Object Lock
      transform: {
        bucket: {
          objectLockEnabled: true,
        },
      },
    });

    // Lifecycle rules for SIN artifacts: archive to Glacier after 90 days,
    // delete non-current versions after 180 days
    new aws.s3.BucketLifecycleConfigurationV2("SinArtifactsLifecycle", {
      bucket: sinArtifacts.name,
      rules: [
        {
          id: "ArchiveToGlacier",
          status: "Enabled",
          transitions: [
            {
              days: 90,
              storageClass: "GLACIER",
            },
          ],
        },
        {
          id: "DeleteOldVersions",
          status: "Enabled",
          noncurrentVersionExpiration: {
            noncurrentDays: 180,
          },
        },
      ],
    });

    const auditArchiveRetention = isProd || isPerf ? { years: 7 } : { days: 1 };

    // Dedicated audit archive bucket with Object Lock (SEC-AGG-003, 7-year retention).
    const sinAuditArchives = new sst.aws.Bucket("SinAuditArchives", {
      versioning: true,
      transform: {
        bucket: {
          objectLockEnabled: true,
        },
      },
    });

    new aws.s3.BucketObjectLockConfigurationV2("SinAuditArchivesLock", {
      bucket: sinAuditArchives.name,
      rule: {
        defaultRetention: {
          mode: "GOVERNANCE",
          ...auditArchiveRetention,
        },
      },
    });

    const notificationsDlq = new sst.aws.Queue("SinNotificationsDlq");
    const notificationsQueue = new sst.aws.Queue("SinNotificationsQueue", {
      visibilityTimeout: "2 minutes",
      dlq: {
        queue: notificationsDlq.arn,
        retry: 3,
      },
    });

    // Define secrets - set via: npx sst secret set <NAME> <value> --stage <stage>
    // Note: BaseUrl should be updated after deploy if CloudFront URL changes.
    // For production, use a custom domain for stable URL.
    const mfaSecrets =
      stageInfo.stageEnv === "dev" || stageInfo.stageEnv === "uat"
        ? {
            sinUiTotpSecret: new sst.Secret("SIN_UI_TOTP_SECRET"),
          }
        : null;

    const devOnlySecrets =
      stageInfo.stageEnv === "dev"
        ? {
            databaseUrl: new sst.Secret("DATABASE_URL"),
            databaseUrlUnpooled: new sst.Secret("DATABASE_URL_UNPOOLED"),
            e2eDatabaseUrl: new sst.Secret("E2E_DATABASE_URL"),
            sinAnalyticsTotpSecret: new sst.Secret("SIN_ANALYTICS_TOTP_SECRET"),
            sinA11yTotpSecret: new sst.Secret("SIN_A11Y_TOTP_SECRET"),
            e2eTestAdminTotpSecret: new sst.Secret("E2E_TEST_ADMIN_TOTP_SECRET"),
            squareProductionAccessToken: new sst.Secret("SQUARE_PRODUCTION_ACCESS_TOKEN"),
          }
        : null;

    const secrets = {
      baseUrl: new sst.Secret("BaseUrl"),
      betterAuthSecret: new sst.Secret("BetterAuthSecret"),
      googleClientId: new sst.Secret("GoogleClientId"),
      googleClientSecret: new sst.Secret("GoogleClientSecret"),
      squareEnv: new sst.Secret("SquareEnv"),
      squareApplicationId: new sst.Secret("SquareApplicationId"),
      squareAccessToken: new sst.Secret("SquareAccessToken"),
      squareLocationId: new sst.Secret("SquareLocationId"),
      squareWebhookSignatureKey: new sst.Secret("SquareWebhookSignatureKey"),
      sinNotificationsFromEmail: new sst.Secret("SinNotificationsFromEmail"),
      sinNotificationsReplyToEmail: new sst.Secret("SinNotificationsReplyToEmail"),
      ...mfaSecrets,
      ...devOnlySecrets,
    };

    const runtimeEnv = {
      SST_STAGE: stage,
      NODE_ENV: isProd || isPerf || isUat ? "production" : "development",
    };

    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.squareup.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://connect.squareup.com https://pci-connect.squareup.com",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    const securityHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy(
      "SecurityHeaders",
      {
        name: `solstice-${stage}-security-headers`,
        securityHeadersConfig: {
          strictTransportSecurity: {
            accessControlMaxAgeSec: 31536000,
            includeSubdomains: true,
            override: true,
            preload: isProd,
          },
          contentSecurityPolicy: {
            contentSecurityPolicy,
            override: true,
          },
          contentTypeOptions: {
            override: true,
          },
          frameOptions: {
            frameOption: "DENY",
            override: true,
          },
          referrerPolicy: {
            referrerPolicy: "strict-origin-when-cross-origin",
            override: true,
          },
          xssProtection: {
            protection: true,
            modeBlock: true,
            override: true,
          },
        },
        customHeadersConfig: {
          items: [
            {
              header: "Cross-Origin-Opener-Policy",
              value: "same-origin",
              override: true,
            },
            {
              header: "Cross-Origin-Resource-Policy",
              value: "same-origin",
              override: true,
            },
            {
              header: "Permissions-Policy",
              value:
                "accelerometer=(), camera=(), geolocation=(), gyroscope=(), " +
                "magnetometer=(), microphone=(), payment=(), usb=()",
              override: true,
            },
          ],
        },
      },
    );

    const wafName = `solstice-${stage}-waf`;
    const wafManagedRuleOverrideAction = isProd ? { none: {} } : { count: {} };
    const wafRateLimitAction = isProd ? { block: {} } : { count: {} };

    const wafRateLimitRule = {
      name: "RateLimitRule",
      priority: 1,
      action: wafRateLimitAction,
      statement: {
        rateBasedStatement: {
          limit: 1000,
          aggregateKeyType: "IP",
        },
      },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        sampledRequestsEnabled: true,
        metricName: "RateLimitRule",
      },
    };

    const wafManagedRulesCommon = {
      name: "AWS-AWSManagedRulesCommonRuleSet",
      priority: 2,
      overrideAction: wafManagedRuleOverrideAction,
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
        },
      },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: "AWSManagedRulesCommonRuleSet",
        sampledRequestsEnabled: true,
      },
    };

    const wafManagedRulesKnownBad = {
      name: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
      priority: 3,
      overrideAction: wafManagedRuleOverrideAction,
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesKnownBadInputsRuleSet",
        },
      },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: "AWSManagedRulesKnownBadInputsRuleSet",
        sampledRequestsEnabled: true,
      },
    };

    const wafManagedRulesSqli = {
      name: "AWS-AWSManagedRulesSQLiRuleSet",
      priority: 4,
      overrideAction: wafManagedRuleOverrideAction,
      statement: {
        managedRuleGroupStatement: {
          vendorName: "AWS",
          name: "AWSManagedRulesSQLiRuleSet",
        },
      },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: "AWSManagedRulesSQLiRuleSet",
        sampledRequestsEnabled: true,
      },
    };

    const wafAcl = new aws.wafv2.WebAcl(
      "WafAcl",
      {
        name: wafName,
        scope: "CLOUDFRONT",
        defaultAction: { allow: {} },
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: wafName,
          sampledRequestsEnabled: true,
        },
        rules: [
          wafRateLimitRule,
          wafManagedRulesCommon,
          wafManagedRulesKnownBad,
          wafManagedRulesSqli,
        ],
        tags: {
          Environment: stage,
          Application: "solstice",
        },
      },
      { provider: cloudfrontProvider },
    );

    const devBaseUrl = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
    // Use custom domain if configured, otherwise fall back to BaseUrl secret
    const baseUrl = $dev
      ? devBaseUrl
      : customDomainName
        ? `https://${customDomainName}`
        : secrets.baseUrl.value;

    const { tenantKey, viteTenantKey } = resolveTenantEnv(stageInfo);

    const redisEnabled = true;
    const redisRequired = isProd || isPerf;
    const redisPrefix = `sin:${stage}`;

    const notificationEnv = {
      SIN_NOTIFICATIONS_QUEUE_URL: notificationsQueue.url,
      SIN_NOTIFICATIONS_FROM_EMAIL: secrets.sinNotificationsFromEmail.value,
      SIN_NOTIFICATIONS_REPLY_TO_EMAIL: secrets.sinNotificationsReplyToEmail.value,
    };

    const importCluster = new sst.aws.Cluster("SinImportCluster", {
      vpc: {
        id: vpc.id,
        securityGroups: vpc.securityGroups,
        containerSubnets: vpc.privateSubnets,
        loadBalancerSubnets: vpc.publicSubnets,
        cloudmapNamespaceId: vpc.nodes.cloudmapNamespace.id,
        cloudmapNamespaceName: vpc.nodes.cloudmapNamespace.name,
      },
    });

    const importBatchTask = new sst.aws.Task("SinImportBatchTask", {
      cluster: importCluster,
      cpu: "2 vCPU",
      memory: "4 GB",
      storage: "50 GB",
      publicIp: false,
      image: {
        context: ".",
        dockerfile: "docker/import-batch.Dockerfile",
      },
      command: ["pnpm", "exec", "tsx", "src/workers/import-batch.ts"],
      dev: {
        command: "pnpm exec tsx src/workers/import-batch.ts",
      },
      link: [database, sinArtifacts],
      environment: {
        ...runtimeEnv,
        TENANT_KEY: tenantKey,
        VITE_TENANT_KEY: viteTenantKey,
        SIN_ARTIFACTS_BUCKET: sinArtifacts.name,
      },
    });

    // Deploy TanStack Start app
    const buildCommand =
      isProd || isPerf || isUat ? "NODE_ENV=production pnpm build" : "pnpm build";

    const web = new sst.aws.TanStackStart("Web", {
      buildCommand,
      domain: customDomain,
      dev: {
        command: "pnpm dev",
        url: devBaseUrl,
      },
      link: [
        database,
        redis,
        sinArtifacts,
        sinAuditArchives,
        notificationsQueue,
        importBatchTask,
        ...Object.values(secrets),
      ],
      vpc,
      environment: {
        // Runtime environment detection
        ...runtimeEnv,
        TENANT_KEY: tenantKey,
        VITE_TENANT_KEY: viteTenantKey,
        // Base URL for auth callbacks
        BASE_URL: baseUrl,
        VITE_BASE_URL: baseUrl,
        SIN_ARTIFACTS_BUCKET: sinArtifacts.name,
        SIN_AUDIT_ARCHIVE_BUCKET: sinAuditArchives.name,
        REDIS_HOST: redis.host,
        REDIS_PORT: $interpolate`${redis.port}`,
        REDIS_AUTH_TOKEN: redis.password,
        REDIS_TLS: "true",
        REDIS_PREFIX: redisPrefix,
        REDIS_ENABLED: String(redisEnabled),
        REDIS_REQUIRED: String(redisRequired),
        ...notificationEnv,
        // Map SST secrets to expected env var names
        BETTER_AUTH_SECRET: secrets.betterAuthSecret.value,
        GOOGLE_CLIENT_ID: secrets.googleClientId.value,
        GOOGLE_CLIENT_SECRET: secrets.googleClientSecret.value,
        SQUARE_ENV: secrets.squareEnv.value,
        SQUARE_APPLICATION_ID: secrets.squareApplicationId.value,
        SQUARE_ACCESS_TOKEN: secrets.squareAccessToken.value,
        SQUARE_LOCATION_ID: secrets.squareLocationId.value,
        SQUARE_WEBHOOK_SIGNATURE_KEY: secrets.squareWebhookSignatureKey.value,
        ...(mfaSecrets
          ? {
              SIN_UI_TOTP_SECRET: mfaSecrets.sinUiTotpSecret.value,
            }
          : {}),
        ...(devOnlySecrets
          ? {
              DATABASE_URL: devOnlySecrets.databaseUrl.value,
              DATABASE_URL_UNPOOLED: devOnlySecrets.databaseUrlUnpooled.value,
              E2E_DATABASE_URL: devOnlySecrets.e2eDatabaseUrl.value,
              SIN_ANALYTICS_TOTP_SECRET: devOnlySecrets.sinAnalyticsTotpSecret.value,
              SIN_A11Y_TOTP_SECRET: devOnlySecrets.sinA11yTotpSecret.value,
              E2E_TEST_ADMIN_TOTP_SECRET: devOnlySecrets.e2eTestAdminTotpSecret.value,
              SQUARE_PRODUCTION_ACCESS_TOKEN:
                devOnlySecrets.squareProductionAccessToken.value,
            }
          : {}),
      },
      transform: {
        cdn: (args) => {
          args.defaultCacheBehavior = {
            ...args.defaultCacheBehavior,
            responseHeadersPolicyId: securityHeadersPolicy.id,
          };
          args.webAclId = wafAcl.arn;
        },
      },
      // Performance tuning for perf/prod environments
      // See docs/tickets/PERF-001-performance-optimizations.md
      server: {
        // More CPU => faster cold starts and execution
        memory: "1024 MB",
        // Longer timeout for cold starts with VPC/RDS
        timeout: "20 seconds",
        // Bundle optimizations
        nodejs: {
          esbuild: {
            minify: true,
            treeShaking: true,
            external: ["@playwright/test", "vitest", "typescript"],
          },
        },
        // Provisioned concurrency for warm capacity in perf/prod
        // Reduces cold start errors under load
        transform: {
          function: (args) => {
            if (isProd || isPerf) {
              args.provisionedConcurrency = 2;
            }
          },
        },
      },
    });

    new sst.aws.Cron("ScheduledNotifications", {
      schedule: "rate(5 minutes)",
      job: {
        handler: "src/cron/process-notifications.handler",
        link: [database, sinArtifacts, notificationsQueue, ...Object.values(secrets)],
        environment: {
          ...runtimeEnv,
          TENANT_KEY: tenantKey,
          VITE_TENANT_KEY: viteTenantKey,
          SIN_ARTIFACTS_BUCKET: sinArtifacts.name,
          ...notificationEnv,
        },
      },
    });

    new sst.aws.Cron("RetentionEnforcement", {
      schedule: "rate(1 day)",
      job: {
        handler: "src/cron/enforce-retention.handler",
        link: [database, sinArtifacts, sinAuditArchives, ...Object.values(secrets)],
        environment: {
          ...runtimeEnv,
          TENANT_KEY: tenantKey,
          VITE_TENANT_KEY: viteTenantKey,
          SIN_ARTIFACTS_BUCKET: sinArtifacts.name,
          SIN_AUDIT_ARCHIVE_BUCKET: sinAuditArchives.name,
        },
      },
    });

    new sst.aws.Cron("DataQualityMonitor", {
      schedule: "rate(1 day)",
      job: {
        handler: "src/cron/data-quality-monitor.handler",
        link: [database, sinArtifacts, ...Object.values(secrets)],
        environment: {
          ...runtimeEnv,
          TENANT_KEY: tenantKey,
          VITE_TENANT_KEY: viteTenantKey,
          SIN_ARTIFACTS_BUCKET: sinArtifacts.name,
        },
      },
    });

    notificationsQueue.subscribe(
      {
        handler: "src/cron/notification-worker.handler",
        link: [database, sinArtifacts, ...Object.values(secrets)],
        timeout: "60 seconds",
        environment: {
          ...runtimeEnv,
          TENANT_KEY: tenantKey,
          VITE_TENANT_KEY: viteTenantKey,
          SIN_ARTIFACTS_BUCKET: sinArtifacts.name,
          ...notificationEnv,
        },
      },
      {
        batch: {
          size: 10,
          window: "10 seconds",
          partialResponses: true,
        },
      },
    );

    // =========================================================================
    // SNS Topic for Alarm Notifications
    // =========================================================================
    // Create early so CloudTrail and other alarms can reference it

    const alarmTopic =
      isProd || isPerf || isUat
        ? new aws.sns.Topic("AlarmNotifications", {
            name: `solstice-${stage}-alarms`,
            tags: {
              Environment: stage,
              Application: "solstice",
            },
          })
        : undefined;

    // =========================================================================
    // CloudTrail for Infrastructure Audit Logging (SEC-AGG-002, SEC-AGG-004)
    // =========================================================================
    // Only enable for prod/perf/uat to control costs. Dev uses AWS default event history.

    const cloudTrailLogGroup =
      isProd || isPerf || isUat
        ? new aws.cloudwatch.LogGroup("CloudTrailLogGroup", {
            name: `/aws/cloudtrail/solstice-${stage}`,
            retentionInDays: isProd ? 365 : 30,
            tags: {
              Environment: stage,
              Application: "solstice",
            },
          })
        : undefined;

    // S3 bucket for CloudTrail logs with compliance retention
    const cloudTrailBucket =
      isProd || isPerf || isUat
        ? new aws.s3.BucketV2("CloudTrailBucket", {
            bucket: `solstice-${stage}-cloudtrail-logs`,
            tags: {
              Environment: stage,
              Application: "solstice",
              Purpose: "cloudtrail-audit-logs",
            },
          })
        : undefined;

    // Block public access to CloudTrail bucket
    const _cloudTrailBucketPublicAccessBlock =
      cloudTrailBucket &&
      new aws.s3.BucketPublicAccessBlock("CloudTrailBucketPublicAccessBlock", {
        bucket: cloudTrailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      });

    // Server-side encryption for CloudTrail bucket
    const _cloudTrailBucketEncryption =
      cloudTrailBucket &&
      new aws.s3.BucketServerSideEncryptionConfigurationV2("CloudTrailBucketEncryption", {
        bucket: cloudTrailBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
          },
        ],
      });

    // Lifecycle policy: transition to Glacier after 90 days, expire after 7 years (prod) or 1 year (perf/uat)
    const _cloudTrailBucketLifecycle =
      cloudTrailBucket &&
      new aws.s3.BucketLifecycleConfigurationV2("CloudTrailBucketLifecycle", {
        bucket: cloudTrailBucket.id,
        rules: [
          {
            id: "ArchiveAndExpire",
            status: "Enabled",
            transitions: [
              {
                days: 90,
                storageClass: "GLACIER",
              },
            ],
            expiration: {
              days: isProd ? 2555 : 365, // 7 years for prod, 1 year for perf/uat
            },
          },
        ],
      });

    // Get AWS account ID for CloudTrail bucket policy
    const awsAccountId = aws.getCallerIdentityOutput().accountId;

    // CloudTrail bucket policy to allow CloudTrail to write logs
    // Must use correct path format: s3://bucket/AWSLogs/account-id/*
    const cloudTrailBucketPolicy =
      cloudTrailBucket &&
      new aws.s3.BucketPolicy("CloudTrailBucketPolicy", {
        bucket: cloudTrailBucket.id,
        policy: $util
          .all([cloudTrailBucket.arn, awsAccountId])
          .apply(([bucketArn, accountId]) =>
            JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Sid: "AWSCloudTrailAclCheck",
                  Effect: "Allow",
                  Principal: { Service: "cloudtrail.amazonaws.com" },
                  Action: "s3:GetBucketAcl",
                  Resource: bucketArn,
                  Condition: {
                    StringEquals: {
                      "aws:SourceArn": `arn:aws:cloudtrail:ca-central-1:${accountId}:trail/solstice-${stage}-audit-trail`,
                    },
                  },
                },
                {
                  Sid: "AWSCloudTrailWrite",
                  Effect: "Allow",
                  Principal: { Service: "cloudtrail.amazonaws.com" },
                  Action: "s3:PutObject",
                  Resource: `${bucketArn}/AWSLogs/${accountId}/*`,
                  Condition: {
                    StringEquals: {
                      "s3:x-amz-acl": "bucket-owner-full-control",
                      "aws:SourceArn": `arn:aws:cloudtrail:ca-central-1:${accountId}:trail/solstice-${stage}-audit-trail`,
                    },
                  },
                },
              ],
            }),
          ),
      });

    // IAM role for CloudTrail to write to CloudWatch Logs
    const cloudTrailRole =
      cloudTrailLogGroup &&
      new aws.iam.Role("CloudTrailRole", {
        name: `solstice-${stage}-cloudtrail-role`,
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { Service: "cloudtrail.amazonaws.com" },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          Environment: stage,
          Application: "solstice",
        },
      });

    const _cloudTrailRolePolicy =
      cloudTrailRole &&
      cloudTrailLogGroup &&
      new aws.iam.RolePolicy("CloudTrailRolePolicy", {
        role: cloudTrailRole.id,
        policy: cloudTrailLogGroup.arn.apply((logGroupArn) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: ["logs:CreateLogStream", "logs:PutLogEvents"],
                Resource: `${logGroupArn}:*`,
              },
            ],
          }),
        ),
      });

    // CloudTrail trail - management events only (write-only to reduce noise/cost)
    const _cloudTrail =
      cloudTrailBucket &&
      cloudTrailBucketPolicy &&
      cloudTrailLogGroup &&
      cloudTrailRole &&
      new aws.cloudtrail.Trail("CloudTrail", {
        name: `solstice-${stage}-audit-trail`,
        s3BucketName: cloudTrailBucket.id,
        cloudWatchLogsGroupArn: $interpolate`${cloudTrailLogGroup.arn}:*`,
        cloudWatchLogsRoleArn: cloudTrailRole.arn,
        enableLogFileValidation: true,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: false, // Single region (ca-central-1) for cost control
        eventSelectors: [
          {
            readWriteType: "WriteOnly", // Only write events to reduce noise/cost
            includeManagementEvents: true,
          },
        ],
        tags: {
          Environment: stage,
          Application: "solstice",
        },
      });

    // =========================================================================
    // CloudTrail Security Alarms (CIS Benchmark aligned)
    // =========================================================================

    // Metric filter and alarm helper for CloudTrail events
    const createCloudTrailAlarm = (
      name: string,
      filterPattern: string,
      description: string,
      threshold = 1,
    ) => {
      if (!cloudTrailLogGroup || !alarmTopic) return;

      const metricName = `CloudTrail${name}`;
      const metricNamespace = "Solstice/CloudTrail";

      new aws.cloudwatch.LogMetricFilter(`CloudTrail${name}Filter`, {
        name: `solstice-${stage}-cloudtrail-${name.toLowerCase()}`,
        logGroupName: cloudTrailLogGroup.name,
        pattern: filterPattern,
        metricTransformation: {
          name: metricName,
          namespace: metricNamespace,
          value: "1",
        },
      });

      new aws.cloudwatch.MetricAlarm(`CloudTrail${name}Alarm`, {
        alarmName: `solstice-${stage}-cloudtrail-${name.toLowerCase()}`,
        alarmDescription: description,
        namespace: metricNamespace,
        metricName: metricName,
        statistic: "Sum",
        period: 300, // 5 minutes
        evaluationPeriods: 1,
        threshold: threshold,
        comparisonOperator: "GreaterThanOrEqualToThreshold",
        treatMissingData: "notBreaching",
        actionsEnabled: true,
        alarmActions: [alarmTopic.arn],
        okActions: [alarmTopic.arn],
        tags: {
          Environment: stage,
          Application: "solstice",
          AlertType: "security",
        },
      });
    };

    // CIS Benchmark 3.1: Root account usage
    createCloudTrailAlarm(
      "RootAccountUsage",
      '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }',
      "Root account was used - investigate immediately",
    );

    // CIS Benchmark 3.2: Unauthorized API calls
    createCloudTrailAlarm(
      "UnauthorizedApiCalls",
      '{ ($.errorCode = "*UnauthorizedAccess*") || ($.errorCode = "AccessDenied*") }',
      "Unauthorized API calls detected - potential security issue",
      5, // Higher threshold to reduce noise
    );

    // CIS Benchmark 3.3: Console login without MFA
    createCloudTrailAlarm(
      "ConsoleLoginWithoutMfa",
      '{ ($.eventName = "ConsoleLogin") && ($.additionalEventData.MFAUsed != "Yes") }',
      "Console login without MFA detected",
    );

    // CIS Benchmark 3.4: IAM policy changes
    createCloudTrailAlarm(
      "IamPolicyChanges",
      "{ ($.eventName=DeleteGroupPolicy) || ($.eventName=DeleteRolePolicy) || ($.eventName=DeleteUserPolicy) || ($.eventName=PutGroupPolicy) || ($.eventName=PutRolePolicy) || ($.eventName=PutUserPolicy) || ($.eventName=CreatePolicy) || ($.eventName=DeletePolicy) || ($.eventName=CreatePolicyVersion) || ($.eventName=DeletePolicyVersion) || ($.eventName=AttachRolePolicy) || ($.eventName=DetachRolePolicy) || ($.eventName=AttachUserPolicy) || ($.eventName=DetachUserPolicy) || ($.eventName=AttachGroupPolicy) || ($.eventName=DetachGroupPolicy) }",
      "IAM policy was modified - verify this was authorized",
    );

    // CIS Benchmark 3.5: CloudTrail configuration changes
    createCloudTrailAlarm(
      "CloudTrailChanges",
      "{ ($.eventName = CreateTrail) || ($.eventName = UpdateTrail) || ($.eventName = DeleteTrail) || ($.eventName = StartLogging) || ($.eventName = StopLogging) }",
      "CloudTrail configuration was changed - potential tampering",
    );

    // CIS Benchmark 3.6: Console authentication failures
    createCloudTrailAlarm(
      "ConsoleAuthFailures",
      '{ ($.eventName = ConsoleLogin) && ($.errorMessage = "Failed authentication") }',
      "Console authentication failure detected",
      3, // Threshold of 3 failures
    );

    // CIS Benchmark 3.10: Security group changes
    createCloudTrailAlarm(
      "SecurityGroupChanges",
      "{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }",
      "Security group was modified - verify this was authorized",
    );

    // CIS Benchmark 3.11: Network ACL changes
    createCloudTrailAlarm(
      "NetworkAclChanges",
      "{ ($.eventName = CreateNetworkAcl) || ($.eventName = CreateNetworkAclEntry) || ($.eventName = DeleteNetworkAcl) || ($.eventName = DeleteNetworkAclEntry) || ($.eventName = ReplaceNetworkAclEntry) || ($.eventName = ReplaceNetworkAclAssociation) }",
      "Network ACL was modified - verify this was authorized",
    );

    // CIS Benchmark 3.14: VPC changes
    createCloudTrailAlarm(
      "VpcChanges",
      "{ ($.eventName = CreateVpc) || ($.eventName = DeleteVpc) || ($.eventName = ModifyVpcAttribute) || ($.eventName = AcceptVpcPeeringConnection) || ($.eventName = CreateVpcPeeringConnection) || ($.eventName = DeleteVpcPeeringConnection) || ($.eventName = RejectVpcPeeringConnection) || ($.eventName = AttachClassicLinkVpc) || ($.eventName = DetachClassicLinkVpc) || ($.eventName = DisableVpcClassicLink) || ($.eventName = EnableVpcClassicLink) }",
      "VPC was modified - verify this was authorized",
    );

    // =========================================================================
    // CloudWatch Alarms for Monitoring
    // =========================================================================

    // WAF CloudFront metrics are only available in us-east-1. The alarm must be
    // created there with a provider override. Currently disabled for non-prod
    // due to a Pulumi provider bug (SST #XXXX). TODO: Re-enable once fixed.
    if (isProd) {
      new aws.cloudwatch.MetricAlarm(
        "WafBlockedRequestsAlarm",
        {
          alarmName: `solstice-${stage}-waf-blocked-requests`,
          alarmDescription: "WAF is blocking requests at CloudFront",
          namespace: "AWS/WAFV2",
          metricName: "BlockedRequests",
          statistic: "Sum",
          period: 300, // 5 minutes
          evaluationPeriods: 1,
          threshold: 100,
          comparisonOperator: "GreaterThanOrEqualToThreshold",
          treatMissingData: "notBreaching",
          actionsEnabled: true,
          alarmActions: alarmTopic ? [alarmTopic.arn] : [],
          okActions: alarmTopic ? [alarmTopic.arn] : [],
          dimensions: {
            WebACL: wafName,
            Rule: "ALL",
            Region: "Global",
            Scope: "CLOUDFRONT",
          },
          tags: {
            Environment: stage,
            Application: "solstice",
            AlertType: "waf",
          },
        },
        { provider: cloudfrontProvider },
      );
    }

    // Get the Lambda function name from the web deployment
    // Note: SST creates the function with a generated name, we'll use pattern matching
    const _webFunctionNamePattern = `solstice-${stage}-Web*`;

    // Lambda Throttling Alarm - Critical for catching concurrency issues
    new aws.cloudwatch.MetricAlarm("LambdaThrottlingAlarm", {
      alarmName: `solstice-${stage}-lambda-throttling`,
      alarmDescription:
        "Lambda functions are being throttled due to concurrent execution limits",
      namespace: "AWS/Lambda",
      metricName: "Throttles",
      statistic: "Sum",
      period: 60, // 1 minute
      evaluationPeriods: 1,
      threshold: 1, // Alert on any throttling
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "throttling",
      },
    });

    // Lambda Errors Alarm
    new aws.cloudwatch.MetricAlarm("LambdaErrorsAlarm", {
      alarmName: `solstice-${stage}-lambda-errors`,
      alarmDescription: "Lambda functions are experiencing errors",
      namespace: "AWS/Lambda",
      metricName: "Errors",
      statistic: "Sum",
      period: 300, // 5 minutes
      evaluationPeriods: 1,
      threshold: 5, // 5 errors in 5 minutes
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "errors",
      },
    });

    // Lambda Duration Alarm - Approaching timeout
    new aws.cloudwatch.MetricAlarm("LambdaDurationAlarm", {
      alarmName: `solstice-${stage}-lambda-duration`,
      alarmDescription: "Lambda functions are taking too long (approaching timeout)",
      namespace: "AWS/Lambda",
      metricName: "Duration",
      extendedStatistic: "p95", // 95th percentile (use extendedStatistic for percentiles)
      period: 300, // 5 minutes
      evaluationPeriods: 2,
      threshold: 15000, // 15 seconds (Lambda timeout is 20s)
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "duration",
      },
    });

    // Lambda Concurrent Executions - High usage warning
    new aws.cloudwatch.MetricAlarm("LambdaConcurrencyAlarm", {
      alarmName: `solstice-${stage}-lambda-concurrency`,
      alarmDescription: "Lambda concurrent executions are high",
      namespace: "AWS/Lambda",
      metricName: "ConcurrentExecutions",
      statistic: "Maximum",
      period: 60, // 1 minute
      evaluationPeriods: 3,
      threshold: 8, // Alert when approaching the 10 limit
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "concurrency",
      },
    });

    // RDS Proxy - Client Connection Failures
    // Note: Uses the database proxy name from SST
    new aws.cloudwatch.MetricAlarm("RdsProxyConnectionAlarm", {
      alarmName: `solstice-${stage}-rds-proxy-connections`,
      alarmDescription: "RDS Proxy is experiencing connection issues",
      namespace: "AWS/RDS",
      metricName: "ClientConnectionsReceived",
      statistic: "Sum",
      period: 300, // 5 minutes
      evaluationPeriods: 2,
      threshold: 0, // Alert if no connections for 10 minutes
      comparisonOperator: "LessThanOrEqualToThreshold",
      treatMissingData: "breaching", // Missing data means no connections
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "database",
      },
    });

    // RDS Instance - CPU Utilization
    new aws.cloudwatch.MetricAlarm("RdsCpuAlarm", {
      alarmName: `solstice-${stage}-rds-cpu`,
      alarmDescription: "RDS CPU utilization is high",
      namespace: "AWS/RDS",
      metricName: "CPUUtilization",
      statistic: "Average",
      period: 300, // 5 minutes
      evaluationPeriods: 2,
      threshold: 80, // 80% CPU
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "database",
      },
    });

    const redisClusterId = redis.clusterId;

    new aws.cloudwatch.MetricAlarm("RedisCpuAlarm", {
      alarmName: `solstice-${stage}-redis-cpu`,
      alarmDescription: "Redis CPU utilization is high",
      namespace: "AWS/ElastiCache",
      metricName: "CPUUtilization",
      statistic: "Average",
      period: 300,
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      dimensions: {
        ReplicationGroupId: redisClusterId,
      },
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "redis",
      },
    });

    new aws.cloudwatch.MetricAlarm("RedisFreeMemoryAlarm", {
      alarmName: `solstice-${stage}-redis-free-memory`,
      alarmDescription: "Redis free memory is low",
      namespace: "AWS/ElastiCache",
      metricName: "FreeableMemory",
      statistic: "Minimum",
      period: 300,
      evaluationPeriods: 2,
      threshold: 200_000_000,
      comparisonOperator: "LessThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      dimensions: {
        ReplicationGroupId: redisClusterId,
      },
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "redis",
      },
    });

    new aws.cloudwatch.MetricAlarm("RedisEvictionsAlarm", {
      alarmName: `solstice-${stage}-redis-evictions`,
      alarmDescription: "Redis evictions detected",
      namespace: "AWS/ElastiCache",
      metricName: "Evictions",
      statistic: "Sum",
      period: 300,
      evaluationPeriods: 1,
      threshold: 1,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      dimensions: {
        ReplicationGroupId: redisClusterId,
      },
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "redis",
      },
    });

    new aws.cloudwatch.MetricAlarm("RedisConnectionsAlarm", {
      alarmName: `solstice-${stage}-redis-connections`,
      alarmDescription: "Redis connections are high",
      namespace: "AWS/ElastiCache",
      metricName: "CurrConnections",
      statistic: "Maximum",
      period: 300,
      evaluationPeriods: 2,
      threshold: 1000,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      dimensions: {
        ReplicationGroupId: redisClusterId,
      },
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "redis",
      },
    });

    new aws.cloudwatch.MetricAlarm("RedisReplicationLagAlarm", {
      alarmName: `solstice-${stage}-redis-replication-lag`,
      alarmDescription: "Redis replication lag is high",
      namespace: "AWS/ElastiCache",
      metricName: "ReplicationLag",
      statistic: "Maximum",
      period: 300,
      evaluationPeriods: 2,
      threshold: 1,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      dimensions: {
        ReplicationGroupId: redisClusterId,
      },
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "redis",
      },
    });

    const notificationsQueueName = notificationsQueue.nodes.queue.name;
    const notificationsDlqName = notificationsDlq.nodes.queue.name;

    // Notifications Queue - Backlog depth
    new aws.cloudwatch.MetricAlarm("NotificationsQueueDepthAlarm", {
      alarmName: `solstice-${stage}-notifications-queue-depth`,
      alarmDescription: "Notifications queue backlog is growing",
      namespace: "AWS/SQS",
      metricName: "ApproximateNumberOfMessagesVisible",
      statistic: "Maximum",
      period: 300,
      evaluationPeriods: 2,
      threshold: 100,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      dimensions: {
        QueueName: notificationsQueueName,
      },
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "notifications-queue",
      },
    });

    // Notifications Queue - Oldest message age
    new aws.cloudwatch.MetricAlarm("NotificationsQueueAgeAlarm", {
      alarmName: `solstice-${stage}-notifications-queue-age`,
      alarmDescription: "Notifications queue has stale messages",
      namespace: "AWS/SQS",
      metricName: "ApproximateAgeOfOldestMessage",
      statistic: "Maximum",
      period: 300,
      evaluationPeriods: 2,
      threshold: 900,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      dimensions: {
        QueueName: notificationsQueueName,
      },
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "notifications-queue",
      },
    });

    // Notifications DLQ - Any message indicates failure
    new aws.cloudwatch.MetricAlarm("NotificationsDlqAlarm", {
      alarmName: `solstice-${stage}-notifications-dlq`,
      alarmDescription: "Notifications DLQ has messages",
      namespace: "AWS/SQS",
      metricName: "ApproximateNumberOfMessagesVisible",
      statistic: "Maximum",
      period: 300,
      evaluationPeriods: 1,
      threshold: 1,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      treatMissingData: "notBreaching",
      actionsEnabled: isProd || isPerf,
      alarmActions: alarmTopic ? [alarmTopic.arn] : [],
      okActions: alarmTopic ? [alarmTopic.arn] : [],
      dimensions: {
        QueueName: notificationsDlqName,
      },
      tags: {
        Environment: stage,
        Application: "solstice",
        AlertType: "notifications-dlq",
      },
    });

    // CloudWatch Dashboard for quick visibility
    new aws.cloudwatch.Dashboard("MonitoringDashboard", {
      dashboardName: `solstice-${stage}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: "metric",
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              title: "Lambda Invocations & Errors",
              region: "ca-central-1",
              metrics: [
                ["AWS/Lambda", "Invocations", { stat: "Sum", period: 60 }],
                [".", "Errors", { stat: "Sum", period: 60 }],
                [".", "Throttles", { stat: "Sum", period: 60 }],
              ],
              view: "timeSeries",
              stacked: false,
            },
          },
          {
            type: "metric",
            x: 12,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              title: "Lambda Duration",
              region: "ca-central-1",
              metrics: [
                ["AWS/Lambda", "Duration", { stat: "p50", period: 60 }],
                [".", "Duration", { stat: "p95", period: 60 }],
                [".", "Duration", { stat: "Maximum", period: 60 }],
              ],
              view: "timeSeries",
              stacked: false,
            },
          },
          {
            type: "metric",
            x: 0,
            y: 6,
            width: 12,
            height: 6,
            properties: {
              title: "Lambda Concurrency",
              region: "ca-central-1",
              metrics: [
                ["AWS/Lambda", "ConcurrentExecutions", { stat: "Maximum", period: 60 }],
              ],
              view: "timeSeries",
              stacked: false,
              annotations: {
                horizontal: [
                  {
                    value: 10,
                    label: "Account Limit",
                    color: "#ff0000",
                  },
                ],
              },
            },
          },
          {
            type: "metric",
            x: 12,
            y: 6,
            width: 12,
            height: 6,
            properties: {
              title: "RDS Connections",
              region: "ca-central-1",
              metrics: [
                ["AWS/RDS", "DatabaseConnections", { stat: "Maximum", period: 60 }],
              ],
              view: "timeSeries",
              stacked: false,
            },
          },
          {
            type: "metric",
            x: 0,
            y: 12,
            width: 24,
            height: 6,
            properties: {
              title: "RDS Proxy Metrics",
              region: "ca-central-1",
              metrics: [
                ["AWS/RDS", "ClientConnections", { stat: "Maximum", period: 60 }],
                [".", "ClientConnectionsReceived", { stat: "Sum", period: 60 }],
                [".", "QueryRequests", { stat: "Sum", period: 60 }],
              ],
              view: "timeSeries",
              stacked: false,
            },
          },
        ],
      }),
    });

    return {
      url: web.url,
      alarmTopicArn: alarmTopic?.arn,
      dashboardUrl: `https://ca-central-1.console.aws.amazon.com/cloudwatch/home?region=ca-central-1#dashboards:name=solstice-${stage}`,
      importBatchClusterArn: importBatchTask.cluster,
      importBatchTaskDefinitionArn: importBatchTask.taskDefinition,
      importBatchTaskContainers: importBatchTask.containers,
      notificationsQueueUrl: notificationsQueue.url,
      notificationsQueueArn: notificationsQueue.arn,
      notificationsDlqArn: notificationsDlq.arn,
      // Note: If url changes, update BaseUrl secret: npx sst secret set BaseUrl "<url>" --stage <stage>
    };
  },
});
