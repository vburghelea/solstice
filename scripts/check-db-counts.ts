import postgres from "postgres";

const config = JSON.parse(process.env["SST_RESOURCE_Database"] || "{}");
if (!config.host) {
  console.error("No database config found");
  process.exit(1);
}

const sql = postgres({
  host: config.host,
  port: config.port,
  database: config.database,
  username: config.username,
  password: config.password,
  ssl: "require",
});

async function main() {
  const counts = await sql`
    SELECT 'organizations' as table_name, count(*)::int as cnt FROM organizations
    UNION ALL SELECT 'forms', count(*)::int FROM forms
    UNION ALL SELECT 'users', count(*)::int FROM "user"
    UNION ALL SELECT 'form_submissions', count(*)::int FROM form_submissions
    UNION ALL SELECT 'audit_logs', count(*)::int FROM audit_logs
  `;
  console.log("Current table counts:");
  console.table(counts);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
