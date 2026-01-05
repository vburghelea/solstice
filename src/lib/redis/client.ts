import { createServerOnlyFn } from "@tanstack/react-start";

export type RedisClient = ReturnType<typeof import("redis").createClient>;

export type RedisConfig = {
  enabled: boolean;
  required: boolean;
  host: string | undefined;
  port: number | undefined;
  authToken: string | undefined;
  tls: boolean;
  prefix: string;
};

type GetRedisOptions = {
  required?: boolean;
};

const resolveRedisConfig = createServerOnlyFn(async (): Promise<RedisConfig> => {
  const { env, getSSTStage, isProduction } = await import("~/lib/env.server");

  const stage = getSSTStage() ?? (isProduction() ? "prod" : "local");
  const prefix = env.REDIS_PREFIX?.trim() || `sin:${stage}`;

  return {
    enabled: env.REDIS_ENABLED ?? false,
    required: env.REDIS_REQUIRED ?? false,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT ?? 6379,
    authToken: env.REDIS_AUTH_TOKEN ?? undefined,
    tls: env.REDIS_TLS ?? isProduction(),
    prefix,
  };
});

let cachedConfig: RedisConfig | null = null;

export const getRedisConfig = async (): Promise<RedisConfig> => {
  if (cachedConfig) return cachedConfig;
  const resolved = await resolveRedisConfig();
  cachedConfig = resolved;
  return resolved;
};

let cachedClient: RedisClient | null = null;
let clientPromise: Promise<RedisClient | null> | null = null;

const buildRedisUrl = (config: RedisConfig) => {
  if (!config.host || !config.port) {
    throw new Error("Redis host/port not configured.");
  }
  const protocol = config.tls ? "rediss" : "redis";
  return `${protocol}://${config.host}:${config.port}`;
};

const createRedisClient = async (required: boolean): Promise<RedisClient | null> => {
  try {
    const config = await getRedisConfig();
    const { createClient } = await import("redis");

    const client = createClient({
      url: buildRedisUrl(config),
      ...(config.tls ? { socket: { tls: true } } : {}),
      ...(config.authToken ? { password: config.authToken } : {}),
    });

    client.on("error", (error) => {
      console.error("Redis client error", error);
    });

    await client.connect();
    return client;
  } catch (error) {
    if (required) {
      throw error;
    }
    console.warn("Redis connection failed; continuing without Redis", error);
    return null;
  }
};

export const getRedis = async (
  options: GetRedisOptions = {},
): Promise<RedisClient | null> => {
  const config = await getRedisConfig();
  const required = options.required ?? config.required;

  if (!config.enabled) {
    if (required) {
      throw new Error("Redis is required but disabled.");
    }
    return null;
  }

  if (!config.host || !config.port) {
    if (required) {
      throw new Error("Redis configuration is missing.");
    }
    return null;
  }

  if (cachedClient) return cachedClient;
  if (!clientPromise) {
    clientPromise = createRedisClient(required)
      .then((client) => {
        if (client) {
          cachedClient = client;
        } else {
          clientPromise = null;
        }
        return client;
      })
      .catch((error) => {
        clientPromise = null;
        if (required) {
          throw error;
        }
        return null;
      });
  }

  return clientPromise;
};

export const closeRedis = async () => {
  if (!cachedClient) return;
  await cachedClient.quit();
  cachedClient = null;
  clientPromise = null;
};
