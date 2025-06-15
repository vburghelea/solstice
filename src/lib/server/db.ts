import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../../db/schema";

// Create a postgres connection
// This is used by the server-side auth configuration
const driver = postgres(process.env["DATABASE_URL"] as string);

export const db = drizzle({ client: driver, schema, casing: "snake_case" });
