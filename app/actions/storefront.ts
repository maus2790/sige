"use server";

import { db } from "@/db";
import { stores, products, comercialConfig, inventory } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { getSystemConfig } from "./config";

export async function getStoreDetails(storeId: string) {
  const config = await getSystemConfig();
  
  const getCached = unstable_cache(
    async (sId: string) => {
      try {
        const store = await db
          .select()
          .from(stores)
          .where(eq(stores.id, sId))
          .get();
        return store || null;
      } catch (error) {
        console.error("Error fetching store details:", error);
        return null;
      }
    },
    [`store-details-${storeId}`],
    { revalidate: config.cacheScrollEnabled ? config.marketCacheTtl : 15, tags: [`store-feed-${storeId}`, "all-store-feeds"] }
  );

  return getCached(storeId);
}

export async function getMyStoreId() {
  const user = await getCurrentUser();
  if (!user) return null;

  const store = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();
  
  return store?.id || null;
}

export async function getStoreProductsDirect(storeId: string, page: number = 1, limit: number = 20, search?: string, category?: string, isOwner: boolean = false) {
  try {
    const offset = (page - 1) * limit;

    const conditions = [
      eq(products.storeId, storeId)
    ];
    
    if (category && category !== "todos") {
      conditions.push(eq(products.category, category));
    }

    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(sql`(
        ${products.name} LIKE ${searchTerm} OR 
        COALESCE(${products.description}, '') LIKE ${searchTerm}
      )`);
      
      // Si no es el dueño, solo mostrar publicados en la búsqueda
      if (!isOwner) {
        conditions.push(eq(comercialConfig.isPublished, true));
      }
      console.log(`Buscando tienda ${storeId}: "${search}" (isOwner: ${!!isOwner})`);
    } else {
      // Si no hay búsqueda, siempre mostrar solo los publicados en este feed
      // Los borradores se cargan por separado en el componente StoreFeed
      conditions.push(eq(comercialConfig.isPublished, true));
    }

    const items = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        imageUrls: products.imageUrls,
        views: products.views,
        status: products.status,
        createdAt: products.createdAt,
        inventory: {
          stockActual: inventory.stockActual,
          stockMinimo: inventory.stockMinimo,
        },
        comercialConfig: {
          precioVenta: comercialConfig.precioVenta,
          precioOferta: sql<number>`CASE WHEN ${comercialConfig.ofertaPorcentaje} > 0 THEN ${comercialConfig.precioVenta} * (1 - ${comercialConfig.ofertaPorcentaje} / 100.0) ELSE NULL END`,
          ofertaPorcentaje: comercialConfig.ofertaPorcentaje,
          isPublished: comercialConfig.isPublished,
          esDestacado: comercialConfig.esDestacado,
        },
        store: {
          name: stores.name,
          phone: stores.phone,
        }
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
      .leftJoin(stores, eq(products.storeId, stores.id))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    return items;
  } catch (error) {
    console.error("Error fetching store products:", error);
    return [];
  }
}

export async function getStoreProducts(storeId: string, page: number = 1, limit: number = 20, search?: string, category?: string) {
  const config = await getSystemConfig();

  // Check ownership OUTSIDE the cache so it never gets cached
  const user = await getCurrentUser();
  const isOwner = user && (await db.select().from(stores).where(and(eq(stores.id, storeId), eq(stores.userId, user.id))).get());
  
  if (isOwner) {
    console.log(`[Store: Owner Detected 👑] Bypassing cache for store owner.`);
    return getStoreProductsDirect(storeId, page, limit, search, category, true);
  }

  // Always use the same cache key so revalidateTag("all-store-feeds") reliably invalidates it.
  // TTL adjusts based on Nivel 1 toggle.
  const ttl = config.cacheScrollEnabled ? config.marketCacheTtl : 30;
  const pageLimit = config.cacheScrollEnabled ? config.storeScrollLimit : 15;
  const label = config.cacheScrollEnabled ? "ON ⚡ Nivel 1" : "OFF 📁 Micro-30s";

  console.log(`[Store Cache: ${label}] TTL=${ttl}s | Store: ${storeId}, Page: ${page}`);

  const getCached = unstable_cache(
    async (sId: string, p: number, l: number, s?: string, c?: string) => {
      console.log(`[Store Cache MISS ❌] Querying Turso DB. Store: ${sId}, Page: ${p}`);
      return getStoreProductsDirect(sId, p, l, s, c, false);
    },
    [`store-products-${storeId}`],
    { revalidate: ttl, tags: [`store-feed-${storeId}`, "all-store-feeds"] }
  );

  return getCached(storeId, page, pageLimit, search, category);
}

