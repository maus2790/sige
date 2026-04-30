// app/actions/inventory.ts

"use server";

import { db } from "@/db";
import { inventory, products, stores } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { requireRole } from "./auth";

/**
 * Actualiza los campos de inventario de un producto
 */
export async function updateInventoryItem(
  productId: string, 
  data: { 
    stockActual?: number; 
    stockMinimo?: number; 
    ubicacion?: string;
  }
) {
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    throw new Error("No tienes una tienda asociada");
  }

  // Verificar que el producto pertenezca al vendedor
  const product = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.storeId, store.id)))
    .get();

  if (!product) {
    throw new Error("Producto no encontrado o no tienes permiso");
  }

  // Verificar si existe el registro de inventario
  const existingInventory = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId))
    .get();

  console.log("Existing inventory for product:", productId, !!existingInventory);

  if (existingInventory) {
    const updateResult = await db
      .update(inventory)
      .set({ 
        ...data,
        updatedAt: new Date() 
      })
      .where(eq(inventory.productId, productId));
    console.log("Inventory updated:", updateResult);
  } else {
    const insertResult = await db.insert(inventory).values({
      id: randomUUID(),
      productId,
      stockActual: data.stockActual ?? 0,
      stockMinimo: data.stockMinimo ?? 5,
      ubicacion: data.ubicacion ?? "Sin asignar",
      updatedAt: new Date(),
    });
    console.log("Inventory inserted:", insertResult);
  }

  console.log("Revalidating paths...");
  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/productos");
  revalidatePath(`/productos/${productId}`);

  return { success: true };
}

/**
 * Actualiza el stock de un producto específico (Simplificado)
 */
export async function updateProductStock(productId: string, newStock: number) {
  return updateInventoryItem(productId, { stockActual: newStock });
}

/**
 * Actualización masiva de stock
 */
export async function bulkUpdateStock(updates: { productId: string; stock: number }[]) {
  const user = await requireRole("seller");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.userId, user.id))
    .get();

  if (!store) {
    throw new Error("No tienes una tienda asociada");
  }

  for (const update of updates) {
    await db
      .update(inventory)
      .set({ 
        stockActual: update.stock, 
        updatedAt: new Date() 
      })
      .where(eq(inventory.productId, update.productId));
  }

  revalidatePath("/dashboard/inventario");
  revalidatePath("/dashboard/productos");
  return { success: true };
}
