import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

for (const file of [".env.local", ".env"]) {
  try { loadEnvFile(file); } catch { /* optional local environment file */ }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
