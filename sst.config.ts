// Disable the next line's warning since it's part of the SST platform
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "solstice",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          profile: input.stage === "production" ? "soleil-production" : "soleil-dev"
        }
      }
    };
  },
  async run() {
    const vpc = new sst.aws.Vpc("SolsticeVpc");
    
    // Create a secret for database password in production
    const dbPassword = $app.stage === "production" 
      ? new sst.Secret("PostgresPassword")
      : undefined;
    
    const postgres = new sst.aws.Postgres("SolsticeDBV2", {
      vpc,
      version: "16.4", // Use a stable version
      storage: $app.stage === "production" ? "50 GB" : "20 GB",
      instance: $app.stage === "production" ? "t4g.micro" : undefined,
      username: "postgres",
      password: $app.stage === "production" ? dbPassword?.value : undefined,
      database: "solstice",
      multiAz: $app.stage === "production",
      proxy: $app.stage === "production",
      dev: {
        username: "postgres",
        password: "postgres",
        database: "solstice",
        host: "localhost",
        port: 5432
      }
    });
    
    new sst.aws.TanStackStart("MyWeb", {
      link: [postgres]
    });
  },
});
