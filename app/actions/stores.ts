"use server";

import { db } from "@/db";
import { stores, users } from "@/db/schema";
import { eq, and, desc, sql, ilike } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "./auth";

// ============================================
// ESQUEMAS DE VALIDACIÓN
// ============================================

const updateStoreSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  logoUrl: z.string().url("URL inválida").optional().nullable(),
  verified: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
});

// ============================================
// OBTENER TODAS LAS TIENDAS (ASISTENTE)
// ============================================

export async function getAllStores(
  page: number = 1,
  limit: number = 10,
  search?: string,
  verified?: boolean
) {
  await requireRole("assistant");

  const offset = (page - 1) * limit;
  const conditions = [];

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(
      sql`${stores.name} LIKE ${searchTerm} OR ${stores.description} LIKE ${searchTerm}`
    );
  }

  if (verified !== undefined) {
    conditions.push(eq(stores.verified, verified));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allStores = await db
    .select({
      id: stores.id,
      name: stores.name,
      description: stores.description,
      address: stores.address,
      phone: stores.phone,
      logoUrl: stores.logoUrl,
      verified: stores.verified,
      rating: stores.rating,
      createdAt: stores.createdAt,
      userId: stores.userId,
    })
    .from(stores)
    .where(whereClause)
    .orderBy(desc(stores.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  // Obtener información del usuario para cada tienda
  const storesWithUser = await Promise.all(
    allStores.map(async (store) => {
      const user = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, store.userId))
        .get();

      return {
        ...store,
        user,
      };
    })
  );

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(whereClause)
    .get();

  const total = totalResult?.count ?? 0;

  return {
    stores: storesWithUser,
    total,
    pageCount: Math.ceil(total / limit),
  };
}

// ============================================
// OBTENER TIENDA POR ID
// ============================================

export async function getStoreById(id: string) {
  await requireRole("assistant");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.id, id))
    .get();

  if (!store) {
    return null;
  }

  const user = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, store.userId))
    .get();

  const productsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(eq(stores.id, id))
    .get();

  return {
    ...store,
    user,
    productsCount: productsCount?.count || 0,
  };
}

// ============================================
// VERIFICAR TIENDA (ASISTENTE)
// ============================================

export async function verifyStore(storeId: string, verified: boolean) {
  await requireRole("assistant");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .get();

  if (!store) {
    return { error: "Tienda no encontrada" };
  }

  await db
    .update(stores)
    .set({
      verified: verified,
    })
    .where(eq(stores.id, storeId));

  revalidatePath("/assistant/tiendas");
  revalidatePath("/tiendas");

  return {
    success: true,
    message: verified ? "Tienda verificada correctamente" : "Verificación de tienda cancelada",
  };
}

// ============================================
// ACTUALIZAR TIENDA (ASISTENTE)
// ============================================

export async function updateStore(storeId: string, formData: FormData) {
  await requireRole("assistant");

  const store = await db
    .select()
    .from(stores)
    .where(eq(stores.id, storeId))
    .get();

  if (!store) {
    return { error: "Tienda no encontrada" };
  }

  const validatedFields = updateStoreSchema.safeParse({
    name: formData.get("name") || undefined,
    description: formData.get("description") || undefined,
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    logoUrl: formData.get("logoUrl") || undefined,
    verified: formData.get("verified") === "true",
    rating: formData.get("rating") ? parseFloat(formData.get("rating") as string) : undefined,
  });

  if (!validatedFields.success) {
    const firstError = validatedFields.error.issues[0];
    return {
      error: firstError.message,
    };
  }

  const updateData = validatedFields.data;

  await db
    .update(stores)
    .set({
      ...updateData,
    })
    .where(eq(stores.id, storeId));

  revalidatePath("/assistant/tiendas");
  revalidatePath(`/assistant/tiendas/${storeId}`);

  return {
    success: true,
    message: "Tienda actualizada correctamente",
  };
}

// ============================================
// OBTENER ESTADÍSTICAS DE TIENDAS
// ============================================

export async function getStoresStats() {
  await requireRole("assistant");

  const totalStores = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .get();

  const verifiedStores = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(eq(stores.verified, true))
    .get();

  const pendingStores = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(eq(stores.verified, false))
    .get();

  const activeSellers = await db
    .select({ count: sql<number>`count(distinct ${stores.userId})` })
    .from(stores)
    .get();

  return {
    totalStores: totalStores?.count || 0,
    verifiedStores: verifiedStores?.count || 0,
    pendingStores: pendingStores?.count || 0,
    activeSellers: activeSellers?.count || 0,
  };
}