export async function refreshStoreFeed(storeId: string) {
  console.log(`[Cache PURGE 🧹] Invalidating all global caches from store (market, stores, details).`);
  // @ts-ignore
  revalidateTag("market-feed");
  // @ts-ignore
  revalidateTag("all-store-feeds");
  // @ts-ignore
  revalidateTag("all-products");
  
  revalidatePath("/");
  revalidatePath(`/tienda/${storeId}`);
  return { success: true, message: "Caché global sincronizado" };
}

export async function getStoreProductsAllDirect(storeId: string) {
  try {
    const conditions = [
      eq(products.storeId, storeId),
      eq(comercialConfig.isPublished, true)
    ];

    const items = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        imageUrls: products.imageUrls,
        views: products.views,
        status: products.status,
        createdAt: products.createdAt,
        inventory: {
          stockActual: inventory.stockActual,
          stockMinimo: inventory.stockMinimo,
        },
        comercialConfig: {
          precioVenta: comercialConfig.precioVenta,
          precioOferta: sql<number>`CASE WHEN ${comercialConfig.ofertaPorcentaje} > 0 THEN ${comercialConfig.precioVenta} * (1 - ${comercialConfig.ofertaPorcentaje} / 100.0) ELSE NULL END`,
          ofertaPorcentaje: comercialConfig.ofertaPorcentaje,
          isPublished: comercialConfig.isPublished,
          esDestacado: comercialConfig.esDestacado,
        },
        store: {
          name: stores.name,
          phone: stores.phone,
        }
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
      .leftJoin(stores, eq(products.storeId, stores.id))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .all();

    return items;
  } catch (error) {
    console.error("Error fetching all store products:", error);
    return [];
  }
}

const getStoreProductsAllCached = unstable_cache(
  async (storeId: string) => {
    return getStoreProductsAllDirect(storeId);
  },
  ["store-products-all"],
  { revalidate: 300, tags: ["store-products"] }
);

export async function getStoreProductsAll(storeId: string) {
  const config = await getSystemConfig();
  if (config.isrEnabled) {
    return getStoreProductsAllCached(storeId);
  }
  return getStoreProductsAllDirect(storeId);
}

export async function getStoreDrafts(storeId: string, search?: string, category?: string) {
  try {
    // Verificar que es el dueño (se puede asumir que se valida en el componente o añadir chequeo aquí)
    const user = await getCurrentUser();
    if (!user) return [];

    const store = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.userId, user.id))
      .get();
      
    if (!store || store.id !== storeId) return [];

    const conditions = [
      eq(products.storeId, storeId),
      eq(comercialConfig.isPublished, false)
    ];

    if (category && category !== "todos") {
      conditions.push(eq(products.category, category));
    }

    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(sql`(
        ${products.name} LIKE ${searchTerm} OR 
        COALESCE(${products.description}, '') LIKE ${searchTerm}
      )`);
    }

    const items = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        imageUrls: products.imageUrls,
        views: products.views,
        status: products.status,
        createdAt: products.createdAt,
        inventory: {
          stockActual: inventory.stockActual,
          stockMinimo: inventory.stockMinimo,
        },
        comercialConfig: {
          precioVenta: comercialConfig.precioVenta,
          precioOferta: sql<number>`CASE WHEN ${comercialConfig.ofertaPorcentaje} > 0 THEN ${comercialConfig.precioVenta} * (1 - ${comercialConfig.ofertaPorcentaje} / 100.0) ELSE NULL END`,
          ofertaPorcentaje: comercialConfig.ofertaPorcentaje,
          isPublished: comercialConfig.isPublished,
          esDestacado: comercialConfig.esDestacado,
        },
        store: {
          name: stores.name,
          phone: stores.phone,
        }
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
      .leftJoin(stores, eq(products.storeId, stores.id))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .all();

    return items;
  } catch (error) {
    console.error("Error fetching store drafts:", error);
    return [];
  }
}
