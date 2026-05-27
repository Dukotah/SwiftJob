import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

// This is the Drizzle database client.
// Import `db` anywhere in your app to run queries.
//
// Example usage:
//   import { db } from "@/db";
//   import { jobs } from "@/db/schema";
//   const allJobs = await db.select().from(jobs);

export const db = drizzle(sql, { schema });
