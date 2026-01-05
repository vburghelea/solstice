import { checkRateLimit } from "~/lib/security/rate-limiter";

type AuthRateLimitRule = {
  match: RegExp;
  route: string;
};

const AUTH_RATE_LIMIT_RULES: AuthRateLimitRule[] = [
  { match: /^\/sign-in\//, route: "auth:sign-in" },
  { match: /^\/sign-up\//, route: "auth:sign-up" },
  { match: /^\/request-password-reset$/, route: "auth:password-reset-request" },
  { match: /^\/reset-password(\/|$)/, route: "auth:password-reset" },
  { match: /^\/two-factor\/verify-/, route: "auth:two-factor-verify" },
];

const resolveAuthPath = (request: Request) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/auth")) {
    return url.pathname.slice("/api/auth".length) || "/";
  }
  return url.pathname;
};

export const maybeRateLimitAuthRequest = async (request: Request) => {
  if (request.method.toUpperCase() !== "POST") return null;

  const authPath = resolveAuthPath(request);
  const rule = AUTH_RATE_LIMIT_RULES.find((entry) => entry.match.test(authPath));
  if (!rule) return null;

  const decision = await checkRateLimit({
    bucket: "auth",
    route: rule.route,
    headers: request.headers,
  });

  if (decision.allowed) return null;

  const retryAfterSeconds = Math.ceil(decision.retryAfterMs / 1000);
  return new Response(
    JSON.stringify({
      error: {
        message: "Too many requests. Please try again later.",
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
};
