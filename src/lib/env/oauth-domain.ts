const DOMAIN_PATTERN = /^[a-z0-9.-]+$/;

export function parseOAuthAllowedDomains(input: string | string[] | undefined): string[] {
  if (!input) {
    return [];
  }

  const raw = Array.isArray(input) ? input : input.split(",");
  const domains = raw
    .map((domain) => domain.trim().toLowerCase())
    .filter((domain) => domain.length > 0);

  const invalid = domains.filter((domain) => !DOMAIN_PATTERN.test(domain));
  if (invalid.length > 0) {
    throw new Error(`Invalid domain(s) in OAUTH_ALLOWED_DOMAINS: ${invalid.join(", ")}`);
  }

  return Array.from(new Set(domains));
}
