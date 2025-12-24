import fs from "fs";
import path from "path";

const root = process.cwd();
const codeExts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sh"];
const excludeDirs = new Set([
  "node_modules",
  "dist",
  "dev-dist",
  "playwright-report",
  "test-results",
  "e2e-test-results",
  "coverage",
  ".git",
  ".turbo",
  ".next",
  ".output",
  "logs",
  "repomix-bundles",
  ".sst",
  ".tanstack",
  "e2e-target-auth-flow",
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (excludeDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = walk(root);
const codeFiles = allFiles.filter((file) => {
  if (file.endsWith(".d.ts")) return true;
  return codeExts.includes(path.extname(file));
});

const relFiles = codeFiles.map((file) => path.relative(root, file)).sort();

const counts = new Map();
for (const file of relFiles) {
  const ext = file.endsWith(".d.ts") ? ".d.ts" : path.extname(file);
  counts.set(ext, (counts.get(ext) || 0) + 1);
}

const manualDescriptions = {
  "drizzle.config.ts": "Drizzle Kit config for migrations and DB naming.",
  "eslint.config.js": "ESLint flat config (TypeScript/React/TanStack rules).",
  "playwright.config.ts": "Playwright config for E2E projects and reporters.",
  "sst-env.d.ts": "SST environment type declarations for the app.",
  "sst.config.ts": "SST infrastructure definition (Lambda, RDS, CloudFront, alarms, secrets).",
  "vite.config.ts":
    "Vite config with TanStack Start, Nitro adapter, PWA, React compiler, and browser shims.",
  "vitest.config.ts": "Vitest config for unit/integration tests (jsdom, RTL).",
  ".husky/_/husky.sh": "Husky hook bootstrap script used by Git hooks.",
  ".netlify/v1/functions/server.mjs":
    "Netlify server handler that re-exports the built server fetch entry.",
  "e2e/auth.setup.ts": "Playwright auth setup that logs in and writes storage state.",
  "scripts/check-db-connections.ts":
    "CLI: list DB connections, optionally terminate idle, show limits.",
  "scripts/check-users.ts": "CLI: list users, credential vs OAuth, and recent activity.",
  "scripts/clean-test-users.ts": "CLI: remove E2E test users/teams from the database.",
  "scripts/generate-auth-secret.js": "CLI: generate a Better Auth secret.",
  "scripts/generate-erd.js": "Generate ERD diagrams from mermaid definitions.",
  "scripts/get-square-location.ts": "CLI: fetch Square sandbox location IDs.",
  "scripts/seed-e2e-data.ts": "Seed database with E2E test data/users.",
  "scripts/seed-global-admins.ts": "Seed global admin users in the database.",
  "scripts/test-auth.ts": "CLI: validate Better Auth config and env wiring.",
  "scripts/test-db-connection.ts": "CLI: validate pooled/unpooled DB connections.",
  "scripts/test-routing.ts": "Playwright smoke test for login and teams navigation.",
  "scripts/test-security-headers.sh": "Shell script: check security headers via curl.",
  "scripts/test-server-auth.ts": "CLI: exercise server-side auth session retrieval.",
  "scripts/test-square-sandbox.ts":
    "CLI: validate Square sandbox APIs (locations/catalog/payments).",
  "scripts/update-code-guide.mjs": "Generator for CODE_GUIDE.md.",
  "src/client.tsx":
    "Client entry: hydrates Start app, attaches router diagnostics, exposes __ROUTER__ in dev.",
  "src/server.ts": "Server entry: createStartHandler with defaultStreamHandler.",
  "src/start.ts": "Start instance config: requestId + orgContext middleware for server functions.",
  "src/router.tsx":
    "Router factory: QueryClient integration + CSP nonce handling + SSR query integration.",
  "src/app/providers.tsx": "React providers: QueryClientProvider + StepUpProvider.",
  "src/routeTree.gen.ts": "Auto-generated route tree from file-based routing (do not edit).",
  "src/diagnostics/routerDiagnostics.ts": "Router diagnostics subscription (dev-only logging).",
  "src/shims/async-local-storage.browser.ts":
    "Browser shim for node:async_hooks AsyncLocalStorage.",
  "src/shims/stream.browser.ts": "Browser shim for node:stream.",
  "src/shims/stream-web.browser.ts": "Browser shim for node:stream/web.",
  "src/db/connections.ts": "DB connection manager (pooled/unpooled) and health tracking.",
  "src/db/index.ts": "DB entry point: expose db() helper and schema exports.",
  "src/db/server-helpers.ts": "Server-only DB helpers with dynamic imports.",
  "src/lib/audit/index.ts": "Audit logging with hash chain, redaction, and PII hashing.",
  "src/lib/auth/server-helpers.ts":
    "Server-only Better Auth config (Drizzle adapter, OAuth, MFA, cookie config).",
  "src/lib/env.client.ts": "Client-safe env parsing with VITE_ vars and feature flags.",
  "src/lib/env.server.ts": "Server env parsing + runtime detection for SST/Lambda.",
  "src/lib/env/oauth-domain.ts": "OAuth domain allowlist parsing and validation.",
  "src/lib/notifications/send.ts":
    "Notification dispatch: in-app insert + SES email with retry/idempotency.",
  "src/lib/payments/square.ts": "Square facade with mock fallback; chooses real implementation by env.",
  "src/lib/payments/square-real.ts":
    "Square SDK implementation: checkout, verification, webhooks, refunds.",
  "src/lib/server/auth.ts": "Server auth helpers: middleware list + requireUser.",
  "src/lib/security/utils/password-validator.ts": "Password validation + strength scoring helpers.",
  "src/lib/storage/artifacts.ts": "S3 client + artifacts bucket resolution.",
  "src/routes/__root.tsx":
    "Root route: loads auth + privacy acceptance, sets head/meta, wires devtools.",
  "src/routes/api/auth/$.ts": "Better Auth catch-all API route handler.",
  "src/routes/api/auth/$action/$provider.ts": "Dynamic Better Auth provider/action handler.",
  "src/routes/api/health.ts": "Health check API (DB + Square config).",
  "src/routes/api/payments/square/callback.ts": "Square callback handler for payment finalization.",
  "src/routes/api/webhooks/square.ts": "Square webhook handler (payment events/refunds).",
  "src/routes/api/test/cleanup.ts": "E2E cleanup API route.",
  "src/routes/api/test-square.ts": "Square sandbox test route.",
  "src/routes/api/debug-square.ts": "Debug endpoint for Square configuration.",
  "src/routes/index.tsx": "Landing page route (redirects authenticated users).",
  "src/routes/auth/login.tsx": "Login route (email/OAuth UI).",
  "src/routes/auth/signup.tsx": "Signup route (email/OAuth UI).",
  "src/routes/auth/route.tsx": "Auth layout/route config for /auth section.",
  "src/routes/onboarding/index.tsx": "Onboarding route (profile completion).",
  "src/routes/onboarding/route.tsx": "Onboarding route config/guard wrapper.",
  "src/features/membership/membership.finalize.ts":
    "Idempotent membership finalization from payment sessions.",
  "src/features/roles/permission.service.ts": "Permission checks shared with client helpers.",
  "src/features/roles/permission.server.ts": "Server-only PermissionService wrapper.",
  "src/features/dashboard/MemberDashboard.tsx": "Member dashboard view and stats.",
  "src/features/dashboard/PublicPortalPage.tsx":
    "Public portal content for unauthenticated users.",
  "src/tests/mocks/auth.ts": "Test mocks for Better Auth client/session.",
  "src/tests/setup.ts": "Vitest global setup, DOM mocks, and TanStack Start test shims.",
  "src/tests/utils.tsx": "Testing Library utilities with QueryClient providers.",
  "src/tests/utils/router.tsx": "TanStack Router test helpers and mock user context.",
};

function toTitleCase(value) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isBarrel(filePath, content) {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line &&
        !line.startsWith("//") &&
        !line.startsWith("/*") &&
        !line.startsWith("*"),
    );
  if (lines.length === 0) return false;
  return lines.every((line) => line.startsWith("export "));
}

function describeRoute(file) {
  const rel = file
    .replace(/^src\/routes\//, "")
    .replace(/\.tsx?$/, "")
    .replace(/\.ts$/, "");
  if (rel === "__root") return "Root route file.";
  const segments = rel.split("/").map((seg) => {
    if (seg === "index") return "";
    if (seg === "route") return "";
    if (seg === "$") return "*";
    if (seg.startsWith("$")) return `:${seg.slice(1)}`;
    return seg;
  });
  const pathSegments = segments.filter(Boolean);
  const routePath = `/${pathSegments.join("/")}`;
  const suffix =
    rel.endsWith("/route") || rel.endsWith("route")
      ? "Route config/layout."
      : "Route component.";
  return `Route file for ${routePath || "/"} (${suffix})`;
}

function describeTest(file) {
  const base = path
    .basename(file)
    .replace(/\.(test|spec)\.[tj]sx?$/, "")
    .replace(/\.[tj]sx?$/, "");
  return `Test: ${toTitleCase(base)}.`;
}

function normalizeE2eName(baseName) {
  const parts = baseName.split(".").filter(Boolean);
  const filtered = parts.filter((part) => !["auth", "unauth", "spec", "shared"].includes(part));
  const merged = filtered.join(" ");
  return toTitleCase(merged || baseName);
}

function describeFile(file) {
  if (manualDescriptions[file]) return manualDescriptions[file];

  const ext = file.endsWith(".d.ts") ? ".d.ts" : path.extname(file);
  const baseName = file.endsWith(".d.ts")
    ? path.basename(file, ".d.ts")
    : path.basename(file, ext);
  const content = fs.readFileSync(path.join(root, file), "utf8");

  if (file.startsWith("e2e/tests/")) {
    const scope = file.includes("/authenticated/") ? "Authenticated" : "Unauthenticated";
    return `${scope} E2E test: ${normalizeE2eName(baseName)}.`;
  }

  if (file.startsWith("e2e/helpers/")) {
    return `E2E helper: ${toTitleCase(baseName)}.`;
  }

  if (file.startsWith("e2e/utils/")) {
    return `E2E utility: ${toTitleCase(baseName)}.`;
  }

  if (file.startsWith("e2e/fixtures/")) {
    return `E2E fixture: ${toTitleCase(baseName)}.`;
  }

  if (file.includes("__tests__") || /(\.test\.|\.spec\.)/.test(file)) {
    return describeTest(file);
  }

  if (file.startsWith("src/tests/")) {
    return `Test utility: ${toTitleCase(baseName)}.`;
  }

  if (file.startsWith("src/routes/")) {
    return describeRoute(file);
  }

  if (file.includes("/components/") && ext === ".tsx") {
    return `React component: ${toTitleCase(baseName)}.`;
  }

  if (file.includes("/hooks/")) {
    return `React hook: ${toTitleCase(baseName)}.`;
  }

  if (file.endsWith(".schemas.ts")) {
    const feature = toTitleCase(baseName.replace(/\.schemas$/, "").replace(/schemas$/, ""));
    return `Zod schemas for ${feature}.`;
  }

  if (file.endsWith(".queries.ts")) {
    const feature = toTitleCase(baseName.replace(/\.queries$/, "").replace(/queries$/, ""));
    return `Server-side queries for ${feature}.`;
  }

  if (file.endsWith(".mutations.ts")) {
    const feature = toTitleCase(baseName.replace(/\.mutations$/, "").replace(/mutations$/, ""));
    return `Server-side mutations for ${feature}.`;
  }

  if (file.endsWith(".types.ts")) {
    const feature = toTitleCase(baseName.replace(/\.types$/, "").replace(/types$/, ""));
    return `TypeScript types for ${feature}.`;
  }

  if (file.endsWith(".db-types.ts")) {
    const feature = toTitleCase(baseName.replace(/\.db-types$/, "").replace(/db-types$/, ""));
    return `DB-specific type overrides for ${feature}.`;
  }

  if (file.endsWith(".utils.ts")) {
    const feature = toTitleCase(baseName.replace(/\.utils$/, "").replace(/utils$/, ""));
    return `Utilities for ${feature}.`;
  }

  if (baseName === "index" && isBarrel(file, content)) {
    const dirName = path.basename(path.dirname(file));
    return `Barrel exports for ${toTitleCase(dirName)}.`;
  }

  if (file.startsWith("src/db/schema/") && file.endsWith(".schema.ts")) {
    return `Drizzle schema for ${toTitleCase(baseName.replace(".schema", ""))}.`;
  }

  if (file.startsWith("src/features/")) {
    const feature = file.split("/")[2];
    return `Feature module file for ${toTitleCase(feature)}.`;
  }

  if (file.startsWith("src/lib/")) {
    const libArea = file.split("/")[2];
    return `Library module for ${toTitleCase(libArea)}.`;
  }

  if (file.startsWith("scripts/")) {
    return `Repository script: ${toTitleCase(baseName)}.`;
  }

  if (file.startsWith("repomix-configs/")) {
    return `Repomix helper script: ${toTitleCase(baseName)}.`;
  }

  if (file.startsWith("src/shared/")) {
    return `Shared module: ${toTitleCase(baseName)}.`;
  }

  if (file.startsWith("src/cron/")) {
    return `Cron job entry: ${toTitleCase(baseName)}.`;
  }

  if (file.startsWith("src/workers/")) {
    return `Worker entry: ${toTitleCase(baseName)}.`;
  }

  if (file.startsWith(".nitro/types/")) {
    return "Generated Nitro type definitions.";
  }

  if (file.startsWith("src/nitro/")) {
    return "Nitro AWS Lambda runtime entry file.";
  }

  if (ext === ".d.ts") {
    return "Type declarations.";
  }

  return `Source file: ${toTitleCase(baseName)}.`;
}

function groupFiles(prefix) {
  return relFiles.filter((file) => file.startsWith(prefix));
}

function renderList(files) {
  return files.map((file) => `- \`${file}\` - ${describeFile(file)}`).join("\n");
}

function renderSection(title, files) {
  if (!files.length) return "";
  return `\n### ${title}\n\n${renderList(files)}\n`;
}

const generatedAt = new Date()
  .toISOString()
  .replace(/\.\d{3}Z$/, "Z");

const lines = [];
lines.push("# Solstice Codebase Guide");
lines.push("");
lines.push(`Generated: ${generatedAt} (UTC)`);
lines.push("");
lines.push("Per-file inventory of the codebase. Every code file in the scope below is listed.");
lines.push("");
lines.push("## Coverage Scope");
lines.push("");
lines.push("- Included extensions: .ts, .tsx, .js, .mjs, .cjs, .sh, .d.ts");
lines.push(`- Excluded directories: ${Array.from(excludeDirs).sort().join(", ")}`);
lines.push(
  `- Code file counts: ${Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ext, count]) => `${ext}=${count}`)
    .join(", ")}`,
);
lines.push(`- Total code files: ${relFiles.length}`);
lines.push("");
lines.push("## Updating This File");
lines.push("");
lines.push("- Run: `node scripts/update-code-guide.mjs`.");
lines.push("- Review `CODE_GUIDE.md` for expected changes and commit updates.");
lines.push("- Adjust `excludeDirs` or `codeExts` in `scripts/update-code-guide.mjs` if scope changes.");
lines.push("");
lines.push("## Quick Reference");
lines.push("");
lines.push(
  "- Stack: TanStack Start (React) + Drizzle ORM + PostgreSQL + Better Auth + Tailwind/shadcn.",
);
lines.push("- Deployment: SST on AWS Lambda, CloudFront, RDS Postgres (ca-central-1).");
lines.push("- Frontend: Vite, React Query, TanStack Router, PWA via Vite PWA plugin.");
lines.push("- Auth: Better Auth with Google OAuth + 2FA, Drizzle adapter.");
lines.push("- Payments: Square (sandbox/production) with mock fallback.");
lines.push("");
lines.push("## Key Patterns (Observed)");
lines.push("");
lines.push(
  "- Server functions use createServerFn; most use Zod inputValidator, but a few files do not (listed in Tech Debt).",
);
lines.push(
  "- Server-only dependencies are dynamically imported or wrapped to avoid client bundle pollution.",
);
lines.push(
  "- Role checks centralized in PermissionService (roles feature) + auth guards in src/lib/auth/guards.",
);
lines.push("- Audit log uses hash chaining and PII redaction in src/lib/audit/index.ts.");
lines.push("- Notification emails are sent via SES with retry; in-app notifications are persisted first.");
lines.push("");
lines.push("## Root Configuration and Tooling");
lines.push("");
const rootFiles = relFiles.filter((file) => !file.includes("/") && file !== "CODE_GUIDE.md");
lines.push(renderList(rootFiles));

const dotDirs = [".husky", ".netlify", ".nitro"];
for (const dir of dotDirs) {
  const files = groupFiles(`${dir}/`);
  if (files.length) {
    lines.push(`\n## ${dir} (Generated/Tooling)`);
    lines.push("");
    lines.push(renderList(files));
  }
}

const repomixFiles = groupFiles("repomix-configs/");
if (repomixFiles.length) {
  lines.push("\n## Repomix Config Scripts");
  lines.push("");
  lines.push(renderList(repomixFiles));
}

const scriptsFiles = groupFiles("scripts/");
if (scriptsFiles.length) {
  lines.push("\n## Scripts");
  lines.push("");
  lines.push(renderList(scriptsFiles));
}

const e2eFiles = groupFiles("e2e/");
if (e2eFiles.length) {
  lines.push("\n## E2E (Playwright)");
  lines.push("");
  lines.push(renderList(e2eFiles));
}

const srcFiles = groupFiles("src/");
if (srcFiles.length) {
  lines.push("\n## src (Application Code)");

  const srcTop = srcFiles.filter((file) => file.split("/").length === 2);
  if (srcTop.length) {
    lines.push(renderSection("Top-level entries", srcTop));
  }

  const srcSubdirs = new Map();
  for (const file of srcFiles) {
    const parts = file.split("/");
    if (parts.length < 3) continue;
    const key = `src/${parts[1]}`;
    if (!srcSubdirs.has(key)) srcSubdirs.set(key, []);
    srcSubdirs.get(key).push(file);
  }

  const orderedSrcKeys = Array.from(srcSubdirs.keys()).sort();
  for (const key of orderedSrcKeys) {
    const files = srcSubdirs.get(key).filter((file) => !srcTop.includes(file));
    if (!files.length) continue;

    if (key === "src/features") {
      lines.push("### src/features (Domain Modules)");
      const featureMap = new Map();
      for (const file of files) {
        const feature = file.split("/")[2];
        if (!featureMap.has(feature)) featureMap.set(feature, []);
        featureMap.get(feature).push(file);
      }
      const featureKeys = Array.from(featureMap.keys()).sort();
      for (const feature of featureKeys) {
        lines.push(`\n#### ${feature}`);
        lines.push("");
        lines.push(renderList(featureMap.get(feature).sort()));
      }
      lines.push("");
      continue;
    }

    if (key === "src/routes") {
      lines.push("### src/routes (File-based Routing)");
      const routeMap = new Map();
      for (const file of files) {
        const segments = file.split("/");
        const group = segments.length > 2 ? segments[2] : "root";
        if (!routeMap.has(group)) routeMap.set(group, []);
        routeMap.get(group).push(file);
      }
      const routeKeys = Array.from(routeMap.keys()).sort();
      for (const group of routeKeys) {
        lines.push(`\n#### ${group}`);
        lines.push("");
        lines.push(renderList(routeMap.get(group).sort()));
      }
      lines.push("");
      continue;
    }

    lines.push(`### ${key}`);
    lines.push("");
    lines.push(renderList(files.sort()));
    lines.push("");
  }
}

lines.push("## Tech Debt / Accuracy Notes");
lines.push("");
lines.push(
  "- Better Auth cookie cache is disabled due to upstream bug (see src/lib/auth/server-helpers.ts).",
);
lines.push(
  "- Root route duplicates server/client user fetch logic (see src/routes/__root.tsx).",
);

const missingInputValidator = relFiles
  .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
  .filter((file) => file.startsWith("src/"))
  .filter((file) => {
    const content = fs.readFileSync(path.join(root, file), "utf8");
    return content.includes("createServerFn") && !content.includes("inputValidator");
  });

if (missingInputValidator.length) {
  lines.push(
    `- createServerFn without inputValidator: ${missingInputValidator
      .map((file) => `\`${file}\``)
      .join(", ")}`,
  );
}

lines.push("");

const output = lines.join("\n");
fs.writeFileSync(path.join(root, "CODE_GUIDE.md"), output, "utf8");
console.log("Wrote CODE_GUIDE.md");
