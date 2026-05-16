"use server";

import { db } from "@/db";
import { stores, products, inventory, comercialConfig } from "@/db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { calculateDistance } from "@/lib/haversine";

export async function getNearbyStores(lat: number, lng: number, maxRadiusKm: number = 50) {
  try {
    const allStores = await db
      .select()
      .from(stores)
      .where(and(isNotNull(stores.latitude), isNotNull(stores.longitude)))
      .all();

    const storesWithDistance = allStores.map(store => {
      const distance = calculateDistance(
        lat, 
        lng, 
        store.latitude as number, 
        store.longitude as number
      );
      return { ...store, distance };
    });

    // Filter by radius and sort by distance
    return storesWithDistance
      .filter(s => maxRadiusKm === 0 || s.distance <= maxRadiusKm)
      .sort((a, b) => a.distance - b.distance);

  } catch (error) {
    console.error("Error fetching nearby stores:", error);
    return [];
  }
}

export async function searchProductsGeo(query: string, lat: number, lng: number, maxRadiusKm: number = 50) {
  if (!query || query.trim() === "") return [];

  try {
    const searchTerm = `%${query.trim()}%`;
    
    // First, find products matching query
    const matchingProducts = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        category: products.category,
        imageUrls: products.imageUrls,
        inventory: {
          stockActual: inventory.stockActual,
        },
        comercialConfig: {
          precioVenta: comercialConfig.precioVenta,
          precioOferta: sql<number>`CASE WHEN ${comercialConfig.ofertaPorcentaje} > 0 THEN ${comercialConfig.precioVenta} * (1 - ${comercialConfig.ofertaPorcentaje} / 100.0) ELSE NULL END`,
          isPublished: comercialConfig.isPublished,
        },
        store: {
          id: stores.id,
          name: stores.name,
          address: stores.address,
          latitude: stores.latitude,
          longitude: stores.longitude,
          logoUrl: stores.logoUrl,
        }
      })
      .from(products)
      .innerJoin(stores, eq(products.storeId, stores.id))
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .leftJoin(comercialConfig, eq(products.id, comercialConfig.productId))
      .where(
        and(
          eq(comercialConfig.isPublished, true),
          isNotNull(stores.latitude),
          isNotNull(stores.longitude),
          sql`(
            ${products.name} LIKE ${searchTerm} OR 
            COALESCE(${products.description}, '') LIKE ${searchTerm}
          )`
        )
      )
      .all();

    // Calculate distance and filter
    const productsWithDistance = matchingProducts.map(p => {
      const distance = calculateDistance(
        lat, 
        lng, 
        p.store.latitude as number, 
        p.store.longitude as number
      );
      return { ...p, distance };
    });

    return productsWithDistance
      .filter(p => maxRadiusKm === 0 || p.distance <= maxRadiusKm)
      .sort((a, b) => a.distance - b.distance);

  } catch (error) {
    console.error("Error searching products geo:", error);
    return [];
  }
}
