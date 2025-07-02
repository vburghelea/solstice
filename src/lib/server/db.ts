import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../../db/schema";
import { getDbUrl } from "../env.server";

// Create a postgres connection
// This is used by the server-side auth configuration
const driver = postgres(getDbUrl());

export const db = drizzle({ client: driver, schema, casing: "snake_case" });
