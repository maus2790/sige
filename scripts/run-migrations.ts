import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function splitSqlStatements(sql: string): string[] {
  return sql
    .split(";")
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith("--"));
}

async function runMigrations() {
  try {
    const migrationsDir = path.join(process.cwd(), "db", "migrations");
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, "utf-8");
      const statements = splitSqlStatements(sql);

      console.log(`Running migration: ${file}`);
      try {
        for (const stmt of statements) {
          await client.execute(stmt);
        }
        console.log(`✓ ${file} completed`);
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        if (
          errorMsg.includes("already exists") ||
          errorMsg.includes("duplicate") ||
          errorMsg.includes("UNIQUE constraint failed")
        ) {
          console.log(`⊘ ${file} (already applied, skipping)`);
        } else {
          throw error;
        }
      }
    }

    console.log("✓ All migrations completed!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
