#!/usr/bin/env npx tsx
/**
 * SQL Injection Test Suite for SQL Workbench
 *
 * Tests the SQL parser, rewriter, and executor against common SQL injection patterns.
 * Run with: npx tsx scripts/test-sql-injection.ts
 *
 * This script tests the parser/rewriter in isolation (no DB connection needed).
 */

import {
  parseAndValidateSql,
  validateAgainstDataset,
} from "../src/features/bi/engine/sql-parser";
import { rewriteSqlTables } from "../src/features/bi/engine/sql-rewriter";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

type TestCase = {
  name: string;
  sql: string;
  shouldBlock: boolean;
  category: string;
};

const testCases: TestCase[] = [
  // === MULTI-STATEMENT INJECTION ===
  {
    name: "Multi-statement with DROP",
    sql: "SELECT * FROM organizations; DROP TABLE organizations;",
    shouldBlock: true,
    category: "Multi-statement",
  },
  {
    name: "Multi-statement with DELETE",
    sql: "SELECT 1; DELETE FROM organizations;",
    shouldBlock: true,
    category: "Multi-statement",
  },
  {
    name: "Multi-statement with INSERT",
    sql: "SELECT 1; INSERT INTO organizations VALUES (1);",
    shouldBlock: true,
    category: "Multi-statement",
  },
  {
    name: "Multi-statement with UPDATE",
    sql: "SELECT 1; UPDATE organizations SET name='hacked';",
    shouldBlock: true,
    category: "Multi-statement",
  },
  {
    name: "Semicolon in string (should allow)",
    sql: "SELECT * FROM organizations WHERE name = 'test;value'",
    shouldBlock: false,
    category: "Multi-statement",
  },

  // === SESSION/ROLE MANIPULATION ===
  {
    name: "SET ROLE injection",
    sql: "SET ROLE postgres; SELECT * FROM organizations;",
    shouldBlock: true,
    category: "Session/Role",
  },
  {
    name: "SET app.org_id injection",
    sql: "SET app.org_id = 'malicious-org'; SELECT * FROM organizations;",
    shouldBlock: true,
    category: "Session/Role",
  },
  {
    name: "SET app.is_global_admin injection",
    sql: "SET app.is_global_admin = 'true'; SELECT * FROM organizations;",
    shouldBlock: true,
    category: "Session/Role",
  },
  {
    name: "RESET injection",
    sql: "RESET ROLE; SELECT * FROM organizations;",
    shouldBlock: true,
    category: "Session/Role",
  },
  {
    name: "SET LOCAL injection",
    sql: "SET LOCAL ROLE superuser; SELECT 1;",
    shouldBlock: true,
    category: "Session/Role",
  },

  // === TRANSACTION MANIPULATION ===
  {
    name: "BEGIN injection",
    sql: "BEGIN; SELECT * FROM organizations;",
    shouldBlock: true,
    category: "Transaction",
  },
  {
    name: "COMMIT injection",
    sql: "SELECT 1; COMMIT;",
    shouldBlock: true,
    category: "Transaction",
  },
  {
    name: "ROLLBACK injection",
    sql: "SELECT 1; ROLLBACK;",
    shouldBlock: true,
    category: "Transaction",
  },
  {
    name: "SAVEPOINT injection",
    sql: "SAVEPOINT x; SELECT 1;",
    shouldBlock: true,
    category: "Transaction",
  },

  // === DANGEROUS STATEMENTS ===
  {
    name: "COPY command",
    sql: "COPY organizations TO '/tmp/data.csv';",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "DO block (PL/pgSQL)",
    sql: "DO $$ BEGIN RAISE NOTICE 'pwned'; END $$;",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "CALL procedure",
    sql: "CALL malicious_procedure();",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "VACUUM command",
    sql: "VACUUM organizations;",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "ANALYZE command",
    sql: "ANALYZE organizations;",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "TRUNCATE command",
    sql: "TRUNCATE organizations;",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "CREATE TABLE",
    sql: "CREATE TABLE hacked (id int);",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "ALTER TABLE",
    sql: "ALTER TABLE organizations ADD COLUMN pwned text;",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "DROP TABLE",
    sql: "DROP TABLE organizations;",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "GRANT privileges",
    sql: "GRANT ALL ON organizations TO PUBLIC;",
    shouldBlock: true,
    category: "Dangerous",
  },
  {
    name: "REVOKE privileges",
    sql: "REVOKE ALL ON organizations FROM bi_readonly;",
    shouldBlock: true,
    category: "Dangerous",
  },

  // === COMMENT BYPASS ATTEMPTS ===
  {
    name: "Comment to hide injection",
    sql: "SELECT 1; -- DROP TABLE organizations;",
    shouldBlock: false, // The DROP is in a comment, so it's actually safe - only SELECT 1 executes
    category: "Comment Bypass",
  },
  {
    name: "Block comment bypass",
    sql: "SELECT 1; /* hidden */ DROP TABLE organizations;",
    shouldBlock: true,
    category: "Comment Bypass",
  },
  {
    name: "Nested comment bypass",
    sql: "SELECT /* /* nested */ 1 */ FROM organizations; DROP TABLE x;",
    shouldBlock: true,
    category: "Comment Bypass",
  },

  // === ENCODING/ESCAPE BYPASS ===
  {
    name: "Unicode escape sequence",
    sql: "SELECT * FROM organizations WHERE name = E'\\u0027; DROP TABLE x; --'",
    shouldBlock: true, // Parser rejects this escape syntax (defense in depth)
    category: "Encoding",
  },
  {
    name: "Hex escape",
    sql: "SELECT * FROM organizations WHERE name = '\\x27'",
    shouldBlock: false, // String literal, should be safe
    category: "Encoding",
  },

  // === SUBQUERY/CTE ATTACKS ===
  {
    name: "Subquery accessing raw table",
    sql: "SELECT * FROM (SELECT * FROM users) AS sub",
    shouldBlock: true, // 'users' is not an allowed table
    category: "Table Access",
  },
  {
    name: "CTE accessing raw table",
    sql: "WITH stolen AS (SELECT * FROM users) SELECT * FROM stolen",
    shouldBlock: true, // 'users' is not an allowed table
    category: "Table Access",
  },
  {
    name: "UNION with raw table",
    sql: "SELECT id FROM organizations UNION SELECT id FROM users",
    shouldBlock: true, // 'users' is not allowed
    category: "Table Access",
  },

  // === FUNCTION ABUSE ===
  {
    name: "pg_read_file function",
    sql: "SELECT pg_read_file('/etc/passwd')",
    shouldBlock: false, // Parser allows, but DB role should block
    category: "Function",
  },
  {
    name: "pg_ls_dir function",
    sql: "SELECT pg_ls_dir('/tmp')",
    shouldBlock: false, // Parser allows, but DB role should block
    category: "Function",
  },
  {
    name: "COPY TO PROGRAM",
    sql: "COPY (SELECT 1) TO PROGRAM 'rm -rf /'",
    shouldBlock: true,
    category: "Function",
  },

  // === VALID QUERIES (should pass) ===
  {
    name: "Simple SELECT",
    sql: "SELECT * FROM organizations",
    shouldBlock: false,
    category: "Valid",
  },
  {
    name: "SELECT with WHERE",
    sql: "SELECT id, name FROM organizations WHERE status = 'active'",
    shouldBlock: false,
    category: "Valid",
  },
  {
    name: "SELECT with JOIN",
    sql: "SELECT o.* FROM organizations o",
    shouldBlock: false,
    category: "Valid",
  },
  {
    name: "SELECT with LIMIT",
    sql: "SELECT * FROM organizations LIMIT 10",
    shouldBlock: false,
    category: "Valid",
  },
  {
    name: "SELECT with ORDER BY",
    sql: "SELECT * FROM organizations ORDER BY name",
    shouldBlock: false,
    category: "Valid",
  },
  {
    name: "SELECT with GROUP BY",
    sql: "SELECT type, COUNT(*) FROM organizations GROUP BY type",
    shouldBlock: false,
    category: "Valid",
  },
  {
    name: "SELECT with CTE",
    sql: "WITH active AS (SELECT * FROM organizations WHERE status = 'active') SELECT * FROM active",
    shouldBlock: false,
    category: "Valid",
  },
  {
    name: "SELECT with parameter",
    sql: "SELECT * FROM organizations WHERE id = {{organization_id}}",
    shouldBlock: false,
    category: "Valid",
  },
];

