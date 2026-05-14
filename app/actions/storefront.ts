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

export async function getStoreProducts(storeId: string, page: number = 1, limit: number = 20, search?: string, category?: string) {
  try {
    const offset = (page - 1) * limit;

    const user = await getCurrentUser();
    const isOwner = user && (await db.select().from(stores).where(and(eq(stores.id, storeId), eq(stores.userId, user.id))).get());

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
