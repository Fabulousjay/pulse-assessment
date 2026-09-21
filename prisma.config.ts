import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 reads migration/introspection connection details from here (the
// schema no longer holds a `url`). The Prisma CLI does not auto-load .env, so
// load it manually for local development (Node 20.12+ ships
// process.loadEnvFile). On Vercel, environment variables are already
// injected into process.env before the build runs, so this is skipped there.
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env is optional (e.g. on Vercel where vars are injected directly).
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env locally, or to your deployment platform's environment variables.",
  );
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: databaseUrl,
  },
});