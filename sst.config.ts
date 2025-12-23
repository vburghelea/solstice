/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="./.sst/platform/config.d.ts" />

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
    return {
      name: "solstice",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage ?? ""),
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
    const stage = $app.stage ?? "dev";
    const isProd = stage === "production";
    const isPerf = stage === "perf";

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

    // Define secrets - set via: npx sst secret set <NAME> <value> --stage production
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
    };

    // Deploy TanStack Start app
    const web = new sst.aws.TanStackStart("Web", {
      buildCommand: "pnpm build",
      dev: {
        command: "pnpm dev",
      },
      link: [database, ...Object.values(secrets)],
      vpc,
      environment: {
        // Runtime environment detection
        SST_STAGE: stage,
        NODE_ENV: isProd || isPerf ? "production" : "development",
        // Base URL for auth callbacks
        VITE_BASE_URL: secrets.baseUrl.value,
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

    return {
      url: web.url,
    };
  },
});
