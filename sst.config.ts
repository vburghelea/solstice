/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./.sst/platform/config.d.ts" />

type StageEnvClass = "dev" | "perf" | "prod";
type StageTenantKey = "qc" | "viasport";

type StageInfo = {
  stage: string;
  stageEnv: StageEnvClass;
  stageTenant?: StageTenantKey;
  isCanonical: boolean;
};

const CANONICAL_STAGE_PATTERN = /^(qc|sin)-(dev|perf|prod)$/;
const CANONICAL_STAGE_LIST = [
  "qc-dev",
  "sin-dev",
  "qc-perf",
  "sin-perf",
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
 * All resources deployed to ca-central-1 for PIPEDA/Canadian data residency.
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
    });

    const notificationsDlq = new sst.aws.Queue("SinNotificationsDlq");
    const notificationsQueue = new sst.aws.Queue("SinNotificationsQueue", {
      visibilityTimeout: "2 minutes",
      dlq: {
        queue: notificationsDlq.arn,
        retry: 3,
      },
    });

    // Define secrets - set via: npx sst secret set <NAME> <value> --stage qc-prod|sin-prod
    const secrets = {
      baseUrl: new sst.Secret("BaseUrl"), // CloudFront URL
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
    };

    const runtimeEnv = {
      SST_STAGE: stage,
      NODE_ENV: isProd || isPerf ? "production" : "development",
    };

    const devBaseUrl = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
    const baseUrl = $dev ? devBaseUrl : secrets.baseUrl.value;

    const { tenantKey, viteTenantKey } = resolveTenantEnv(stageInfo);

    const notificationEnv = {
      SIN_NOTIFICATIONS_QUEUE_URL: notificationsQueue.url,
      SIN_NOTIFICATIONS_FROM_EMAIL: secrets.sinNotificationsFromEmail.value,
      SIN_NOTIFICATIONS_REPLY_TO_EMAIL: secrets.sinNotificationsReplyToEmail.value,
    };

    // Deploy TanStack Start app
    const web = new sst.aws.TanStackStart("Web", {
      buildCommand: "pnpm build",
      dev: {
        command: "pnpm dev",
        url: devBaseUrl,
      },
      link: [database, sinArtifacts, notificationsQueue, ...Object.values(secrets)],
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
    // CloudWatch Alarms for Monitoring
    // =========================================================================

    // Get the Lambda function name from the web deployment
    // Note: SST creates the function with a generated name, we'll use pattern matching
    const webFunctionNamePattern = `solstice-${stage}-Web*`;

    // SNS Topic for alarm notifications (create only for production)
    const alarmTopic =
      isProd || isPerf
        ? new aws.sns.Topic("AlarmNotifications", {
            name: `solstice-${stage}-alarms`,
            tags: {
              Environment: stage,
              Application: "solstice",
            },
          })
        : undefined;

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
    };
  },
});
