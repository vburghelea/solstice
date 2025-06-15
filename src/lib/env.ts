import dotenvExpand from "dotenv-expand";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Environment configuration loader with support for layered config files
 * Priority order (highest to lowest):
 * 1. Process environment variables
 * 2. .env.{NODE_ENV}.local
 * 3. .env.local (except in test)
 * 4. .env.{NODE_ENV}
 * 5. .env
 */

export interface EnvConfig {
  DATABASE_URL: string;
  DATABASE_URL_UNPOOLED?: string; // Direct connection URL (for migrations)
  DATABASE_POOLED_URL?: string; // Explicit pooled URL override
  DATABASE_UNPOOLED_URL?: string; // Explicit unpooled URL override
  NETLIFY_DATABASE_URL?: string;
  NETLIFY_DATABASE_URL_UNPOOLED?: string;
  VITE_BASE_URL: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
  VITE_ENABLE_ANALYTICS?: string;
  VITE_ENABLE_SENTRY?: string;
  VITE_POSTHOG_KEY?: string;
  VITE_SENTRY_DSN?: string;
  NODE_ENV?: string;
  NETLIFY?: string;
  VERCEL_ENV?: string;
}

class EnvironmentLoader {
  private config: Partial<EnvConfig> = {};
  private loaded = false;

  constructor() {
    this.load();
  }

  private parseEnvFile(filePath: string): Record<string, string> {
    if (!existsSync(filePath)) {
      return {};
    }

    try {
      const content = readFileSync(filePath, "utf-8");
      const parsed: Record<string, string> = {};

      content.split("\n").forEach((line) => {
        // Skip comments and empty lines
        if (line.trim().startsWith("#") || !line.trim()) {
          return;
        }

        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          // Remove quotes if present
          parsed[key.trim()] = value.replace(/^["']|["']$/g, "");
        }
      });

      return parsed;
    } catch (error) {
      console.warn(`Failed to parse env file ${filePath}:`, error);
      return {};
    }
  }

  private load() {
    if (this.loaded) return;

    const nodeEnv = process.env.NODE_ENV || "development";
    const cwd = process.cwd();

    // Load in priority order (lowest to highest)
    const envFiles = [
      ".env",
      `.env.${nodeEnv}`,
      nodeEnv !== "test" && ".env.local",
      `.env.${nodeEnv}.local`,
    ].filter(Boolean) as string[];

    // Load each file and merge
    const combinedEnv: Record<string, string> = {};

    for (const file of envFiles) {
      const filePath = join(cwd, file);
      const parsed = this.parseEnvFile(filePath);
      Object.assign(combinedEnv, parsed);
    }

    // Apply environment variable expansion
    const expanded = dotenvExpand.expand({
      parsed: combinedEnv,
      processEnv: {},
    });

    if (expanded.parsed) {
      this.config = expanded.parsed as Partial<EnvConfig>;
    }

    // Override with actual process.env values
    Object.keys(process.env).forEach((key) => {
      if (process.env[key] !== undefined) {
        this.config[key as keyof EnvConfig] = process.env[key];
      }
    });

    this.loaded = true;
  }

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] | undefined {
    return this.config[key];
  }

  getRequired<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    const value = this.get(key);
    if (value === undefined) {
      throw new Error(`Required environment variable ${String(key)} is not set`);
    }
    return value;
  }

  getAll(): Partial<EnvConfig> {
    return { ...this.config };
  }

  isDevelopment(): boolean {
    const env = this.get("NODE_ENV") || "development";
    return env === "development";
  }

  isProduction(): boolean {
    return this.get("NODE_ENV") === "production";
  }

  isTest(): boolean {
    return this.get("NODE_ENV") === "test";
  }
}

// Export singleton instance
export const env = new EnvironmentLoader();

// Helper functions for common use cases
export const getDbUrl = () => env.getRequired("DATABASE_URL");

/**
 * Get the pooled database URL for serverless functions.
 * Priority: DATABASE_POOLED_URL > NETLIFY_DATABASE_URL > DATABASE_URL
 */
export const getPooledDbUrl = () =>
  env.get("DATABASE_POOLED_URL") ||
  env.get("NETLIFY_DATABASE_URL") ||
  env.getRequired("DATABASE_URL");

/**
 * Get the unpooled database URL for migrations and long operations.
 * Priority: DATABASE_UNPOOLED_URL > DATABASE_URL_UNPOOLED > NETLIFY_DATABASE_URL_UNPOOLED > DATABASE_URL
 */
export const getUnpooledDbUrl = () =>
  env.get("DATABASE_UNPOOLED_URL") ||
  env.get("DATABASE_URL_UNPOOLED") ||
  env.get("NETLIFY_DATABASE_URL_UNPOOLED") ||
  env.getRequired("DATABASE_URL");
export const getBaseUrl = () => env.getRequired("VITE_BASE_URL");
export const getAuthSecret = () =>
  env.get("BETTER_AUTH_SECRET") || "dev-secret-change-in-production";

// Feature flags
export const isAnalyticsEnabled = () => env.get("VITE_ENABLE_ANALYTICS") === "true";
export const isSentryEnabled = () => env.get("VITE_ENABLE_SENTRY") === "true";
export const isServerless = () => !!(env.get("NETLIFY") || env.get("VERCEL_ENV"));
