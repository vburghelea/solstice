// Rate limit configuration for TanStack Pacer

// Rate limit presets for different types of operations
export const rateLimitPresets = {
  auth: {
    limit: 5,
    window: 15 * 60 * 1000, // 15 minutes
    windowType: "fixed" as const,
  },
  api: {
    limit: 100,
    window: 60 * 1000, // 1 minute
    windowType: "sliding" as const,
  },
  social: {
    limit: 10,
    window: 60 * 1000, // 1 minute
    windowType: "fixed" as const,
  },
  search: {
    limit: 10,
    window: 10 * 1000, // 10 seconds
    windowType: "sliding" as const,
  },
  mutation: {
    limit: 20,
    window: 60 * 1000, // 1 minute
    windowType: "fixed" as const,
  },
};

export type RateLimitType = keyof typeof rateLimitPresets;
