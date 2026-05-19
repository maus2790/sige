"use server";

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireRole } from "./auth";
import { systemConfig } from "@/db/schema";

// Initialize defaults if they don't exist
async function ensureConfigExists() {
  const defaults = [
    { key: "cache_scroll_enabled", value: "false" },
    { key: "isr_enabled", value: "false" },
    { key: "middleware_optimized", value: "false" },
    { key: "market_cache_ttl", value: "3600" },
    { key: "market_scroll_limit", value: "12" },
    { key: "store_scroll_limit", value: "12" },
    { key: "base_scroll_limit", value: "20" }
  ];

  for (const item of defaults) {
    try {
      await db.insert(systemConfig)
        .values(item)
        .onConflictDoNothing({ target: systemConfig.key });
    } catch (e) {
      console.error(`Error ensuring config ${item.key}:`, e);
    }
  }
}

export async function getSystemConfig() {
  await ensureConfigExists();

  const configs = await db
    .select()
    .from(systemConfig)
    .all();
  
  return {
    cacheScrollEnabled: configs.find(c => c.key === 'cache_scroll_enabled')?.value === 'true',
    isrEnabled: configs.find(c => c.key === 'isr_enabled')?.value === 'true',
    middlewareOptimized: configs.find(c => c.key === 'middleware_optimized')?.value === 'true',
    marketCacheTtl: parseInt(configs.find(c => c.key === 'market_cache_ttl')?.value || '3600', 10),
    marketScrollLimit: parseInt(configs.find(c => c.key === 'market_scroll_limit')?.value || '12', 10),
    storeScrollLimit: parseInt(configs.find(c => c.key === 'store_scroll_limit')?.value || '12', 10),
    baseScrollLimit: parseInt(configs.find(c => c.key === 'base_scroll_limit')?.value || '20', 10),
  };
}

export async function setSystemConfig(key: string, value: boolean | string | number) {
  await requireRole("superadmin");
  
  let stringValue = "";
  if (typeof value === "boolean") {
    stringValue = value ? 'true' : 'false';
  } else {
    stringValue = value.toString();
  }

  await db
    .update(systemConfig)
    .set({ value: stringValue, updatedAt: new Date() })
    .where(sql`${systemConfig.key} = ${key}`);
  
  // Revalidar el panel para ver cambios inmediatos y purgar cachés
  revalidatePath("/admin/optimizaciones");
  // @ts-ignore
  revalidateTag("market-feed");
  // Aquí idealmente purgaríamos todas las tiendas, pero como los tags de tienda son dinámicos ("store-feed-{id}"),
  // limpiar el path raíz sirve como fallback para caché de rutas, aunque el unstable_cache individual requeriría tags globales.
  // Vamos a añadir un tag global "all-store-feeds" a las tiendas para poder purgarlo.
  // @ts-ignore
  revalidateTag("all-store-feeds");
  // Purge all product details
  // @ts-ignore
  revalidateTag("all-products");
  
  return { success: true };
}

// Función para estimar capacidad basada en switches activos
export async function estimateCapacity() {
  const config = await getSystemConfig();
  
  let capacity = 500; // Base: 500 usuarios
  
  if (config.cacheScrollEnabled) capacity = 2000;
  if (config.isrEnabled) capacity = 5000;
  if (config.middlewareOptimized) capacity = 10000;
  
  return {
    simultaneousUsers: capacity,
    dailyUsers: capacity * 100, // estimación conservadora
    mode: config.cacheScrollEnabled ? (config.isrEnabled ? (config.middlewareOptimized ? 'COMPLETO' : 'ISR') : 'CACHÉ') : 'BASE',
    config,
  };
}
