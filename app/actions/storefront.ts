"use server";

import { db } from "@/db";
import { stores, products, comercialConfig, inventory } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getCurrentUser } from "./auth";

export async function getStoreDetails(storeId: string) {
  try {
    const store = await db
      .select()
      .from(stores)
      .where(eq(stores.id, storeId))
      .get();
    
    return store || null;
  } catch (error) {
    console.error("Error fetching store details:", error);
    return null;
  }
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

export async function getStoreProducts(storeId: string, page: number = 1, limit: number = 20, search?: string) {
  try {
    const offset = (page - 1) * limit;

    const conditions = [
      eq(products.storeId, storeId),
      eq(comercialConfig.isPublished, true)
    ];

    if (search && search.trim() !== "") {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(sql`(${products.name} LIKE ${searchTerm} OR ${products.description} LIKE ${searchTerm})`);
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
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
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

export async function getStoreDrafts(storeId: string) {
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
      })
      .from(products)
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
      .where(
        and(
          eq(products.storeId, storeId),
          eq(comercialConfig.isPublished, false)
        )
      )
      .orderBy(desc(products.createdAt))
      .all();

    return items;
  } catch (error) {
    console.error("Error fetching store drafts:", error);
    return [];
  }
}