// Simulated allowed tables/columns for validation
const allowedTables = new Set([
  "bi_v_organizations",
  "bi_v_events",
  "bi_v_form_submissions",
  "bi_v_reporting_submissions",
]);
const allowedColumns = new Map([
  [
    "bi_v_organizations",
    new Set([
      "id",
      "name",
      "slug",
      "type",
      "parent_org_id",
      "status",
      "created_at",
      "updated_at",
    ]),
  ],
  [
    "bi_v_events",
    new Set(["id", "name", "type", "status", "start_date", "end_date", "created_at"]),
  ],
  [
    "bi_v_form_submissions",
    new Set(["id", "form_id", "organization_id", "status", "submitted_at", "created_at"]),
  ],
  [
    "bi_v_reporting_submissions",
    new Set(["id", "task_id", "organization_id", "status", "submitted_at", "created_at"]),
  ],
]);

const tableMapping: Record<string, string> = {
  organizations: "bi_v_organizations",
  events: "bi_v_events",
  form_submissions: "bi_v_form_submissions",
  reporting_submissions: "bi_v_reporting_submissions",
};

function runTest(test: TestCase): { passed: boolean; reason: string } {
  try {
    // Step 1: Parse and validate
    const parsed = parseAndValidateSql(test.sql);

    if (!parsed.isValid) {
      // Query was blocked by parser
      if (test.shouldBlock) {
        return { passed: true, reason: `Blocked by parser: ${parsed.errors.join(", ")}` };
      }
      return {
        passed: false,
        reason: `Unexpectedly blocked: ${parsed.errors.join(", ")}`,
      };
    }

    // Step 2: Rewrite tables
    let rewritten: { sql: string };
    try {
      rewritten = rewriteSqlTables(test.sql.replace(/;+$/, ""), tableMapping);
    } catch (error) {
      if (test.shouldBlock) {
        return {
          passed: true,
          reason: `Blocked by rewriter: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
      return {
        passed: false,
        reason: `Rewriter error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    // Step 3: Validate against dataset
    const rewrittenParsed = parseAndValidateSql(rewritten.sql);
    if (!rewrittenParsed.isValid) {
      if (test.shouldBlock) {
        return {
          passed: true,
          reason: `Blocked after rewrite: ${rewrittenParsed.errors.join(", ")}`,
        };
      }
      return {
        passed: false,
        reason: `Parse failed after rewrite: ${rewrittenParsed.errors.join(", ")}`,
      };
    }

    const validationErrors = validateAgainstDataset(
      rewrittenParsed,
      allowedTables,
      allowedColumns,
    );

    if (validationErrors.length > 0) {
      if (test.shouldBlock) {
        return {
          passed: true,
          reason: `Blocked by validator: ${validationErrors.join(", ")}`,
        };
      }
      return {
        passed: false,
        reason: `Unexpectedly blocked by validator: ${validationErrors.join(", ")}`,
      };
    }

    // Query passed all checks
    if (test.shouldBlock) {
      return {
        passed: false,
        reason: "VULNERABILITY: Query was NOT blocked but should have been!",
      };
    }
    return { passed: true, reason: "Allowed (as expected)" };
  } catch (error) {
    if (test.shouldBlock) {
      return {
        passed: true,
        reason: `Blocked by exception: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
    return {
      passed: false,
      reason: `Unexpected exception: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function main() {
  console.log("\n" + "=".repeat(80));
  console.log("SQL INJECTION TEST SUITE FOR SQL WORKBENCH");
  console.log("=".repeat(80) + "\n");

  const results: { category: string; name: string; passed: boolean; reason: string }[] =
    [];
  let passed = 0;
  let failed = 0;

  const categories = [...new Set(testCases.map((t) => t.category))];

  for (const category of categories) {
    console.log(`\n${YELLOW}=== ${category} ===${RESET}\n`);

    const categoryTests = testCases.filter((t) => t.category === category);
    for (const test of categoryTests) {
      const result = runTest(test);
      results.push({ category, name: test.name, ...result });

      if (result.passed) {
        passed++;
        console.log(`${GREEN}✓${RESET} ${test.name}`);
        console.log(`  ${result.reason}`);
      } else {
        failed++;
        console.log(`${RED}✗${RESET} ${test.name}`);
        console.log(`  ${RED}${result.reason}${RESET}`);
        console.log(`  SQL: ${test.sql}`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(
    `Total: ${testCases.length} | ${GREEN}Passed: ${passed}${RESET} | ${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}`,
  );

  if (failed > 0) {
    console.log(`\n${RED}SECURITY VULNERABILITIES DETECTED!${RESET}`);
    console.log("The following tests failed (potential injection vectors):\n");
    for (const result of results.filter((r) => !r.passed)) {
      console.log(`  - [${result.category}] ${result.name}`);
      console.log(`    ${result.reason}\n`);
    }
    process.exit(1);
  } else {
    console.log(`\n${GREEN}All SQL injection tests passed!${RESET}`);
    console.log(
      "The SQL parser and validator successfully blocked all injection attempts.\n",
    );
    process.exit(0);
  }
}

main();
