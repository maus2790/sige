// scripts/enable-isr.ts
// Run from project root: npx tsx scripts/enable-isr.ts
import "dotenv/config";
import { db } from "../db";
import { systemConfig } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Enabling isr_enabled...");
  await db
    .update(systemConfig)
    .set({ value: "true", updatedAt: new Date() })
    .where(eq(systemConfig.key, "isr_enabled"));
  const result = await db.select().from(systemConfig).where(eq(systemConfig.key, "isr_enabled")).get();
  console.log("Result:", result);
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
