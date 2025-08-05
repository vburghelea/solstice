import { FullConfig } from "@playwright/test";

/**
 * Global setup to assign unique test accounts to each worker
 * This prevents state contamination between parallel test runs
 */
export default async function globalSetup(config: FullConfig) {
  // Get available test accounts from environment
  const accountsString = process.env["E2E_ACCOUNTS"] || process.env["E2E_TEST_EMAIL"];

  if (!accountsString) {
    console.warn("No E2E_ACCOUNTS configured, using default test account");
    return;
  }

  // If we have a comma-separated list, use it
  if (accountsString.includes(",")) {
    const accounts = accountsString.split(",").map((a) => a.trim());
    const workerIndex = parseInt(process.env["TEST_PARALLEL_INDEX"] || "0");

    if (accounts.length < config.workers!) {
      console.warn(
        `Only ${accounts.length} test accounts available for ${config.workers} workers. Some tests may conflict.`,
      );
    }

    // Assign account based on worker index
    const assignedAccount = accounts[workerIndex % accounts.length];
    process.env["E2E_WORKER_EMAIL"] = assignedAccount;
    process.env["E2E_WORKER_PASSWORD"] = `${assignedAccount.split("@")[0]}123`;

    console.log(`Worker ${workerIndex} assigned account: ${assignedAccount}`);
  }
}
