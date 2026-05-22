import dotenv from "c:/REACT/sige/node_modules/dotenv";
dotenv.config({ path: "c:/REACT/sige/.env" });

async function main() {
  const { db } = await import("@/db");
  const { systemConfig } = await import("@/db/schema");

  const configs = await db.select().from(systemConfig);
  console.log("=== Configuración de Optimizaciones ===");
  configs.forEach(c => {
    console.log(`${c.key}: ${c.value} (Actualizado: ${c.updatedAt ? new Date(c.updatedAt).toLocaleString() : 'N/A'})`);
  });
  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
