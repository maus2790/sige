// migrate-comercial-config.ts
import "dotenv/config";
import { db } from "../db";
import { products, inventory, comercialConfig } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

async function migrate() {
  console.log("Starting migration...");
  
  // 1. Get existing data
  const allProducts = await db.select().from(products).all();
  const allInventory = await db.select().from(inventory).all();
  
  console.log(`Found ${allProducts.length} products and ${allInventory.length} inventory items.`);
  
  for (const product of allProducts) {
    const inv = allInventory.find(i => i.productId === product.id);
    
    // Check if config already exists
    const existing = await db.select().from(comercialConfig).where(eq(comercialConfig.productId, product.id)).get();
    
    if (!existing) {
      console.log(`Migrating product: ${product.name} (ID: ${product.id})`);
      
      await db.insert(comercialConfig).values({
        id: randomUUID(),
        productId: product.id,
        precioVenta: (product as any).price || 0, // Using any because schema might have changed already in code
        ofertaPorcentaje: (product as any).oferta || 0,
        isPublished: (inv as any)?.isPublished ?? true,
        precioAdquisicion: 0,
        esDestacado: false,
        updatedAt: new Date(),
      });
    } else {
      console.log(`Config already exists for product: ${product.name}`);
    }
  }
  
  console.log("Migration finished.");
}

migrate().catch(console.error);
