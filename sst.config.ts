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
      removal: "remove", // Temporarily set for teardown
      protect: false, // Temporarily disabled for teardown
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

    // Define secrets - set via: npx sst secret set <NAME> <value> --stage production
    const secrets = {
      baseUrl: new sst.Secret("BaseUrl"), // CloudFront URL
      databaseUrl: new sst.Secret("DatabaseUrl"),
      betterAuthSecret: new sst.Secret("BetterAuthSecret"),
      googleClientId: new sst.Secret("GoogleClientId"),
      googleClientSecret: new sst.Secret("GoogleClientSecret"),
      squareEnv: new sst.Secret("SquareEnv"),
      squareApplicationId: new sst.Secret("SquareApplicationId"),
      squareAccessToken: new sst.Secret("SquareAccessToken"),
      squareLocationId: new sst.Secret("SquareLocationId"),
      squareWebhookSignatureKey: new sst.Secret("SquareWebhookSignatureKey"),
      sendgridApiKey: new sst.Secret("SendgridApiKey"),
      sendgridFromEmail: new sst.Secret("SendgridFromEmail"),
    };

    // Deploy TanStack Start app
    const web = new sst.aws.TanStackStart("Web", {
      buildCommand: "pnpm build",
      dev: {
        command: "pnpm dev",
      },
      link: Object.values(secrets),
      environment: {
        // Runtime environment detection
        SST_STAGE: $app.stage,
        NODE_ENV: "production",
        // Base URL for auth callbacks
        VITE_BASE_URL: secrets.baseUrl.value,
        // Map SST secrets to expected env var names
        DATABASE_URL: secrets.databaseUrl.value,
        BETTER_AUTH_SECRET: secrets.betterAuthSecret.value,
        GOOGLE_CLIENT_ID: secrets.googleClientId.value,
        GOOGLE_CLIENT_SECRET: secrets.googleClientSecret.value,
        SQUARE_ENV: secrets.squareEnv.value,
        SQUARE_APPLICATION_ID: secrets.squareApplicationId.value,
        SQUARE_ACCESS_TOKEN: secrets.squareAccessToken.value,
        SQUARE_LOCATION_ID: secrets.squareLocationId.value,
        SQUARE_WEBHOOK_SIGNATURE_KEY: secrets.squareWebhookSignatureKey.value,
        SENDGRID_API_KEY: secrets.sendgridApiKey.value,
        SENDGRID_FROM_EMAIL: secrets.sendgridFromEmail.value,
      },
    });

    return {
      url: web.url,
    };
  },
});
