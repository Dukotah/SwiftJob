import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Points to the file where all your tables are defined
  schema: "./db/schema.ts",

  // Where Drizzle will store the SQL migration files it generates
  out: "./db/migrations",

  // We're using Vercel Postgres (which is powered by Neon under the hood)
  dialect: "postgresql",

  dbCredentials: {
    // This comes from your Vercel Postgres dashboard — added to .env.local
    url: process.env.POSTGRES_URL!,
  },

  // Logs every SQL query Drizzle runs — helpful during development
  verbose: true,
  strict: true,
});
